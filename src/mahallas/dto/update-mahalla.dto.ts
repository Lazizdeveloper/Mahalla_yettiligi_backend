import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateMahallaDto {
  @ApiPropertyOptional({ example: 'Toshkent Shahri' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  regionName?: string;

  @ApiPropertyOptional({ example: 'Yunusobod tumani' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  districtName?: string;

  @ApiPropertyOptional({ example: 'Obod Mahalla' })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;
}
