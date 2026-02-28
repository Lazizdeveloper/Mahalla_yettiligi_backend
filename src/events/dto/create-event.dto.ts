import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @Length(2, 255)
  title!: string;

  @ApiProperty()
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(2, 255)
  locationName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  mahallaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  responsibleUserId?: string;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  participantCount?: number = 0;
}
