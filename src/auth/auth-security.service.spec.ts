import { HttpException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { AuthSecurityService } from './auth-security.service';

describe('AuthSecurityService', () => {
  let service: AuthSecurityService;

  beforeEach(() => {
    service = new AuthSecurityService();
  });

  it('enforces OTP request rate limits', () => {
    service.assertOtpRequestRate('+998900000001', 1, 300);
    expect(() => service.assertOtpRequestRate('+998900000001', 1, 300)).toThrow(
      HttpException,
    );
  });

  it('validates 2FA challenge code', async () => {
    const hash = await bcrypt.hash('123456', 4);
    service.storeTwoFactorChallenge('challenge-id', 'user-id', hash, 60);
    await expect(
      service.validateTwoFactorChallenge(
        'challenge-id',
        'user-id',
        '123456',
        5,
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects invalid 2FA code', async () => {
    const hash = await bcrypt.hash('123456', 4);
    service.storeTwoFactorChallenge('challenge-id', 'user-id', hash, 60);
    await expect(
      service.validateTwoFactorChallenge('challenge-id', 'user-id', 'wrong', 5),
    ).rejects.toThrow('2FA code is invalid');
  });
});
