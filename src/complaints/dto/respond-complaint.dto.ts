import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RespondComplaintDto {
  @ApiProperty()
  @IsString()
  @Length(2, 5000)
  responseText!: string;
}
