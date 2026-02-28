import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { AddLocationLogDto } from './dto/add-location-log.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { DailyStatsQueryDto } from './dto/daily-stats-query.dto';
import { WorkTrackingService } from './work-tracking.service';

@ApiTags('Work Tracking')
@ApiBearerAuth()
@Controller('work-tracking')
export class WorkTrackingController {
  constructor(private readonly workTrackingService: WorkTrackingService) {}

  @Post('check-in')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  checkIn(@Body() dto: CheckInDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.workTrackingService.checkIn(dto, actor);
  }

  @Post('check-out')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  checkOut(@Body() dto: CheckOutDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.workTrackingService.checkOut(dto, actor);
  }

  @Post('location-logs')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  addLocationLog(
    @Body() dto: AddLocationLogDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workTrackingService.addLocationLog(dto, actor);
  }

  @Get('daily-stats')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  dailyStats(
    @Query() query: DailyStatsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.workTrackingService.getDailyStats(query, actor);
  }
}
