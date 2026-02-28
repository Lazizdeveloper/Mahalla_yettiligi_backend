import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums/role.enum';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../database/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsDto } from './dto/list-events.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateEventDto, actor: AuthenticatedUser) {
    const actorRecord = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { mahallaId: true },
    });

    const mahallaId =
      actor.role === Role.ADMIN || actor.role === Role.SUPER_ADMIN
        ? dto.mahallaId
        : actorRecord?.mahallaId;

    if (!mahallaId) {
      throw new BadRequestException('Mahalla is required');
    }

    const event = await this.prisma.event.create({
      data: {
        title: dto.title,
        scheduledAt: new Date(dto.scheduledAt),
        locationName: dto.locationName,
        latitude: dto.latitude,
        longitude: dto.longitude,
        responsibleUserId: dto.responsibleUserId,
        participantCount: dto.participantCount ?? 0,
        mahallaId,
        createdById: actor.userId,
      },
    });

    await this.auditService.log({
      actorId: actor.userId,
      action: 'EVENT_CREATE',
      entityType: 'Event',
      entityId: event.id,
      payload: {
        scheduledAt: event.scheduledAt.toISOString(),
        mahallaId: event.mahallaId,
      },
    });

    return event;
  }

  async findAll(query: ListEventsDto, actor: AuthenticatedUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const actorRecord =
      actor.role === Role.RESIDENT || actor.role === Role.STAFF
        ? await this.prisma.user.findUnique({
            where: { id: actor.userId },
            select: { mahallaId: true },
          })
        : null;

    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.mahallaId ? { mahallaId: query.mahallaId } : {}),
      ...(query.from || query.to
        ? {
            scheduledAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
      ...(actor.role === Role.RESIDENT || actor.role === Role.STAFF
        ? { mahallaId: actorRecord?.mahallaId ?? '___none___' }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      total,
      page,
      pageSize,
      items,
    };
  }

  async updateStatus(id: string, dto: UpdateEventStatusDto, actorId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!event || event.deletedAt) {
      throw new NotFoundException('Event is not found');
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.auditService.log({
      actorId,
      action: 'EVENT_STATUS_UPDATE',
      entityType: 'Event',
      entityId: id,
      payload: {
        status: dto.status,
      },
    });

    return updated;
  }
}
