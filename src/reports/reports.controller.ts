import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateMonthlyReportDto } from './dto/create-monthly-report.dto';
import { ListReportsDto } from './dto/list-reports.dto';
import { ReportsService } from './reports.service';

@ApiTags('Monthly Reports')
@ApiBearerAuth()
@Controller('monthly-reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  create(
    @Body() dto: CreateMonthlyReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reportsService.create(dto, actor);
  }

  @Get()
  @Roles(Role.RESIDENT, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  findAll(
    @Query() query: ListReportsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reportsService.findAll(query, actor);
  }
}
