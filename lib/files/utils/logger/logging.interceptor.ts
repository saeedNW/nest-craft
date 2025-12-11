import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLogger } from './app-logger.service';
import { RequestContextService } from './request-context.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly logger: AppLogger,
    private readonly requestContext: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const method = request.method;
    const originalUrl = request.originalUrl;
    const url = request.url;
    const startTime = Date.now();

    // Log incoming request
    const logMessage = `${method} ${originalUrl || url}`;
    const logContext = `${context.getClass().name}.${context.getHandler().name}`;

    this.logger.debug(`→ ${logMessage}`, logContext);

    // Update context with method and URL if not already set
    this.requestContext.setContext({
      method,
      url: originalUrl || url,
    });

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          const logLevel = this.getLogLevel(statusCode);
          const message = `← ${method} ${originalUrl || url || ''} ${statusCode} ${duration}ms`;

          if (logLevel === 'error') {
            this.logger.error(message, undefined, logContext);
          } else if (logLevel === 'warn') {
            this.logger.warn(message, logContext);
          } else {
            this.logger.log(message, logContext);
          }
        },
        error: error => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode || 500;
          const message = `← ${method} ${originalUrl || url || ''} ${statusCode} ${duration}ms [ERROR]`;

          const trace: string =
            (error instanceof Error && error.stack) ||
            (error instanceof Error && error.message) ||
            (typeof error === 'string' ? error : String(error));
          this.logger.error(message, trace, logContext);
        },
      }),
    );
  }

  private getLogLevel(statusCode: number): 'log' | 'warn' | 'error' {
    if (statusCode >= 500) {
      return 'error';
    }
    if (statusCode >= 400) {
      return 'warn';
    }
    return 'log';
  }
}
