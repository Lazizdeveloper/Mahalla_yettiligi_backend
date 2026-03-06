import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class PublicLocationSuggestDto {
  @ApiPropertyOptional({ description: 'Search text', example: 'Samar' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  limit?: number = 12;
}

export class PublicDistrictSuggestDto extends PublicLocationSuggestDto {
  @ApiPropertyOptional({ description: 'Region UUID from backend' })
  @IsUUID()
  regionId!: string;
}

export class PublicMahallaSuggestDto extends PublicLocationSuggestDto {
  @ApiPropertyOptional({ description: 'District UUID from backend' })
  @IsUUID()
  districtId!: string;
}
