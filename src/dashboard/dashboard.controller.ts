import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getSummary(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getSummary(query.mahallaId);
  }

  @Get('charts')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  getCharts(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getCharts(query.mahallaId, query.months ?? 6);
  }
}
