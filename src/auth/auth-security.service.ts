import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';

interface RateWindowState {
  count: number;
  expiresAt: number;
}

interface TwoFactorChallengeState {
  userId: string;
  codeHash: string;
  attempts: number;
  expiresAt: number;
}

@Injectable()
export class AuthSecurityService {
  private readonly otpRequestWindows = new Map<string, RateWindowState>();
  private readonly otpVerifyWindows = new Map<string, RateWindowState>();
  private readonly twoFactorChallenges = new Map<
    string,
    TwoFactorChallengeState
  >();

  assertOtpRequestRate(phone: string, max: number, windowSeconds: number) {
    this.assertRateLimit(
      this.otpRequestWindows,
      `request:${phone}`,
      max,
      windowSeconds,
      'OTP request rate limit reached',
    );
  }

  assertOtpVerifyRate(phone: string, max: number, windowSeconds: number) {
    this.assertRateLimit(
      this.otpVerifyWindows,
      `verify:${phone}`,
      max,
      windowSeconds,
      'OTP verify rate limit reached',
    );
  }

  storeTwoFactorChallenge(
    challengeId: string,
    userId: string,
    codeHash: string,
    ttlSeconds: number,
  ) {
    this.cleanupExpiredTwoFactorChallenges();
    this.twoFactorChallenges.set(challengeId, {
      userId,
      codeHash,
      attempts: 0,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async validateTwoFactorChallenge(
    challengeId: string,
    userId: string,
    incomingCode: string,
    maxAttempts: number,
  ) {
    this.cleanupExpiredTwoFactorChallenges();

    const challenge = this.twoFactorChallenges.get(challengeId);
    if (!challenge || challenge.userId !== userId) {
      throw new UnauthorizedException('2FA challenge is invalid');
    }

    if (challenge.attempts >= maxAttempts) {
      this.twoFactorChallenges.delete(challengeId);
      throw new UnauthorizedException('2FA attempt limit reached');
    }

    if (challenge.expiresAt <= Date.now()) {
      this.twoFactorChallenges.delete(challengeId);
      throw new UnauthorizedException('2FA challenge is expired');
    }

    const isCodeValid = await bcrypt.compare(incomingCode, challenge.codeHash);
    if (!isCodeValid) {
      challenge.attempts += 1;
      this.twoFactorChallenges.set(challengeId, challenge);
      throw new UnauthorizedException('2FA code is invalid');
    }

    this.twoFactorChallenges.delete(challengeId);
  }

  private assertRateLimit(
    store: Map<string, RateWindowState>,
    key: string,
    max: number,
    windowSeconds: number,
    errorMessage: string,
  ) {
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.expiresAt <= now) {
      store.set(key, {
        count: 1,
        expiresAt: now + windowSeconds * 1000,
      });
      return;
    }

    if (current.count >= max) {
      throw new HttpException(errorMessage, HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
    store.set(key, current);
  }

  private cleanupExpiredTwoFactorChallenges() {
    const now = Date.now();
    for (const [key, value] of this.twoFactorChallenges.entries()) {
      if (value.expiresAt <= now) {
        this.twoFactorChallenges.delete(key);
      }
    }
  }
}
