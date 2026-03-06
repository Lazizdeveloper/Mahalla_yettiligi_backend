import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @Matches(/^\+998\d{9}$/, {
    message: 'phone must be in +998XXXXXXXXX format',
  })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  code!: string;
}
