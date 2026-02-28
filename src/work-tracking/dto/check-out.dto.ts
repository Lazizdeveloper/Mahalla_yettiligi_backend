import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsLatitude, IsLongitude, IsOptional, IsUUID } from 'class-validator';

export class CheckOutDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: string;
}
