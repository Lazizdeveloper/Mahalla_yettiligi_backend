import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { TwoFactorChallengeDto } from './dto/two-factor-challenge.dto';
import { RegisterAppUserDto } from './dto/register-app-user.dto';
import { RegisterSuperAdminDto } from './dto/register-super-admin.dto';
import { RegisterMahallaUserDto } from './dto/register-mahalla-user.dto';
import { RegisterAholiUserDto } from './dto/register-aholi-user.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('super-admin/register')
  registerSuperAdmin(@Body() dto: RegisterSuperAdminDto) {
    return this.authService.registerSuperAdmin(dto);
  }

  @Public()
  @Post('super-admin/login/otp/request')
  requestSuperAdminOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestSuperAdminOtp(dto);
  }

  @Public()
  @Post('super-admin/login/otp/verify')
  @ApiOkResponse({ type: TokenResponseDto, description: 'Token response' })
  @ApiOkResponse({
    type: TwoFactorChallengeDto,
    description: '2FA challenge response for privileged roles',
  })
  verifySuperAdminOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifySuperAdminOtp(dto);
  }

  @Public()
  @Post('mahalla/register')
  registerMahallaUser(@Body() dto: RegisterMahallaUserDto) {
    return this.authService.registerMahallaUser(dto);
  }

  @Public()
  @Post('mahalla/login/otp/request')
  requestMahallaOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestMahallaOtp(dto);
  }

  @Public()
  @Post('mahalla/login/otp/verify')
  @ApiOkResponse({ type: TokenResponseDto, description: 'Token response' })
  @ApiOkResponse({
    type: TwoFactorChallengeDto,
    description: '2FA challenge response for privileged roles',
  })
  verifyMahallaOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyMahallaOtp(dto);
  }

  @Public()
  @Post('aholi/register')
  registerAholiUser(@Body() dto: RegisterAholiUserDto) {
    return this.authService.registerAholiUser(dto);
  }

  @Public()
  @Post('aholi/login/otp/request')
  requestAholiOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestAholiOtp(dto);
  }

  @Public()
  @Post('aholi/login/otp/verify')
  @ApiOkResponse({ type: TokenResponseDto, description: 'Token response' })
  @ApiOkResponse({
    type: TwoFactorChallengeDto,
    description: '2FA challenge response for privileged roles',
  })
  verifyAholiOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyAholiOtp(dto);
  }

  @Public()
  @Post('app/register')
  registerAppUser(@Body() dto: RegisterAppUserDto) {
    return this.authService.registerAppUser(dto);
  }

  @Public()
  @Post('app/login/otp/request')
  requestAppOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestAppOtp(dto);
  }

  @Public()
  @Post('app/login/otp/verify')
  @ApiOkResponse({ type: TokenResponseDto, description: 'Token response' })
  @ApiOkResponse({
    type: TwoFactorChallengeDto,
    description: '2FA challenge response for privileged roles',
  })
  verifyAppOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyAppOtp(dto);
  }

  @Public()
  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto);
  }

  @Public()
  @Post('otp/verify')
  @ApiOkResponse({ type: TokenResponseDto, description: 'Token response' })
  @ApiOkResponse({
    type: TwoFactorChallengeDto,
    description: '2FA challenge response for privileged roles',
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Public()
  @Post('2fa/verify')
  @ApiOkResponse({ type: TokenResponseDto })
  verifyTwoFactor(@Body() dto: VerifyTwoFactorDto) {
    return this.authService.verifyTwoFactor(dto);
  }

  @Public()
  @Post('refresh')
  @ApiOkResponse({ type: TokenResponseDto })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Post('logout')
  logout(
    @Body() dto: RefreshTokenDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.logout(dto.refreshToken, currentUser.userId);
  }
}
