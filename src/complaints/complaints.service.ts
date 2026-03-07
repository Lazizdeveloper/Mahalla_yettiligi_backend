import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ComplaintStatus, NotificationChannel } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { getDeadlineAfterHours } from '../common/utils/date.util';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { ListComplaintsDto } from './dto/list-complaints.dto';
import { RespondComplaintDto } from './dto/respond-complaint.dto';
import { UpdateComplaintStatusDto } from './dto/update-complaint-status.dto';

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateComplaintDto, actor: AuthenticatedUser) {
    const actorRecord = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { mahallaId: true },
    });

    const mahallaId =
      actor.role === Role.ADMIN || actor.role === Role.SUPER_ADMIN
        ? (dto.mahallaId ?? actorRecord?.mahallaId)
        : actorRecord?.mahallaId;

    if (!mahallaId) {
      throw new BadRequestException('Mahalla is required');
    }

    const complaint = await this.prisma.complaint.create({
      data: {
        userId: actor.userId,
        mahallaId,
        category: dto.category,
        description: dto.description,
        latitude: dto.latitude,
        longitude: dto.longitude,
        deadlineAt: getDeadlineAfterHours(24),
      },
      include: { mediaFiles: true },
    });

    if (dto.mediaIds?.length) {
      await this.prisma.mediaFile.updateMany({
        where: {
          id: { in: dto.mediaIds },
          uploadedById: actor.userId,
          complaintId: null,
          postId: null,
          reportItemId: null,
        },
        data: { complaintId: complaint.id },
      });
    }

    await this.auditService.log({
      actorId: actor.userId,
      action: 'COMPLAINT_CREATE',
      entityType: 'Complaint',
      entityId: complaint.id,
      payload: {
        category: complaint.category,
        mahallaId: complaint.mahallaId,
      },
    });

    return this.prisma.complaint.findUnique({
      where: { id: complaint.id },
      include: {
        mediaFiles: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
    });
  }

  async findAll(query: ListComplaintsDto, actor: AuthenticatedUser) {
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
      ...(query.category ? { category: query.category } : {}),
      ...(query.mahallaId ? { mahallaId: query.mahallaId } : {}),
      ...(actor.role === Role.RESIDENT ? { userId: actor.userId } : {}),
      ...(actor.role === Role.STAFF && actorRecord?.mahallaId
        ? { mahallaId: actorRecord.mahallaId }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.complaint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          mediaFiles: {
            select: {
              id: true,
              filename: true,
              mimeType: true,
              sizeBytes: true,
            },
          },
          responses: true,
        },
      }),
      this.prisma.complaint.count({ where }),
    ]);

    return { total, page, pageSize, items };
  }

  async updateStatus(
    id: string,
    dto: UpdateComplaintStatusDto,
    actor: AuthenticatedUser,
  ) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      select: {
        id: true,
        deletedAt: true,
        mahallaId: true,
        userId: true,
        status: true,
      },
    });

    if (!complaint || complaint.deletedAt) {
      throw new NotFoundException('Complaint is not found');
    }

    await this.assertStaffCanManageComplaint(complaint.mahallaId, actor);

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: { status: dto.status },
    });

    if (complaint.userId !== actor.userId) {
      await this.notificationsService.notify({
        type: 'COMPLAINT_STATUS_UPDATED',
        title: 'Complaint status updated',
        message: `Your complaint ${id.slice(0, 8)} status changed from ${complaint.status} to ${dto.status}`,
        targetUserId: complaint.userId,
        channel: NotificationChannel.IN_APP,
        meta: {
          complaintId: id,
          previousStatus: complaint.status,
          status: dto.status,
        },
      });
    }

    await this.auditService.log({
      actorId: actor.userId,
      action: 'COMPLAINT_STATUS_UPDATE',
      entityType: 'Complaint',
      entityId: id,
      payload: {
        previousStatus: complaint.status,
        status: dto.status,
      },
    });

    return updated;
  }

  async respond(id: string, dto: RespondComplaintDto, actor: AuthenticatedUser) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      select: {
        id: true,
        deletedAt: true,
        mahallaId: true,
        userId: true,
      },
    });

    if (!complaint || complaint.deletedAt) {
      throw new NotFoundException('Complaint is not found');
    }

    await this.assertStaffCanManageComplaint(complaint.mahallaId, actor);

    const updated = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.ANSWERED,
        responseText: dto.responseText,
        respondedAt: new Date(),
      },
    });

    await this.prisma.complaintResponse.create({
      data: {
        complaintId: id,
        responderId: actor.userId,
        responseText: dto.responseText,
      },
    });

    if (complaint.userId !== actor.userId) {
      await this.notificationsService.notifyMany([
        {
          type: 'COMPLAINT_RESPONDED',
          title: 'Complaint answered',
          message: `Your complaint ${id.slice(0, 8)} was answered`,
          targetUserId: complaint.userId,
          channel: NotificationChannel.IN_APP,
          meta: { complaintId: id },
        },
        {
          type: 'COMPLAINT_RESPONDED',
          title: 'Complaint answered',
          message: `Your complaint ${id.slice(0, 8)} was answered`,
          targetUserId: complaint.userId,
          channel: NotificationChannel.EMAIL,
          meta: { complaintId: id },
        },
      ]);
    }

    const targetAdmins = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        deletedAt: null,
      },
      select: { id: true },
    });

    await this.notificationsService.notifyMany(
      targetAdmins.flatMap((admin) => [
        {
          type: 'COMPLAINT_RESPONDED',
          title: 'Complaint answered',
          message: `Complaint ${id} was answered`,
          targetUserId: admin.id,
          channel: NotificationChannel.IN_APP,
          meta: { complaintId: id },
        },
        {
          type: 'COMPLAINT_RESPONDED',
          title: 'Complaint answered',
          message: `Complaint ${id} was answered`,
          targetUserId: admin.id,
          channel: NotificationChannel.EMAIL,
          meta: { complaintId: id },
        },
      ]),
    );

    await this.auditService.log({
      actorId: actor.userId,
      action: 'COMPLAINT_RESPOND',
      entityType: 'Complaint',
      entityId: id,
      payload: {
        respondedAt: updated.respondedAt?.toISOString(),
      },
    });

    return updated;
  }

  private async assertStaffCanManageComplaint(
    complaintMahallaId: string,
    actor: AuthenticatedUser,
  ) {
    if (actor.role !== Role.STAFF) {
      return;
    }

    const actorRecord = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { mahallaId: true },
    });

    if (!actorRecord?.mahallaId || actorRecord.mahallaId !== complaintMahallaId) {
      throw new ForbiddenException(
        'Staff can manage complaints only within their mahalla',
      );
    }
  }
}
