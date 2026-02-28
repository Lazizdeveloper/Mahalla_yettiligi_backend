import { ApiProperty } from '@nestjs/swagger';
import { StaffPosition } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  phone!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName!: string;

  @ApiProperty({ enum: Role, example: Role.RESIDENT })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  mahallaId?: string;

  @ApiProperty({ enum: StaffPosition, required: false })
  @IsOptional()
  @IsEnum(StaffPosition)
  staffPosition?: StaffPosition;
}
