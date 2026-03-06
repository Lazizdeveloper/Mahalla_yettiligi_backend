import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, Length, Matches } from 'class-validator';

export class SmsSendDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @Matches(/^\+998\d{9}$/, {
    message: 'phone must be in +998XXXXXXXXX format',
  })
  phone!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 1000)
  message!: string;
}
