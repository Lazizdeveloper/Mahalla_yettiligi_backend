import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ESignRequestDto {
  @ApiProperty()
  @IsString()
  @Length(10, 10000)
  content!: string;
}
