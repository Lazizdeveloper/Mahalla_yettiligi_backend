import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role as PrismaRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, actorId: string) {
    const requiresMahalla =
      dto.role === Role.RESIDENT || dto.role === Role.STAFF;

    if (requiresMahalla && !dto.mahallaId) {
      throw new BadRequestException(
        'mahallaId is required for RESIDENT and STAFF',
      );
    }

    if (dto.mahallaId) {
      const mahalla = await this.prisma.mahalla.findFirst({
        where: {
          id: dto.mahallaId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!mahalla) {
        throw new BadRequestException('Mahalla is not found');
      }
    }

    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Phone number already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        fullName: dto.fullName,
        role: dto.role as PrismaRole,
        mahallaId: dto.mahallaId,
      },
    });

    if (dto.role === Role.STAFF) {
      await this.prisma.staffProfile.create({
        data: {
          userId: user.id,
          position: dto.staffPosition ?? 'CHAIRPERSON',
          twoFaRequired: true,
        },
      });
    }

    await this.auditService.log({
      actorId,
      action: 'USER_CREATE',
      entityType: 'User',
      entityId: user.id,
      payload: { role: dto.role, phone: dto.phone },
    });

    return user;
  }

  async findAll(query: ListUsersDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = {
      deletedAt: null,
      ...(query.role ? { role: query.role as PrismaRole } : {}),
      ...(query.mahallaId ? { mahallaId: query.mahallaId } : {}),
      ...(query.q
        ? {
            OR: [
              {
                fullName: {
                  contains: query.q,
                  mode: 'insensitive' as const,
                },
              },
              {
                phone: {
                  contains: query.q,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      total,
      page,
      pageSize,
      items,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        staffProfile: true,
        mahalla: {
          include: {
            district: {
              include: { region: true },
            },
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User is not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      include: { staffProfile: true },
    });

    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundException('User is not found');
    }

    if (dto.phone && dto.phone !== targetUser.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
        select: { id: true },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    const nextRole = dto.role ?? (targetUser.role as Role);
    const nextMahallaId = dto.mahallaId ?? targetUser.mahallaId ?? undefined;
    const requiresMahalla =
      nextRole === Role.RESIDENT || nextRole === Role.STAFF;

    if (requiresMahalla && !nextMahallaId) {
      throw new BadRequestException(
        'mahallaId is required for RESIDENT and STAFF',
      );
    }

    if (dto.mahallaId) {
      const mahalla = await this.prisma.mahalla.findFirst({
        where: {
          id: dto.mahallaId,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!mahalla) {
        throw new BadRequestException('Mahalla is not found');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.fullName ? { fullName: dto.fullName } : {}),
        ...(dto.role ? { role: dto.role as PrismaRole } : {}),
        ...(dto.mahallaId ? { mahallaId: dto.mahallaId } : {}),
      },
    });

    if (nextRole === Role.STAFF) {
      if (targetUser.staffProfile) {
        if (dto.staffPosition) {
          await this.prisma.staffProfile.update({
            where: { userId: id },
            data: { position: dto.staffPosition },
          });
        }
      } else {
        await this.prisma.staffProfile.create({
          data: {
            userId: id,
            position: dto.staffPosition ?? 'CHAIRPERSON',
            twoFaRequired: true,
          },
        });
      }
    } else if (targetUser.staffProfile) {
      await this.prisma.staffProfile.delete({
        where: { userId: id },
      });
    }

    await this.auditService.log({
      actorId,
      action: 'USER_UPDATE',
      entityType: 'User',
      entityId: id,
      payload: {
        phone: dto.phone,
        fullName: dto.fullName,
        role: dto.role,
        mahallaId: dto.mahallaId,
        staffPosition: dto.staffPosition,
      },
    });

    return updatedUser;
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });

    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundException('User is not found');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditService.log({
      actorId,
      action: 'USER_DELETE',
      entityType: 'User',
      entityId: id,
    });

    return { success: true };
  }
}
