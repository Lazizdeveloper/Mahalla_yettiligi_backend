import { Injectable } from '@nestjs/common';
import { ComplaintStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(mahallaId?: string) {
    const complaintWhere = {
      deletedAt: null,
      ...(mahallaId ? { mahallaId } : {}),
    };

    const ratingWhere = {
      ...(mahallaId ? { mahallaId } : {}),
    };

    const [
      totalComplaints,
      answeredComplaints,
      slaBreaches,
      averageScore,
      responseSpeedData,
      outsideAreaMinutes,
    ] = await Promise.all([
      this.prisma.complaint.count({ where: complaintWhere }),
      this.prisma.complaint.count({
        where: { ...complaintWhere, status: ComplaintStatus.ANSWERED },
      }),
      this.prisma.complaint.count({
        where: { ...complaintWhere, escalationFlag: true },
      }),
      this.prisma.rating.aggregate({
        where: ratingWhere,
        _avg: { score: true },
      }),
      this.prisma.$queryRaw<{ average_hours: number | null }[]>`
        SELECT AVG(EXTRACT(EPOCH FROM ("respondedAt" - "createdAt")) / 3600) AS average_hours
        FROM "Complaint"
        WHERE "deletedAt" IS NULL
        ${mahallaId ? Prisma.sql`AND "mahallaId" = ${mahallaId}` : Prisma.empty}
        AND "respondedAt" IS NOT NULL
      `,
      this.prisma.workSession.aggregate({
        where: {
          ...(mahallaId ? { mahallaId } : {}),
        },
        _sum: {
          outsideMinutes: true,
        },
      }),
    ]);

    const averageMonthlyRating = Number(averageScore._avg.score ?? 0);
    const complaintResolutionRate =
      totalComplaints === 0 ? 0 : (answeredComplaints / totalComplaints) * 100;
    const slaCompliance =
      totalComplaints === 0
        ? 100
        : ((totalComplaints - slaBreaches) / totalComplaints) * 100;

    const overallScore =
      0.4 * averageMonthlyRating +
      0.3 * (slaCompliance / 20) +
      0.2 * (complaintResolutionRate / 20) +
      0.1 * Math.max(0, 5 - slaBreaches / 10);

    return {
      totalComplaints,
      answeredComplaints,
      complaintResolutionRate: Number(complaintResolutionRate.toFixed(2)),
      slaBreaches,
      slaCompliance: Number(slaCompliance.toFixed(2)),
      averageMonthlyRating: Number(averageMonthlyRating.toFixed(2)),
      averageResponseHours: Number(
        (responseSpeedData[0]?.average_hours ?? 0).toFixed(2),
      ),
      outsideAreaMinutes: outsideAreaMinutes._sum.outsideMinutes ?? 0,
      overallScore: Number(overallScore.toFixed(2)),
    };
  }

  async getCharts(mahallaId?: string, months = 6) {
    const monthBoundary = new Date();
    monthBoundary.setUTCMonth(monthBoundary.getUTCMonth() - months + 1);
    monthBoundary.setUTCDate(1);
    monthBoundary.setUTCHours(0, 0, 0, 0);

    const ratingSeries = await this.prisma.$queryRaw<
      { month: Date; avg_score: number }[]
    >`
      SELECT DATE_TRUNC('month', "reportMonth") AS month, AVG(score)::float AS avg_score
      FROM "Rating"
      WHERE "reportMonth" >= ${monthBoundary}
      ${mahallaId ? Prisma.sql`AND "mahallaId" = ${mahallaId}` : Prisma.empty}
      GROUP BY DATE_TRUNC('month', "reportMonth")
      ORDER BY month ASC
    `;

    const complaintByCategory = await this.prisma.complaint.groupBy({
      by: ['category'],
      where: {
        deletedAt: null,
        ...(mahallaId ? { mahallaId } : {}),
      },
      _count: {
        _all: true,
      },
    });

    const outsideHeatmap = await this.prisma.$queryRaw<
      { bucket: Date; outside_count: bigint }[]
    >`
      SELECT DATE_TRUNC('day', "recordedAt") AS bucket, COUNT(*)::bigint AS outside_count
      FROM "LocationLog"
      WHERE "isOutside" = true
      ${mahallaId ? Prisma.sql`AND "mahallaId" = ${mahallaId}` : Prisma.empty}
      GROUP BY DATE_TRUNC('day', "recordedAt")
      ORDER BY bucket ASC
    `;

    return {
      ratingLine: ratingSeries.map((item) => ({
        month: item.month.toISOString().slice(0, 7),
        value: Number(item.avg_score.toFixed(2)),
      })),
      complaintsByCategory: complaintByCategory.map((item) => ({
        category: item.category,
        value: item._count._all,
      })),
      outsideAreaHeatmap: outsideHeatmap.map((item) => ({
        date: item.bucket.toISOString().slice(0, 10),
        value: Number(item.outside_count),
      })),
    };
  }
}
