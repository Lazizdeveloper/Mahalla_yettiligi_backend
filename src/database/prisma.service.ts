import { INestApplication, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    if (process.env.SKIP_DB_CONNECT === 'true') {
      return;
    }

    const retryCount = Number.parseInt(process.env.DB_CONNECT_RETRIES ?? '5', 10);
    const retryDelayMs = Number.parseInt(process.env.DB_CONNECT_RETRY_DELAY_MS ?? '2000', 10);
    const maxAttempts = Number.isNaN(retryCount) ? 6 : Math.max(1, retryCount + 1);
    const delayMs = Number.isNaN(retryDelayMs) ? 2000 : Math.max(250, retryDelayMs);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await this.$connect();
        if (attempt > 1) {
          this.logger.log(`Prisma connected after retry (${attempt}/${maxAttempts})`);
        }
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }

        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Prisma connect failed (attempt ${attempt}/${maxAttempts}): ${message}. Retrying in ${delayMs}ms...`,
        );
        await this.sleep(delayMs);
      }
    }
  }

  enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', () => {
      void app.close();
    });
  }

  private async sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
