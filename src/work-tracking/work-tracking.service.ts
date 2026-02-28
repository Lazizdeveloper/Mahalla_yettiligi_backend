import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkSessionStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums/role.enum';
import {
  isPointInsidePolygon,
  parsePolygonFromGeoJson,
} from '../common/utils/geo.util';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../database/prisma.service';
import { AddLocationLogDto } from './dto/add-location-log.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { DailyStatsQueryDto } from './dto/daily-stats-query.dto';

@Injectable()
export class WorkTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async checkIn(dto: CheckInDto, actor: AuthenticatedUser) {
    const actorRecord = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { mahallaId: true },
    });

    const mahallaId =
      actor.role === Role.ADMIN || actor.role === Role.SUPER_ADMIN
        ? (dto.mahallaId ?? actorRecord?.mahallaId)
        : actorRecord?.mahallaId;

    if (!mahallaId) {
      throw new BadRequestException('Mahalla is required for check-in');
    }

    const openedSession = await this.prisma.workSession.findFirst({
      where: {
        userId: actor.userId,
        status: WorkSessionStatus.OPEN,
      },
    });

    if (openedSession) {
      throw new BadRequestException('You already have an opened work session');
    }

    const session = await this.prisma.workSession.create({
      data: {
        userId: actor.userId,
        mahallaId,
        status: WorkSessionStatus.OPEN,
        checkInAt: new Date(),
        checkInLatitude: dto.latitude,
        checkInLongitude: dto.longitude,
      },
    });

    await this.auditService.log({
      actorId: actor.userId,
      action: 'WORK_CHECK_IN',
      entityType: 'WorkSession',
      entityId: session.id,
      payload: {
        mahallaId,
      },
    });

    return session;
  }

  async checkOut(dto: CheckOutDto, actor: AuthenticatedUser) {
    const session = await this.findActiveSession(actor.userId, dto.sessionId);

    const now = new Date();
    const totalWorkMinutes = Math.max(
      0,
      Math.round((now.getTime() - session.checkInAt.getTime()) / (1000 * 60)),
    );

    const updated = await this.prisma.workSession.update({
      where: { id: session.id },
      data: {
        status: WorkSessionStatus.CLOSED,
        checkOutAt: now,
        checkOutLatitude: dto.latitude,
        checkOutLongitude: dto.longitude,
        totalWorkMinutes,
      },
    });

    await this.auditService.log({
      actorId: actor.userId,
      action: 'WORK_CHECK_OUT',
      entityType: 'WorkSession',
      entityId: session.id,
      payload: {
        totalWorkMinutes,
        outsideMinutes: updated.outsideMinutes,
      },
    });

    return updated;
  }

  async addLocationLog(dto: AddLocationLogDto, actor: AuthenticatedUser) {
    const session = await this.prisma.workSession.findUnique({
      where: { id: dto.sessionId },
      include: {
        mahalla: {
          select: {
            boundaryGeoJson: true,
          },
        },
      },
    });

    if (!session || session.userId !== actor.userId) {
      throw new NotFoundException('Work session not found');
    }

    if (session.status !== WorkSessionStatus.OPEN) {
      throw new BadRequestException('Work session is closed');
    }

    const point = { lat: Number(dto.latitude), lng: Number(dto.longitude) };
    const polygon = parsePolygonFromGeoJson(session.mahalla.boundaryGeoJson);
    const isOutside = polygon ? !isPointInsidePolygon(point, polygon) : false;

    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();

    const previousLog = await this.prisma.locationLog.findFirst({
      where: { sessionId: session.id },
      orderBy: { recordedAt: 'desc' },
    });

    if (previousLog?.isOutside) {
      const diffMin = Math.max(
        0,
        Math.round(
          (recordedAt.getTime() - previousLog.recordedAt.getTime()) /
            (1000 * 60),
        ),
      );

      const increment = Math.min(diffMin, 30);
      if (increment > 0) {
        await this.prisma.workSession.update({
          where: { id: session.id },
          data: {
            outsideMinutes: { increment },
          },
        });
      }
    }

    const log = await this.prisma.locationLog.create({
      data: {
        sessionId: session.id,
        userId: actor.userId,
        mahallaId: session.mahallaId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isOutside,
        recordedAt,
      },
    });

    return log;
  }

  async getDailyStats(query: DailyStatsQueryDto, actor: AuthenticatedUser) {
    const targetUserId =
      actor.role === Role.ADMIN || actor.role === Role.SUPER_ADMIN
        ? (query.userId ?? actor.userId)
        : actor.userId;

    const day = query.date ? new Date(query.date) : new Date();
    day.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const sessions = await this.prisma.workSession.findMany({
      where: {
        userId: targetUserId,
        checkInAt: {
          gte: day,
          lt: dayEnd,
        },
      },
      include: {
        locationLogs: {
          select: {
            isOutside: true,
            recordedAt: true,
          },
        },
      },
      orderBy: { checkInAt: 'asc' },
    });

    const totalWorkMinutes = sessions.reduce(
      (acc, session) => acc + (session.totalWorkMinutes ?? 0),
      0,
    );
    const outsideMinutes = sessions.reduce(
      (acc, session) => acc + session.outsideMinutes,
      0,
    );

    return {
      userId: targetUserId,
      date: day.toISOString().slice(0, 10),
      sessionsCount: sessions.length,
      totalWorkMinutes,
      outsideMinutes,
      sessions,
    };
  }

  private async findActiveSession(userId: string, sessionId?: string) {
    if (sessionId) {
      const byId = await this.prisma.workSession.findUnique({
        where: { id: sessionId },
      });

      if (!byId || byId.userId !== userId) {
        throw new NotFoundException('Work session not found');
      }

      if (byId.status !== WorkSessionStatus.OPEN) {
        throw new BadRequestException('Work session is already closed');
      }

      return byId;
    }

    const latestOpened = await this.prisma.workSession.findFirst({
      where: {
        userId,
        status: WorkSessionStatus.OPEN,
      },
      orderBy: { checkInAt: 'desc' },
    });

    if (!latestOpened) {
      throw new NotFoundException('Open work session not found');
    }

    return latestOpened;
  }
}
