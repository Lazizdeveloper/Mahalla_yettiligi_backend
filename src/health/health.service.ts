import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../database/prisma.service';
import { SlaService } from '../sla/sla.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly slaService: SlaService,
  ) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async readiness() {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);
    const sla = this.slaService.getHealth();

    const healthy = database.healthy && redis.healthy && sla.healthy;

    return {
      status: healthy ? 'ready' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database,
        redis,
        sla,
      },
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown DB error',
      };
    }
  }

  private async checkRedis() {
    const host = this.configService.get<string>('redis.host', '127.0.0.1');
    const port = this.configService.get<number>('redis.port', 6379);
    const password =
      this.configService.get<string>('redis.password') || undefined;

    const client = new Redis({
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
    });

    try {
      await this.withTimeout(client.connect(), 1500);
      const pong = await this.withTimeout(client.ping(), 1500);
      return {
        healthy: pong === 'PONG',
      };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown Redis error',
      };
    } finally {
      client.disconnect();
    }
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error: unknown) => {
          clearTimeout(timer);
          reject(
            error instanceof Error ? error : new Error('Unknown async error'),
          );
        });
    });
  }
}
