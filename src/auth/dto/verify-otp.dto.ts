import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  phone!: string;

  @ApiProperty({ example: '123456' })
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
