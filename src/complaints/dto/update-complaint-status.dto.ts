import { ApiProperty } from '@nestjs/swagger';
import { ComplaintStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateComplaintStatusDto {
  @ApiProperty({ enum: ComplaintStatus })
  @IsEnum(ComplaintStatus)
  status!: ComplaintStatus;
}
