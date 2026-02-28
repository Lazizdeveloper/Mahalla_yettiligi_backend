import { Module } from '@nestjs/common';
import { WorkTrackingController } from './work-tracking.controller';
import { WorkTrackingService } from './work-tracking.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [WorkTrackingController],
  providers: [WorkTrackingService],
})
export class WorkTrackingModule {}
