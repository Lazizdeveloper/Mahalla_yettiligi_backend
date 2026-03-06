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
import { Public } from '../common/decorators/public.decorator';
import { CreateMahallaDto } from './dto/create-mahalla.dto';
import { ListMahallasDto } from './dto/list-mahallas.dto';
import {
  PublicDistrictSuggestDto,
  PublicLocationSuggestDto,
  PublicMahallaSuggestDto,
} from './dto/public-location-suggest.dto';
import { UpdateMahallaDto } from './dto/update-mahalla.dto';
import { MahallasService } from './mahallas.service';

@ApiTags('Mahallas')
@ApiBearerAuth()
@Controller('mahallas')
export class MahallasController {
  constructor(private readonly mahallasService: MahallasService) {}

  @Public()
  @Get('public/regions')
  findRegionsPublic() {
    return this.mahallasService.findRegionsPublic();
  }

  @Public()
  @Get('public/regions/suggest')
  suggestRegionsPublic(@Query() query: PublicLocationSuggestDto) {
    return this.mahallasService.suggestRegionsPublic(query.q, query.limit);
  }

  @Public()
  @Get('public/regions/:regionId/districts')
  findDistrictsPublic(@Param('regionId') regionId: string) {
    return this.mahallasService.findDistrictsPublic(regionId);
  }

  @Public()
  @Get('public/districts/suggest')
  suggestDistrictsPublic(@Query() query: PublicDistrictSuggestDto) {
    return this.mahallasService.suggestDistrictsPublic(
      query.regionId,
      query.q,
      query.limit,
    );
  }

  @Public()
  @Get('public/districts/:districtId/mahallas')
  findMahallasPublic(@Param('districtId') districtId: string) {
    return this.mahallasService.findMahallasPublic(districtId);
  }

  @Public()
  @Get('public/mahallas/suggest')
  suggestMahallasPublic(@Query() query: PublicMahallaSuggestDto) {
    return this.mahallasService.suggestMahallasPublic(
      query.districtId,
      query.q,
      query.limit,
    );
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  findAll(@Query() query: ListMahallasDto) {
    return this.mahallasService.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(
    @Body() dto: CreateMahallaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mahallasService.create(dto, actor.userId);
  }

  @Get(':id')
  @Roles(Role.RESIDENT, Role.STAFF, Role.ADMIN, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.mahallasService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMahallaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mahallasService.update(id, dto, actor.userId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.mahallasService.remove(id, actor.userId);
  }
}
