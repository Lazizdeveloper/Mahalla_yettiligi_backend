import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

interface NotifyPayload {
  type: string;
  title: string;
  message: string;
  targetUserId: string;
  channel: NotificationChannel;
  meta?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationQueue: Queue,
  ) {}

  async notify(payload: NotifyPayload) {
    const notification = await this.prisma.notification.create({
      data: {
        type: payload.type,
        title: payload.title,
        message: payload.message,
        targetUserId: payload.targetUserId,
        channel: payload.channel,
        status: NotificationStatus.PENDING,
        meta: payload.meta as Prisma.JsonObject | undefined,
      },
    });

    if (payload.channel === NotificationChannel.EMAIL) {
      await this.notificationQueue.add('email', {
        notificationId: notification.id,
      });
    }

    return notification;
  }

  async notifyMany(payloads: NotifyPayload[]) {
    return Promise.all(payloads.map((payload) => this.notify(payload)));
  }
}
