import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  const prismaMock = {
    $queryRaw: jest.fn(),
  };
  const configMock = {
    get: jest.fn(),
  };
  const slaServiceMock = {
    getHealth: jest.fn(),
  };

  beforeEach(() => {
    prismaMock.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    configMock.get.mockImplementation((key: string, fallback: unknown) => {
      const map: Record<string, unknown> = {
        'redis.host': '127.0.0.1',
        'redis.port': 6379,
        'redis.password': '',
      };
      return key in map ? map[key] : fallback;
    });
    slaServiceMock.getHealth.mockReturnValue({
      scheduler: 'EVERY_5_MINUTES',
      lastRunAt: null,
      lastSuccessAt: null,
      lastError: null,
      healthy: true,
    });
    service = new HealthService(
      prismaMock as never,
      configMock as never,
      slaServiceMock as never,
    );
  });

  it('should return ok status', () => {
    const result = service.check();
    expect(result.status).toBe('ok');
    expect(result.timestamp).toBeDefined();
  });

  it('should provide readiness payload', async () => {
    const readiness = await service.readiness();
    expect(readiness.timestamp).toBeDefined();
    expect(readiness.checks.database).toBeDefined();
    expect(readiness.checks.redis).toBeDefined();
    expect(readiness.checks.sla).toBeDefined();
  });
});
