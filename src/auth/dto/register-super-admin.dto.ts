import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsPhoneNumber, IsString, IsUUID, Length, Matches } from 'class-validator';

export class RegisterSuperAdminDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @Matches(/^\+998\d{9}$/, {
    message: 'phone must be in +998XXXXXXXXX format',
  })
  phone!: string;

  @ApiProperty({ example: 'System Super Admin' })
  @IsString()
  @Length(2, 120)
  fullName!: string;

  @ApiProperty({
    required: false,
    description: 'Optional mahalla scope for super admin',
  })
  @IsOptional()
  @IsUUID()
  mahallaId?: string;
}
