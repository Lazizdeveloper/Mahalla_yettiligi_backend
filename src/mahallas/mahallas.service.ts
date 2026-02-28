import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { CreateMahallaDto } from './dto/create-mahalla.dto';

@Injectable()
export class MahallasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateMahallaDto, actorId: string) {
    const region = await this.prisma.region.upsert({
      where: { name: dto.regionName.trim() },
      update: {},
      create: { name: dto.regionName.trim() },
    });

    const district = await this.prisma.district.upsert({
      where: {
        regionId_name: {
          regionId: region.id,
          name: dto.districtName.trim(),
        },
      },
      update: {},
      create: {
        regionId: region.id,
        name: dto.districtName.trim(),
      },
    });

    const mahalla = await this.prisma.mahalla.upsert({
      where: {
        districtId_name: {
          districtId: district.id,
          name: dto.name.trim(),
        },
      },
      update: {
        deletedAt: null,
      },
      create: {
        districtId: district.id,
        name: dto.name.trim(),
      },
      include: {
        district: { include: { region: true } },
      },
    });

    await this.auditService.log({
      actorId,
      action: 'MAHALLA_CREATE',
      entityType: 'Mahalla',
      entityId: mahalla.id,
      payload: {
        region: dto.regionName,
        district: dto.districtName,
        name: dto.name,
      },
    });

    return mahalla;
  }

  async findOne(id: string) {
    const mahalla = await this.prisma.mahalla.findUnique({
      where: { id },
      include: {
        district: { include: { region: true } },
      },
    });

    if (!mahalla || mahalla.deletedAt) {
      throw new NotFoundException('Mahalla is not found');
    }

    return mahalla;
  }
}
