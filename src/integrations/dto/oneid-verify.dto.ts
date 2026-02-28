import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class OneIdVerifyDto {
  @ApiProperty()
  @IsString()
  @Length(10, 2048)
  token!: string;
}
