import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

class AuthenticatedProfileDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty({ enum: Role })
  role!: Role;
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ type: AuthenticatedProfileDto })
  user!: AuthenticatedProfileDto;
}
