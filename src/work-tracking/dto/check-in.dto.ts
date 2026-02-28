import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsOptional, IsUUID } from 'class-validator';

export class CheckInDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  mahallaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: string;
}
