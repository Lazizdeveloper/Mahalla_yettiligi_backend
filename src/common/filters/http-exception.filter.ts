import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithUser>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let details: unknown;
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      code = this.resolveErrorCode(status, exceptionResponse);

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const payload = exceptionResponse as {
          message?: unknown;
          details?: unknown;
          error?: unknown;
        };
        message = this.resolveMessage(payload.message);
        details = payload.details ?? payload.error;
      }
    }

    response.status(status).json({
      code,
      statusCode: status,
      message,
      details: details ?? null,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      requestId: request.requestId ?? null,
    });
  }

  private resolveMessage(value: unknown): string | string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }

    if (typeof value === 'string') {
      return value;
    }

    return 'Unexpected error';
  }

  private resolveErrorCode(status: number, response: unknown) {
    if (
      typeof response === 'object' &&
      response !== null &&
      'code' in response &&
      typeof (response as { code?: unknown }).code === 'string'
    ) {
      return (response as { code: string }).code;
    }

    const statusMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'RATE_LIMITED',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusMap[status] ?? 'HTTP_ERROR';
  }
}
