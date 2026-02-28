import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, Length } from 'class-validator';

export class SmsSendDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  phone!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 1000)
  message!: string;
}
