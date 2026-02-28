import bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const prismaMock = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    otpCode: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    staffProfile: {
      findUnique: jest.fn(),
    },
  };

  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configValues: Record<string, unknown> = {
    'app.environment': 'development',
    'otp.ttlSeconds': 300,
    'otp.maxAttempts': 5,
    'otp.requestWindowSeconds': 600,
    'otp.requestMax': 5,
    'otp.verifyWindowSeconds': 300,
    'otp.verifyMax': 10,
    'jwt.accessSecret': 'access-secret',
    'jwt.refreshSecret': 'refresh-secret',
    'jwt.accessTtl': '15m',
    'jwt.refreshTtl': '7d',
    'twoFactor.enforceForPrivileged': true,
    'twoFactor.ttlSeconds': 300,
    'twoFactor.maxAttempts': 5,
    'security.bcryptSaltRounds': 4,
  };

  const configServiceMock = {
    get: jest.fn((key: string, fallback?: unknown) =>
      key in configValues ? configValues[key] : fallback,
    ),
  };

  const integrationsServiceMock = {
    sendSms: jest.fn(),
  };

  const authSecurityServiceMock = {
    assertOtpRequestRate: jest.fn(),
    assertOtpVerifyRate: jest.fn(),
    storeTwoFactorChallenge: jest.fn(),
    validateTwoFactorChallenge: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prismaMock as never,
      jwtServiceMock as never,
      configServiceMock as never,
      integrationsServiceMock as never,
      authSecurityServiceMock as never,
    );
    integrationsServiceMock.sendSms.mockResolvedValue({ status: 'queued' });
    authSecurityServiceMock.validateTwoFactorChallenge.mockResolvedValue(
      undefined,
    );
    jwtServiceMock.signAsync.mockImplementation(
      (
        payload: Record<string, unknown>,
        options: { secret?: string } | undefined,
      ) => {
        if (payload.type === 'two_factor') {
          return Promise.resolve('pending-two-factor-token');
        }
        return Promise.resolve(
          options?.secret === 'access-secret'
            ? 'access-token'
            : 'refresh-token',
        );
      },
    );
  });

  it('returns generic message when account does not exist', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const result = await service.requestOtp({ phone: '+998900000001' });

    expect(result).toEqual({
      message: 'If the account exists, an OTP has been sent',
    });
    expect(prismaMock.otpCode.create).not.toHaveBeenCalled();
    expect(integrationsServiceMock.sendSms).not.toHaveBeenCalled();
  });

  it('creates OTP and sends SMS for existing account', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-1' });
    prismaMock.otpCode.create.mockResolvedValue({ id: 'otp-1' });

    const result = await service.requestOtp({ phone: '+998900000001' });

    expect(result.message).toBe('If the account exists, an OTP has been sent');
    expect(result.otpCode).toHaveLength(6);
    expect(prismaMock.otpCode.create).toHaveBeenCalledTimes(1);
    expect(integrationsServiceMock.sendSms).toHaveBeenCalledTimes(1);
  });

  it('returns 2FA challenge for privileged roles', async () => {
    prismaMock.otpCode.findFirst.mockResolvedValue({
      id: 'otp-1',
      codeHash: await bcrypt.hash('123456', 4),
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });
    prismaMock.user.findFirst.mockResolvedValue({
      id: 'admin-1',
      phone: '+998900000001',
      role: 'SUPER_ADMIN',
      fullName: 'Admin',
      deletedAt: null,
    });
    prismaMock.otpCode.update.mockResolvedValue({});

    const response = await service.verifyOtp({
      phone: '+998900000001',
      code: '123456',
    });

    expect(response).toMatchObject({
      requiresTwoFactor: true,
      pendingTwoFactorToken: 'pending-two-factor-token',
      expiresInSeconds: 300,
    });
    expect(
      authSecurityServiceMock.storeTwoFactorChallenge,
    ).toHaveBeenCalledTimes(1);
  });

  it('verifies 2FA token and returns auth tokens', async () => {
    const tokenResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 'user-1',
        phone: '+998900000001',
        fullName: 'Name',
        role: 'STAFF',
      },
    };
    jest
      .spyOn(service as never, 'issueTokens' as never)
      .mockResolvedValue(tokenResponse as never);

    jwtServiceMock.verifyAsync.mockResolvedValue({
      sub: 'user-1',
      phone: '+998900000001',
      role: 'STAFF',
      challengeId: 'challenge-id',
      type: 'two_factor',
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      phone: '+998900000001',
      role: 'STAFF',
      fullName: 'Name',
      deletedAt: null,
    });

    const result = await service.verifyTwoFactor({
      pendingTwoFactorToken: 'pending-token',
      code: '111111',
    });

    expect(result).toEqual(tokenResponse);
    expect(
      authSecurityServiceMock.validateTwoFactorChallenge,
    ).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid 2FA token', async () => {
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(
      service.verifyTwoFactor({
        pendingTwoFactorToken: 'bad-token',
        code: '111111',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes refresh token and rotates tokens', async () => {
    jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 'user-1' });
    prismaMock.refreshToken.findMany.mockResolvedValue([
      {
        id: 'refresh-record-1',
        tokenHash: await bcrypt.hash('refresh-token-raw', 4),
        revokedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: {
          id: 'user-1',
          phone: '+998900000001',
          role: 'RESIDENT',
          fullName: 'Resident',
        },
      },
    ]);
    prismaMock.refreshToken.update.mockResolvedValue({});
    prismaMock.refreshToken.create.mockResolvedValue({});

    const result = await service.refresh('refresh-token-raw');

    expect(prismaMock.refreshToken.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.refreshToken.create).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
  });
});
