import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RatingVerdict } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty()
  @IsUUID()
  reportId!: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiProperty({ enum: RatingVerdict })
  @IsEnum(RatingVerdict)
  verdict!: RatingVerdict;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}
