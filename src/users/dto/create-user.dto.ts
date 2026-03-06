import { ApiProperty } from '@nestjs/swagger';
import { StaffPosition } from '@prisma/client';
import {
  IsDefined,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: '+998901234567' })
  @IsPhoneNumber('UZ')
  @Matches(/^\+998\d{9}$/, {
    message: 'phone must be in +998XXXXXXXXX format',
  })
  phone!: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  fullName!: string;

  @ApiProperty({ enum: Role, example: Role.RESIDENT })
  @IsEnum(Role)
  role!: Role;

  @ApiProperty({
    required: false,
    description: 'Required for RESIDENT and STAFF roles',
  })
  @ValidateIf((dto: CreateUserDto) =>
    [Role.RESIDENT, Role.STAFF].includes(dto.role),
  )
  @IsDefined({ message: 'mahallaId is required for RESIDENT and STAFF' })
  @IsUUID()
  mahallaId?: string;

  @ApiProperty({ enum: StaffPosition, required: false })
  @IsOptional()
  @IsEnum(StaffPosition)
  staffPosition?: StaffPosition;
}
