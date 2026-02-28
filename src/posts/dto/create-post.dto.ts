import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @Length(3, 255)
  title!: string;

  @ApiProperty()
  @IsString()
  @Length(3, 10000)
  content!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  mahallaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishDate?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  mediaIds?: string[];
}
