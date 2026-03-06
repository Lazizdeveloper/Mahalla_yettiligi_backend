import { ApiPropertyOptional } from '@nestjs/swagger';
import { StaffPosition } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: '+998901234567' })
  @IsOptional()
  @IsPhoneNumber('UZ')
  @Matches(/^\+998\d{9}$/, {
    message: 'phone must be in +998XXXXXXXXX format',
  })
  phone?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Required when target role is RESIDENT or STAFF',
  })
  @IsOptional()
  @IsUUID()
  mahallaId?: string;

  @ApiPropertyOptional({ enum: StaffPosition })
  @IsOptional()
  @IsEnum(StaffPosition)
  staffPosition?: StaffPosition;
}
