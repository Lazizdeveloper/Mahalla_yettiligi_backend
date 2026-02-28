import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('Ratings')
@ApiBearerAuth()
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @Roles(Role.RESIDENT, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  create(
    @Body() dto: CreateRatingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ratingsService.create(dto, actor.userId);
  }
}
