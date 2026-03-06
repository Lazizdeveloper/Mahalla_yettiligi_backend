import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query() query: ListUsersDto) {
    return this.usersService.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.create(dto, actor.userId);
  }

  @Get(':id')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.usersService.update(id, dto, actor.userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.usersService.remove(id, actor.userId);
  }
}
