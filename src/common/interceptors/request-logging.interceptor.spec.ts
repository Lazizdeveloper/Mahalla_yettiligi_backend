import { of, throwError } from 'rxjs';
import { RequestLoggingInterceptor } from './request-logging.interceptor';

describe('RequestLoggingInterceptor', () => {
  let interceptor: RequestLoggingInterceptor;

  beforeEach(() => {
    interceptor = new RequestLoggingInterceptor();
  });

  it('passes through successful responses', (done) => {
    const request = {
      method: 'GET',
      originalUrl: '/api/v1/health',
      requestId: 'req-1',
      user: { userId: 'user-1' },
      ip: '127.0.0.1',
    };
    const response = { statusCode: 200 };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };

    interceptor
      .intercept(context as never, { handle: () => of('ok') } as never)
      .subscribe({
        next: (value) => expect(value).toBe('ok'),
        complete: () => {
          done();
        },
      });
  });

  it('passes through error responses', (done) => {
    const request = {
      method: 'GET',
      originalUrl: '/api/v1/health',
      requestId: 'req-1',
      user: { userId: 'user-1' },
      ip: '127.0.0.1',
    };
    const response = { statusCode: 500 };
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    };

    interceptor
      .intercept(
        context as never,
        { handle: () => throwError(() => new Error('x')) } as never,
      )
      .subscribe({
        error: () => {
          done();
        },
      });
  });
});
