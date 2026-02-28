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
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsDto } from './dto/list-posts.dto';
import { PostsService } from './posts.service';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  create(@Body() dto: CreatePostDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.postsService.create(dto, actor);
  }

  @Get()
  @Roles(Role.RESIDENT, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  findAll(
    @Query() query: ListPostsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.postsService.findAll(query, actor);
  }

  @Patch(':id/publish')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  publish(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.postsService.publish(id, actor.userId);
  }

  @Patch(':id/archive')
  @Roles(Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  archive(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.postsService.archive(id, actor.userId);
  }
}
