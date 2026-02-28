import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MonthlyReportStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { parseReportMonth } from '../common/utils/date.util';
import { PrismaService } from '../database/prisma.service';
import {
  CreateMonthlyReportDto,
  ReportItemInputDto,
} from './dto/create-monthly-report.dto';
import { ListReportsDto } from './dto/list-reports.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateMonthlyReportDto, actor: AuthenticatedUser) {
    const actorRecord = await this.prisma.user.findUnique({
      where: { id: actor.userId },
      select: { mahallaId: true },
    });

    const mahallaId =
      actor.role === Role.ADMIN || actor.role === Role.SUPER_ADMIN
        ? dto.mahallaId
        : actorRecord?.mahallaId;

    if (!mahallaId) {
      throw new BadRequestException('Mahalla is required for report creation');
    }

    let monthDate: Date;
    try {
      monthDate = parseReportMonth(dto.month);
    } catch {
      throw new BadRequestException('Month must be in YYYY-MM format');
    }

    const report = await this.prisma.monthlyReport.upsert({
      where: {
        mahallaId_month: {
          mahallaId,
          month: monthDate,
        },
      },
      update: {
        summary: dto.summary,
        status: dto.status ?? MonthlyReportStatus.DRAFT,
        submittedById: actor.userId,
        items: {
          deleteMany: {},
        },
      },
      create: {
        mahallaId,
        month: monthDate,
        summary: dto.summary,
        status: dto.status ?? MonthlyReportStatus.DRAFT,
        submittedById: actor.userId,
      },
    });

    for (const item of dto.items) {
      await this.createReportItem(report.id, item, actor.userId);
    }

    await this.auditService.log({
      actorId: actor.userId,
      action: 'MONTHLY_REPORT_UPSERT',
      entityType: 'MonthlyReport',
      entityId: report.id,
      payload: {
        month: dto.month,
        mahallaId,
        status: dto.status ?? MonthlyReportStatus.DRAFT,
      },
    });

    return this.prisma.monthlyReport.findUnique({
      where: { id: report.id },
      include: {
        items: {
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
        },
      },
    });
  }

  async findAll(query: ListReportsDto, actor: AuthenticatedUser) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const actorRecord =
      actor.role === Role.RESIDENT || actor.role === Role.STAFF
        ? await this.prisma.user.findUnique({
            where: { id: actor.userId },
            select: { mahallaId: true },
          })
        : null;

    let monthFilter: Date | undefined;
    if (query.month) {
      try {
        monthFilter = parseReportMonth(query.month);
      } catch {
        throw new BadRequestException('Month must be in YYYY-MM format');
      }
    }

    const where = {
      deletedAt: null,
      ...(query.mahallaId ? { mahallaId: query.mahallaId } : {}),
      ...(monthFilter ? { month: monthFilter } : {}),
      ...(actor.role === Role.RESIDENT || actor.role === Role.STAFF
        ? { mahallaId: actorRecord?.mahallaId ?? '___none___' }
        : {}),
      ...(actor.role === Role.RESIDENT
        ? { status: MonthlyReportStatus.SUBMITTED }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.monthlyReport.findMany({
        where,
        orderBy: { month: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          items: {
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
          },
          ratings: true,
        },
      }),
      this.prisma.monthlyReport.count({ where }),
    ]);

    return {
      total,
      page,
      pageSize,
      items,
    };
  }

  private async createReportItem(
    reportId: string,
    item: ReportItemInputDto,
    actorId: string,
  ) {
    const reportItem = await this.prisma.reportItem.create({
      data: {
        reportId,
        workName: item.workName,
        workDate: new Date(item.workDate),
        resultText: item.resultText,
      },
    });

    if (item.evidenceMediaIds?.length) {
      await this.prisma.mediaFile.updateMany({
        where: {
          id: { in: item.evidenceMediaIds },
          uploadedById: actorId,
          postId: null,
          complaintId: null,
          reportItemId: null,
        },
        data: {
          reportItemId: reportItem.id,
        },
      });
    }

    return reportItem;
  }

  async findOne(id: string) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id },
      include: { items: true, ratings: true },
    });

    if (!report || report.deletedAt) {
      throw new NotFoundException('Monthly report not found');
    }

    return report;
  }
}
