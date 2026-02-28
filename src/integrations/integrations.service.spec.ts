import { InternalServerErrorException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

describe('IntegrationsService', () => {
  const configMock = {
    get: jest.fn(),
  };

  let service: IntegrationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    configMock.get.mockImplementation((key: string, fallback?: unknown) => {
      const map: Record<string, unknown> = {
        'integrations.sms.provider': 'mock',
        'integrations.oneId.provider': 'mock-oneid',
        'integrations.geo.provider': 'mock-geo-api',
        'integrations.eSign.provider': 'mock-e-sign',
        'integrations.erp.provider': 'mock-erp',
      };
      return key in map ? map[key] : fallback;
    });
    service = new IntegrationsService(configMock as never);
  });

  it('sends SMS through mock provider', async () => {
    const result = await service.sendSms({
      phone: '+998900000001',
      message: 'Test',
    });

    expect(result.provider).toBe('mock-sms-gateway');
    expect(result.status).toBe('queued');
  });

  it('fails twilio mode without credentials', async () => {
    configMock.get.mockImplementation((key: string, fallback?: unknown) => {
      if (key === 'integrations.sms.provider') {
        return 'twilio';
      }
      return fallback;
    });

    await expect(
      service.sendSms({ phone: '+998900000001', message: 'Test' }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('returns oneid verification payload', () => {
    const result = service.verifyOneId({
      token: 'very-long-token-value',
    });

    expect(result.provider).toBe('mock-oneid');
    expect(result.verified).toBe(true);
    expect(result.externalUserId).toBeDefined();
  });
});
