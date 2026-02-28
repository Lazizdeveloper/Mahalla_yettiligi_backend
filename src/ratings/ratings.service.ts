import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { CreateRatingDto } from './dto/create-rating.dto';

@Injectable()
export class RatingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateRatingDto, actorId: string) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id: dto.reportId },
      select: {
        id: true,
        mahallaId: true,
        month: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!report || report.deletedAt) {
      throw new NotFoundException('Monthly report is not found');
    }

    if (report.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted reports can be rated');
    }

    try {
      const rating = await this.prisma.rating.create({
        data: {
          reportId: report.id,
          userId: actorId,
          mahallaId: report.mahallaId,
          reportMonth: report.month,
          score: dto.score,
          verdict: dto.verdict,
          comment: dto.comment,
        },
      });

      await this.auditService.log({
        actorId,
        action: 'RATING_CREATE',
        entityType: 'Rating',
        entityId: rating.id,
        payload: {
          reportId: report.id,
          score: dto.score,
          verdict: dto.verdict,
        },
      });

      return rating;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'You have already rated this mahalla for the selected month',
        );
      }
      throw error;
    }
  }
}
