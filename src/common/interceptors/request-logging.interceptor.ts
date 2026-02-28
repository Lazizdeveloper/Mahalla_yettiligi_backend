import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, tap } from 'rxjs';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('RequestLog');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => this.logRequest(request, response.statusCode, startedAt),
        error: (error: unknown) => {
          const statusCode =
            error instanceof HttpException ? error.getStatus() : 500;
          this.logRequest(request, statusCode, startedAt);
        },
      }),
    );
  }

  private logRequest(
    request: RequestWithUser,
    statusCode: number,
    startedAt: number,
  ) {
    const payload = {
      timestamp: new Date().toISOString(),
      requestId: request.requestId,
      method: request.method,
      path: request.originalUrl,
      statusCode,
      durationMs: Date.now() - startedAt,
      userId: request.user?.userId ?? null,
      ip: request.ip,
    };

    this.logger.log(JSON.stringify(payload));
  }
}
