import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PostStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../database/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsDto } from './dto/list-posts.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreatePostDto, actor: AuthenticatedUser) {
    const actorRecord = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { mahallaId: true },
    });

    const mahallaId =
      actor.role === Role.ADMIN || actor.role === Role.SUPER_ADMIN
        ? (dto.mahallaId ?? actorRecord?.mahallaId)
        : actorRecord?.mahallaId;

    if (!mahallaId) {
      throw new BadRequestException('Mahalla is required for the post');
    }

    const post = await this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
        createdById: actor.userId,
        mahallaId,
      },
      include: { mediaFiles: true },
    });

    if (dto.mediaIds?.length) {
      await this.prisma.mediaFile.updateMany({
        where: {
          id: { in: dto.mediaIds },
          uploadedById: actor.userId,
          postId: null,
          complaintId: null,
          reportItemId: null,
        },
        data: {
          postId: post.id,
        },
      });
    }

    await this.auditService.log({
      actorId: actor.userId,
      action: 'POST_CREATE',
      entityType: 'Post',
      entityId: post.id,
      payload: {
        title: post.title,
        mahallaId: post.mahallaId,
      },
    });

    return this.prisma.post.findUnique({
      where: { id: post.id },
      include: { mediaFiles: true },
    });
  }

  async findAll(query: ListPostsDto, actor: AuthenticatedUser) {
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
      ...((actor.role === Role.RESIDENT || actor.role === Role.STAFF) &&
      actorRecord?.mahallaId
        ? { mahallaId: actorRecord.mahallaId }
        : {}),
      ...(actor.role === Role.RESIDENT ? { status: PostStatus.PUBLISHED } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
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
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { total, page, pageSize, items };
  }

  async publish(id: string, actorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.deletedAt) {
      throw new NotFoundException('Post is not found');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: {
        status: PostStatus.PUBLISHED,
        publishDate: post.publishDate ?? new Date(),
      },
    });

    await this.auditService.log({
      actorId,
      action: 'POST_PUBLISH',
      entityType: 'Post',
      entityId: id,
    });

    return updated;
  }

  async archive(id: string, actorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.deletedAt) {
      throw new NotFoundException('Post is not found');
    }

    const updated = await this.prisma.post.update({
      where: { id },
      data: { status: PostStatus.ARCHIVED },
    });

    await this.auditService.log({
      actorId,
      action: 'POST_ARCHIVE',
      entityType: 'Post',
      entityId: id,
    });

    return updated;
  }
}
