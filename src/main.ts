import { randomUUID } from 'crypto';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  json,
  type NextFunction,
  type Request,
  type Response,
  urlencoded,
} from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { RequestWithUser } from './common/interfaces/request-with-user.interface';
import { PrismaService } from './database/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);
  const requestLoggingInterceptor = app.get(RequestLoggingInterceptor);

  const bodyLimit = String(configService.get<string>('app.bodyLimit', '10mb'));
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ limit: bodyLimit, extended: true }));

  const corsOrigins = configService.get<string[]>('app.corsOrigins', []) ?? [];
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS policy blocked this origin'));
    },
    credentials: true,
  });

  if (configService.get<boolean>('app.enableSecurityHeaders', true)) {
    app.use(helmet());
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    const incoming = req.get('x-request-id');
    const requestId =
      typeof incoming === 'string' && incoming.trim().length > 0
        ? incoming.trim()
        : randomUUID();

    (req as RequestWithUser).requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(requestLoggingInterceptor);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mahalla Yettiligi Backend API')
    .setDescription('Core backend APIs for Mahalla monitoring and management')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  prismaService.enableShutdownHooks(app);

  const appName = configService.get<string>(
    'app.name',
    'Mahalla Yettiligi API',
  );
  const host = configService.get<string>('app.host', 'localhost');
  const port = configService.get<number>('app.port', 3000);
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`${appName} is running`);
  logger.log(`API Base URL: http://${host}:${port}/api/v1`);
  logger.log(`Swagger URL:  http://${host}:${port}/docs`);
  logger.log(`Health URL:   http://${host}:${port}/api/v1/health`);
  logger.log(`Readiness URL: http://${host}:${port}/api/v1/health/readiness`);
}
void bootstrap();
