import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreateComplaintDto {
  @ApiProperty()
  @IsString()
  @Length(2, 120)
  category!: string;

  @ApiProperty()
  @IsString()
  @Length(5, 5000)
  description!: string;

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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  mediaIds?: string[];
}
