import { Module } from '@nestjs/common';
import { SlaService } from './sla.service';
import { DatabaseModule } from '../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, NotificationsModule, AuditModule],
  providers: [SlaService],
  exports: [SlaService],
})
export class SlaModule {}
