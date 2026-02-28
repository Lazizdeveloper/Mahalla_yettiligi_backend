import { Module } from '@nestjs/common';
import { MahallasController } from './mahallas.controller';
import { MahallasService } from './mahallas.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [MahallasController],
  providers: [MahallasService],
  exports: [MahallasService],
})
export class MahallasModule {}
