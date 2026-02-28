import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ErpComplaintPushDto {
  @ApiProperty()
  @IsUUID()
  complaintId!: string;
}
