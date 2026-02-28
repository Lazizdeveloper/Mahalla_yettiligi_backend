import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateMahallaDto } from './dto/create-mahalla.dto';
import { MahallasService } from './mahallas.service';

@ApiTags('Mahallas')
@ApiBearerAuth()
@Controller('mahallas')
export class MahallasController {
  constructor(private readonly mahallasService: MahallasService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(
    @Body() dto: CreateMahallaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mahallasService.create(dto, actor.userId);
  }

  @Get(':id')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.mahallasService.findOne(id);
  }
}
