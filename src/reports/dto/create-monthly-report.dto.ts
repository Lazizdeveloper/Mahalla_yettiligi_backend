import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MonthlyReportStatus } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReportItemInputDto {
  @ApiProperty()
  @IsString()
  @Length(2, 255)
  workName!: string;

  @ApiProperty()
  @IsDateString()
  workDate!: string;

  @ApiProperty()
  @IsString()
  @Length(2, 5000)
  resultText!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsUUID('4', { each: true })
  evidenceMediaIds?: string[];
}

export class CreateMonthlyReportDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  mahallaId?: string;

  @ApiProperty({ example: '2026-02' })
  @IsString()
  @Length(7, 7)
  month!: string;

  @ApiProperty()
  @IsString()
  @Length(3, 5000)
  summary!: string;

  @ApiPropertyOptional({
    enum: MonthlyReportStatus,
    default: MonthlyReportStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(MonthlyReportStatus)
  status?: MonthlyReportStatus = MonthlyReportStatus.DRAFT;

  @ApiProperty({ type: [ReportItemInputDto] })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ReportItemInputDto)
  items!: ReportItemInputDto[];
}
