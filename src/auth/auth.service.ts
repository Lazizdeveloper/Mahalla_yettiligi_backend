import { createHash, randomInt, randomUUID } from 'crypto';
import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../database/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { AuthSecurityService } from './auth-security.service';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';

interface TwoFactorJwtPayload {
  sub: string;
  phone: string;
  role: Role;
  challengeId: string;
  type: 'two_factor';
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly integrationsService: IntegrationsService,
    private readonly authSecurityService: AuthSecurityService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    this.authSecurityService.assertOtpRequestRate(
      dto.phone,
      this.configService.get<number>('otp.requestMax', 5),
      this.configService.get<number>('otp.requestWindowSeconds', 600),
    );

    const user = await this.prisma.user.findFirst({
      where: {
        phone: dto.phone,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!user) {
      return { message: 'If the account exists, an OTP has been sent' };
    }

    const otp = `${randomInt(0, 1_000_000)}`.padStart(6, '0');
    const ttlSeconds = this.configService.get<number>('otp.ttlSeconds', 300);

    await this.prisma.otpCode.create({
      data: {
        phone: dto.phone,
        codeHash: await this.hashWithBcrypt(otp),
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });

    const environment = this.configService.get<string>(
      'app.environment',
      'development',
    );

    try {
      await this.integrationsService.sendSms({
        phone: dto.phone,
        message: `Your OTP code is: ${otp}. It expires in ${Math.floor(ttlSeconds / 60)} minutes.`,
      });
    } catch {
      throw new ServiceUnavailableException('Failed to send OTP SMS');
    }

    return {
      message: 'If the account exists, an OTP has been sent',
      otpCode: environment === 'production' ? undefined : otp,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    this.authSecurityService.assertOtpVerifyRate(
      dto.phone,
      this.configService.get<number>('otp.verifyMax', 10),
      this.configService.get<number>('otp.verifyWindowSeconds', 300),
    );

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone: dto.phone,
        consumedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new UnauthorizedException('OTP is not found');
    }

    const maxAttempts = this.configService.get<number>('otp.maxAttempts', 5);

    if (otpRecord.attempts >= maxAttempts) {
      throw new UnauthorizedException('OTP attempt limit reached');
    }

    if (otpRecord.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('OTP is expired');
    }

    const isOtpCodeValid = await this.compareBcrypt(
      dto.code,
      otpRecord.codeHash,
    );
    if (!isOtpCodeValid) {
      await this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('OTP is invalid');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        phone: dto.phone,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User is not found');
    }

    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { consumedAt: new Date() },
    });

    if (await this.shouldRequireTwoFactor(user)) {
      return this.issueTwoFactorChallenge(user);
    }

    return this.issueTokens(user);
  }

  async verifyTwoFactor(dto: VerifyTwoFactorDto) {
    const payload = await this.verifyTwoFactorToken(dto.pendingTwoFactorToken);
    const maxAttempts = this.configService.get<number>(
      'twoFactor.maxAttempts',
      5,
    );

    await this.authSecurityService.validateTwoFactorChallenge(
      payload.challengeId,
      payload.sub,
      dto.code,
      maxAttempts,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User is not found');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const userId = await this.verifyRefreshToken(refreshToken);

    const tokenRecords = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    const tokenRecord = await this.findMatchingRefreshToken(
      tokenRecords,
      refreshToken,
    );

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(tokenRecord.user);
  }

  async logout(refreshToken: string, userId: string) {
    const tokenRecords = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        tokenHash: true,
      },
    });

    const matchedRecord = await this.findMatchingRefreshToken(
      tokenRecords,
      refreshToken,
    );

    if (matchedRecord) {
      await this.prisma.refreshToken.update({
        where: { id: matchedRecord.id },
        data: { revokedAt: new Date() },
      });
    }

    return { success: true };
  }

  private async shouldRequireTwoFactor(user: User) {
    const role = user.role as string;
    const enforceForPrivileged = this.configService.get<boolean>(
      'twoFactor.enforceForPrivileged',
      true,
    );

    if (!enforceForPrivileged || role === 'RESIDENT') {
      return false;
    }

    if (role === 'STAFF') {
      const staffProfile = await this.prisma.staffProfile.findUnique({
        where: { userId: user.id },
        select: { twoFaRequired: true },
      });

      return staffProfile?.twoFaRequired ?? true;
    }

    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  }

  private async issueTwoFactorChallenge(user: User) {
    const code = `${randomInt(0, 1_000_000)}`.padStart(6, '0');
    const ttlSeconds = this.configService.get<number>(
      'twoFactor.ttlSeconds',
      300,
    );
    const challengeId = randomUUID();

    this.authSecurityService.storeTwoFactorChallenge(
      challengeId,
      user.id,
      await this.hashWithBcrypt(code),
      ttlSeconds,
    );

    try {
      await this.integrationsService.sendSms({
        phone: user.phone,
        message: `Your 2FA verification code is: ${code}.`,
      });
    } catch {
      throw new ServiceUnavailableException(
        'Failed to send 2FA verification code',
      );
    }

    const pendingTwoFactorToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        phone: user.phone,
        role: user.role as Role,
        challengeId,
        type: 'two_factor',
      },
      {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: `${ttlSeconds}s`,
      },
    );

    const environment = this.configService.get<string>(
      'app.environment',
      'development',
    );

    return {
      requiresTwoFactor: true,
      pendingTwoFactorToken,
      expiresInSeconds: ttlSeconds,
      twoFactorCode: environment === 'production' ? undefined : code,
    };
  }

  private async issueTokens(user: User) {
    const payload = {
      sub: user.id,
      phone: user.phone,
      role: user.role as Role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.accessSecret'),
      expiresIn: this.configService.get<string>(
        'jwt.accessTtl',
        '15m',
      ) as never,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: this.configService.get<string>(
        'jwt.refreshTtl',
        '7d',
      ) as never,
    });

    const refreshTtlMs = this.parseDurationToMs(
      this.configService.get<string>('jwt.refreshTtl', '7d'),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await this.hashWithBcrypt(refreshToken),
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  private async hashWithBcrypt(value: string) {
    const saltRounds = this.configService.get<number>(
      'security.bcryptSaltRounds',
      10,
    );
    return bcrypt.hash(value, saltRounds);
  }

  private async compareBcrypt(value: string, hash: string) {
    return bcrypt.compare(value, hash);
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(
        refreshToken,
        {
          secret: this.configService.get<string>('jwt.refreshSecret'),
        },
      );

      if (!payload.sub) {
        throw new UnauthorizedException('Refresh token is invalid');
      }

      return payload.sub;
    } catch {
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }

  private async findMatchingRefreshToken<
    T extends { id: string; tokenHash: string; user?: User | null },
  >(records: T[], refreshToken: string) {
    for (const record of records) {
      const isMatch = await this.isRefreshTokenMatch(
        refreshToken,
        record.tokenHash,
      );
      if (isMatch) {
        return record;
      }
    }

    return null;
  }

  private async isRefreshTokenMatch(
    refreshToken: string,
    storedTokenHash: string,
  ) {
    if (storedTokenHash.startsWith('$2')) {
      return this.compareBcrypt(refreshToken, storedTokenHash);
    }

    // Backward compatibility for legacy SHA-256 token hashes.
    const legacyHash = createHash('sha256').update(refreshToken).digest('hex');
    return legacyHash === storedTokenHash;
  }

  private async verifyTwoFactorToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<TwoFactorJwtPayload>(
        token,
        {
          secret: this.configService.get<string>('jwt.accessSecret'),
        },
      );

      if (
        payload.type !== 'two_factor' ||
        !payload.challengeId ||
        !payload.sub
      ) {
        throw new UnauthorizedException('2FA challenge token is invalid');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('2FA challenge token is invalid');
    }
  }

  private parseDurationToMs(duration: string): number {
    const numeric = Number.parseInt(duration.slice(0, -1), 10);
    const unit = duration.slice(-1);

    if (Number.isNaN(numeric)) {
      return 7 * 24 * 60 * 60 * 1000;
    }

    switch (unit) {
      case 'm':
        return numeric * 60 * 1000;
      case 'h':
        return numeric * 60 * 60 * 1000;
      case 'd':
        return numeric * 24 * 60 * 60 * 1000;
      default:
        return numeric * 1000;
    }
  }
}
