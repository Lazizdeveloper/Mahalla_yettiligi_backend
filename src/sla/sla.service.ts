import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ComplaintStatus, NotificationChannel } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);
  private lastRunAt: Date | null = null;
  private lastSuccessAt: Date | null = null;
  private lastError: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSlaEscalation() {
    this.lastRunAt = new Date();
    try {
      await this.runEscalation();
      this.lastSuccessAt = new Date();
      this.lastError = null;
    } catch (error) {
      this.lastError =
        error instanceof Error ? error.message : 'Unknown SLA worker error';
      this.logger.error(`SLA escalation worker failed: ${this.lastError}`);
      throw error;
    }
  }

  async runEscalation() {
    const overdueComplaints = await this.prisma.complaint.findMany({
      where: {
        deletedAt: null,
        escalationFlag: false,
        deadlineAt: { lt: new Date() },
        status: {
          in: [ComplaintStatus.NEW, ComplaintStatus.IN_PROGRESS],
        },
      },
      select: { id: true, mahallaId: true },
    });

    if (overdueComplaints.length === 0) {
      return { escalatedCount: 0 };
    }

    await this.prisma.complaint.updateMany({
      where: {
        id: { in: overdueComplaints.map((item) => item.id) },
      },
      data: { escalationFlag: true },
    });

    const adminUsers = await this.prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        deletedAt: null,
      },
      select: { id: true },
    });

    for (const complaint of overdueComplaints) {
      await this.notificationsService.notifyMany(
        adminUsers.flatMap((admin) => [
          {
            type: 'SLA_ESCALATION',
            title: 'Complaint SLA breach detected',
            message: `Complaint ${complaint.id} exceeded 24-hour SLA`,
            targetUserId: admin.id,
            channel: NotificationChannel.IN_APP,
            meta: { complaintId: complaint.id, mahallaId: complaint.mahallaId },
          },
          {
            type: 'SLA_ESCALATION',
            title: 'Complaint SLA breach detected',
            message: `Complaint ${complaint.id} exceeded 24-hour SLA`,
            targetUserId: admin.id,
            channel: NotificationChannel.EMAIL,
            meta: { complaintId: complaint.id, mahallaId: complaint.mahallaId },
          },
        ]),
      );

      await this.auditService.log({
        action: 'SLA_ESCALATED',
        entityType: 'Complaint',
        entityId: complaint.id,
        payload: { mahallaId: complaint.mahallaId },
      });
    }

    return { escalatedCount: overdueComplaints.length };
  }

  getHealth() {
    return {
      scheduler: 'EVERY_5_MINUTES',
      lastRunAt: this.lastRunAt?.toISOString() ?? null,
      lastSuccessAt: this.lastSuccessAt?.toISOString() ?? null,
      lastError: this.lastError,
      healthy: this.lastError === null,
    };
  }
}
