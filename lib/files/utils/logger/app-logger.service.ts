import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RequestContextService } from './request-context.service';

@Injectable()
export class AppLogger implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly winston: Logger,
    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * Write a 'log' level log.
   */
  log(message: string, context?: string): void {
    this.winston.info(message, this.getMetadata(context));
  }

  /**
   * Write an 'error' level log.
   */
  error(message: string, trace?: string, context?: string): void {
    const metadata = this.getMetadata(context);
    if (trace) {
      metadata.stack = trace;
    }
    this.winston.error(message, metadata);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: string, context?: string): void {
    this.winston.warn(message, this.getMetadata(context));
  }

  /**
   * Write a 'debug' level log.
   */
  debug(message: string, context?: string): void {
    this.winston.debug(message, this.getMetadata(context));
  }

  /**
   * Write a 'verbose' level log.
   */
  verbose(message: string, context?: string): void {
    this.winston.verbose(message, this.getMetadata(context));
  }

  /**
   * Get metadata including context and request information
   */
  private getMetadata(context?: string): Record<string, unknown> {
    const requestContext = this.requestContext.getContext();
    const metadata: Record<string, unknown> = {};

    if (context) {
      metadata.context = context;
    }

    if (requestContext) {
      if (requestContext.requestId) {
        metadata.requestId = requestContext.requestId;
      }
      if (requestContext.method) {
        metadata.method = requestContext.method;
      }
      if (requestContext.url) {
        metadata.url = requestContext.url;
      }
      if (requestContext.ip) {
        metadata.ip = requestContext.ip;
      }
      if (requestContext.userAgent) {
        metadata.userAgent = requestContext.userAgent;
      }
    }

    return metadata;
  }
}
