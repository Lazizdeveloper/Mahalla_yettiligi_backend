import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateMahallaDto {
  @ApiProperty({ example: 'Toshkent Shahri' })
  @IsString()
  @Length(2, 120)
  regionName!: string;

  @ApiProperty({ example: 'Yunusobod tumani' })
  @IsString()
  @Length(2, 120)
  districtName!: string;

  @ApiProperty({ example: 'Obod Mahalla' })
  @IsString()
  @Length(2, 120)
  name!: string;
}
