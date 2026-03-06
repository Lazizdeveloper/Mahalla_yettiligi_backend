import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { CreateMahallaDto } from './dto/create-mahalla.dto';
import { ListMahallasDto } from './dto/list-mahallas.dto';
import { UpdateMahallaDto } from './dto/update-mahalla.dto';

const REGIONS_SOURCE_URL =
  process.env.UZ_REGIONS_SOURCE_URL ??
  'https://raw.githubusercontent.com/MIMAXUZ/uzbekistan-regions-data/master/JSON/regions.json';
const DISTRICTS_SOURCE_URL =
  process.env.UZ_DISTRICTS_SOURCE_URL ??
  'https://raw.githubusercontent.com/MIMAXUZ/uzbekistan-regions-data/master/JSON/districts.json';
const VILLAGES_SOURCE_URL =
  process.env.UZ_VILLAGES_SOURCE_URL ??
  'https://raw.githubusercontent.com/MIMAXUZ/uzbekistan-regions-data/master/JSON/villages.json';
const REMOTE_LOCATION_CACHE_TTL_MS = 1000 * 60 * 60 * 6;

type ExternalNamePayload = {
  name_uz?: string | null;
  name_oz?: string | null;
  name_ru?: string | null;
  name?: string | null;
};

type ExternalRegion = ExternalNamePayload & {
  id: number;
};

type ExternalDistrict = ExternalNamePayload & {
  id: number;
  region_id: number;
};

type ExternalVillage = ExternalNamePayload & {
  id: number;
  district_id: number;
};

type RemoteLocationCache = {
  loadedAt: number;
  regions: ExternalRegion[];
  districts: ExternalDistrict[];
  villages: ExternalVillage[];
};

@Injectable()
export class MahallasService {
  private readonly logger = new Logger(MahallasService.name);
  private remoteLocationCache: RemoteLocationCache | null = null;
  private remoteLocationCachePromise: Promise<RemoteLocationCache> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private normalizeName(payload: ExternalNamePayload) {
    const raw =
      payload.name_uz ??
      payload.name_oz ??
      payload.name_ru ??
      payload.name ??
      '';
    return String(raw).replace(/\s+/g, ' ').trim();
  }

  private matchesQuery(value: string, q?: string) {
    const query = (q ?? '').trim();
    if (!query) {
      return true;
    }
    return value.toLowerCase().includes(query.toLowerCase());
  }

  private toSafeLimit(limit?: number) {
    if (!limit || Number.isNaN(limit)) {
      return 12;
    }
    return Math.max(1, Math.min(30, limit));
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Location source HTTP ${response.status}: ${url}`);
    }
    return (await response.json()) as T;
  }

  private async getRemoteLocationCache(): Promise<RemoteLocationCache> {
    const now = Date.now();
    if (
      this.remoteLocationCache &&
      now - this.remoteLocationCache.loadedAt < REMOTE_LOCATION_CACHE_TTL_MS
    ) {
      return this.remoteLocationCache;
    }

    if (!this.remoteLocationCachePromise) {
      this.remoteLocationCachePromise = (async () => {
        const [regions, districts, villages] = await Promise.all([
          this.fetchJson<ExternalRegion[]>(REGIONS_SOURCE_URL),
          this.fetchJson<ExternalDistrict[]>(DISTRICTS_SOURCE_URL),
          this.fetchJson<ExternalVillage[]>(VILLAGES_SOURCE_URL),
        ]);

        const cache: RemoteLocationCache = {
          loadedAt: Date.now(),
          regions,
          districts,
          villages,
        };
        this.remoteLocationCache = cache;
        return cache;
      })()
        .catch((error) => {
          this.logger.warn(`Remote location cache load failed: ${String(error)}`);
          throw error;
        })
        .finally(() => {
          this.remoteLocationCachePromise = null;
        });
    }

    return this.remoteLocationCachePromise;
  }

  async suggestRegionsPublic(q?: string, limit?: number) {
    const safeLimit = this.toSafeLimit(limit);
    const query = (q ?? '').trim();

    const localResults = await this.prisma.region.findMany({
      where: query
        ? {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
      take: safeLimit,
      select: {
        id: true,
        name: true,
      },
    });

    if (localResults.length >= safeLimit) {
      return localResults;
    }

    try {
      const remote = await this.getRemoteLocationCache();
      const remoteNames = new Set<string>();
      for (const region of remote.regions) {
        const name = this.normalizeName(region);
        if (!name || !this.matchesQuery(name, query)) {
          continue;
        }
        remoteNames.add(name);
        if (remoteNames.size >= safeLimit * 4) {
          break;
        }
      }

      if (remoteNames.size > 0) {
        await this.prisma.region.createMany({
          data: Array.from(remoteNames).map((name) => ({ name })),
          skipDuplicates: true,
        });
      }
    } catch {
      return localResults;
    }

    return this.prisma.region.findMany({
      where: query
        ? {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
      take: safeLimit,
      select: {
        id: true,
        name: true,
      },
    });
  }

  async suggestDistrictsPublic(regionId: string, q?: string, limit?: number) {
    const safeLimit = this.toSafeLimit(limit);
    const query = (q ?? '').trim();

    const localResults = await this.prisma.district.findMany({
      where: {
        regionId,
        ...(query
          ? {
              name: {
                contains: query,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: safeLimit,
      select: {
        id: true,
        name: true,
        regionId: true,
      },
    });

    if (localResults.length >= safeLimit) {
      return localResults;
    }

    const region = await this.prisma.region.findUnique({
      where: { id: regionId },
      select: { name: true },
    });
    if (!region) {
      return localResults;
    }

    try {
      const remote = await this.getRemoteLocationCache();
      const matchingExternalRegionIds = remote.regions
        .filter(
          (item) =>
            this.normalizeName(item).toLowerCase() === region.name.toLowerCase(),
        )
        .map((item) => item.id);

      if (matchingExternalRegionIds.length === 0) {
        return localResults;
      }

      const districtNames = new Set<string>();
      for (const district of remote.districts) {
        if (!matchingExternalRegionIds.includes(district.region_id)) {
          continue;
        }
        const name = this.normalizeName(district);
        if (!name || !this.matchesQuery(name, query)) {
          continue;
        }
        districtNames.add(name);
        if (districtNames.size >= safeLimit * 6) {
          break;
        }
      }

      if (districtNames.size > 0) {
        await this.prisma.district.createMany({
          data: Array.from(districtNames).map((name) => ({
            regionId,
            name,
          })),
          skipDuplicates: true,
        });
      }
    } catch {
      return localResults;
    }

    return this.prisma.district.findMany({
      where: {
        regionId,
        ...(query
          ? {
              name: {
                contains: query,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: safeLimit,
      select: {
        id: true,
        name: true,
        regionId: true,
      },
    });
  }

  async suggestMahallasPublic(districtId: string, q?: string, limit?: number) {
    const safeLimit = this.toSafeLimit(limit);
    const query = (q ?? '').trim();

    const localResults = await this.prisma.mahalla.findMany({
      where: {
        districtId,
        deletedAt: null,
        ...(query
          ? {
              name: {
                contains: query,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: safeLimit,
      select: {
        id: true,
        name: true,
        districtId: true,
      },
    });

    if (localResults.length >= safeLimit) {
      return localResults;
    }

    const district = await this.prisma.district.findUnique({
      where: { id: districtId },
      include: { region: true },
    });
    if (!district) {
      return localResults;
    }

    try {
      const remote = await this.getRemoteLocationCache();
      const externalRegionIds = remote.regions
        .filter(
          (item) =>
            this.normalizeName(item).toLowerCase() ===
            district.region.name.toLowerCase(),
        )
        .map((item) => item.id);

      if (externalRegionIds.length === 0) {
        return localResults;
      }

      const externalDistrictIds = remote.districts
        .filter(
          (item) =>
            externalRegionIds.includes(item.region_id) &&
            this.normalizeName(item).toLowerCase() === district.name.toLowerCase(),
        )
        .map((item) => item.id);

      if (externalDistrictIds.length === 0) {
        return localResults;
      }

      const mahallaNames = new Set<string>();
      for (const village of remote.villages) {
        if (!externalDistrictIds.includes(village.district_id)) {
          continue;
        }
        const name = this.normalizeName(village);
        if (!name || !this.matchesQuery(name, query)) {
          continue;
        }
        mahallaNames.add(name);
        if (mahallaNames.size >= safeLimit * 10) {
          break;
        }
      }

      if (mahallaNames.size > 0) {
        await this.prisma.mahalla.createMany({
          data: Array.from(mahallaNames).map((name) => ({
            districtId,
            name,
          })),
          skipDuplicates: true,
        });
      }
    } catch {
      return localResults;
    }

    return this.prisma.mahalla.findMany({
      where: {
        districtId,
        deletedAt: null,
        ...(query
          ? {
              name: {
                contains: query,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: safeLimit,
      select: {
        id: true,
        name: true,
        districtId: true,
      },
    });
  }

  async findRegionsPublic() {
    return this.prisma.region.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });
  }

  async findDistrictsPublic(regionId: string) {
    return this.prisma.district.findMany({
      where: { regionId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        regionId: true,
      },
    });
  }

  async findMahallasPublic(districtId: string) {
    return this.prisma.mahalla.findMany({
      where: {
        districtId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        districtId: true,
      },
    });
  }

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

  async findAll(query: ListMahallasDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const districtWhere = {
      ...(query.districtName
        ? {
            name: {
              contains: query.districtName,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(query.regionName
        ? {
            region: {
              name: {
                contains: query.regionName,
                mode: 'insensitive' as const,
              },
            },
          }
        : {}),
    };

    const where = {
      deletedAt: null,
      ...(query.q
        ? {
            name: {
              contains: query.q,
              mode: 'insensitive' as const,
            },
          }
        : {}),
      ...(Object.keys(districtWhere).length > 0
        ? {
            district: districtWhere,
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.mahalla.findMany({
        where,
        include: {
          district: { include: { region: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.mahalla.count({ where }),
    ]);

    return {
      total,
      page,
      pageSize,
      items,
    };
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

  async update(id: string, dto: UpdateMahallaDto, actorId: string) {
    const current = await this.prisma.mahalla.findUnique({
      where: { id },
      include: {
        district: { include: { region: true } },
      },
    });

    if (!current || current.deletedAt) {
      throw new NotFoundException('Mahalla is not found');
    }

    const nextRegionName =
      dto.regionName?.trim() ?? current.district.region.name;
    const nextDistrictName = dto.districtName?.trim() ?? current.district.name;
    const nextMahallaName = dto.name?.trim() ?? current.name;

    const region = await this.prisma.region.upsert({
      where: { name: nextRegionName },
      update: {},
      create: { name: nextRegionName },
    });

    const district = await this.prisma.district.upsert({
      where: {
        regionId_name: {
          regionId: region.id,
          name: nextDistrictName,
        },
      },
      update: {},
      create: {
        regionId: region.id,
        name: nextDistrictName,
      },
    });

    try {
      const mahalla = await this.prisma.mahalla.update({
        where: { id },
        data: {
          name: nextMahallaName,
          districtId: district.id,
        },
        include: {
          district: { include: { region: true } },
        },
      });

      await this.auditService.log({
        actorId,
        action: 'MAHALLA_UPDATE',
        entityType: 'Mahalla',
        entityId: id,
        payload: {
          regionName: nextRegionName,
          districtName: nextDistrictName,
          name: nextMahallaName,
        },
      });

      return mahalla;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Mahalla with this name already exists in the selected district',
        );
      }
      throw error;
    }
  }

  async remove(id: string, actorId: string) {
    const mahalla = await this.prisma.mahalla.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!mahalla || mahalla.deletedAt) {
      throw new NotFoundException('Mahalla is not found');
    }

    const usersCount = await this.prisma.user.count({
      where: {
        mahallaId: id,
        deletedAt: null,
      },
    });

    if (usersCount > 0) {
      throw new BadRequestException(
        'Mahalla has active users and cannot be deleted',
      );
    }

    await this.prisma.mahalla.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'MAHALLA_DELETE',
      entityType: 'Mahalla',
      entityId: id,
    });

    return { success: true };
  }
}
