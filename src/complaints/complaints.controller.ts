import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { ListComplaintsDto } from './dto/list-complaints.dto';
import { RespondComplaintDto } from './dto/respond-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';
import { ComplaintsService } from './complaints.service';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @Roles(Role.RESIDENT, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  create(
    @Body() dto: CreateComplaintDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.complaintsService.create(dto, actor);
  }

  @Get()
  @Roles(Role.RESIDENT, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  findAll(
    @Query() query: ListComplaintsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.complaintsService.findAll(query, actor);
  }

  @Patch(':id/status')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.complaintsService.updateStatus(id, dto, actor.userId);
  }

  @Post(':id/respond')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  respond(
    @Param('id') id: string,
    @Body() dto: RespondComplaintDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.complaintsService.respond(id, dto, actor.userId);
  }
}
