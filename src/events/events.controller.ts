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
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsDto } from './dto/list-events.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { EventsService } from './events.service';

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateEventDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.eventsService.create(dto, actor);
  }

  @Get()
  @Roles(Role.RESIDENT, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  findAll(
    @Query() query: ListEventsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.eventsService.findAll(query, actor);
  }

  @Patch(':id/status')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.eventsService.updateStatus(id, dto, actor.userId);
  }
}
