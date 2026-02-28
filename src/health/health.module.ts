import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { SlaModule } from '../sla/sla.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [ConfigModule, DatabaseModule, SlaModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
