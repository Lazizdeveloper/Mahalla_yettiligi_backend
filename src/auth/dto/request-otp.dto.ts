import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, Matches } from 'class-validator';

export class RequestOtpDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @Matches(/^\+998\d{9}$/, {
    message: 'phone must be in +998XXXXXXXXX format',
  })
  phone!: string;
}
