import { ApiProperty } from '@nestjs/swagger';
import { IsPhoneNumber, IsString, IsUUID, Length, Matches } from 'class-validator';

export class RegisterAholiUserDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @Matches(/^\+998\d{9}$/, {
    message: 'phone must be in +998XXXXXXXXX format',
  })
  phone!: string;

  @ApiProperty({ example: 'Aholi Foydalanuvchi' })
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @ApiProperty({ example: 'c3f31bbf-70c0-4d9f-8b18-4cb6fae5b4ce' })
  @IsUUID()
  mahallaId!: string;
}
