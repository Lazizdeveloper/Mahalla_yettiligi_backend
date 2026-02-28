import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TwoFactorChallengeDto {
  @ApiProperty({ example: true })
  requiresTwoFactor!: boolean;

  @ApiProperty()
  pendingTwoFactorToken!: string;

  @ApiProperty({ example: 300 })
  expiresInSeconds!: number;

  @ApiPropertyOptional({ description: 'Only returned in non-production mode' })
  twoFactorCode?: string;
}
