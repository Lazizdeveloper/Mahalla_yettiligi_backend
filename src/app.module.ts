import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MahallasModule } from './mahallas/mahallas.module';
import { PostsModule } from './posts/posts.module';
import { MediaModule } from './media/media.module';
import { ComplaintsModule } from './complaints/complaints.module';
import { SlaModule } from './sla/sla.module';
import { ReportsModule } from './reports/reports.module';
import { RatingsModule } from './ratings/ratings.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuditModule } from './audit/audit.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { EventsModule } from './events/events.module';
import { WorkTrackingModule } from './work-tracking/work-tracking.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host', '127.0.0.1'),
          port: configService.get<number>('redis.port', 6379),
          password: configService.get<string>('redis.password') || undefined,
        },
      }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    MahallasModule,
    PostsModule,
    MediaModule,
    ComplaintsModule,
    SlaModule,
    ReportsModule,
    RatingsModule,
    DashboardModule,
    AuditModule,
    NotificationsModule,
    HealthModule,
    EventsModule,
    WorkTrackingModule,
    IntegrationsModule,
  ],
  providers: [
    RequestLoggingInterceptor,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
