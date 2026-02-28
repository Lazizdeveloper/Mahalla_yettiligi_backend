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

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, actorId: string) {
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
}
