import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { map } from 'rxjs';

/**
 * Response transformer interceptor.
 * This interceptor is used to transform the response object.
 */
@Injectable()
export class ResponseTransformerInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler<any>): any {
    // Switch to HTTP context
    const ctx = context.switchToHttp();
    // Get the response object from context
    const Response = ctx.getResponse<Response>();
    // Get the status code from the response object
    const statusCode: number = Response.statusCode;

    return next.handle().pipe(
      map((data: Record<string, any> | string) => {
        // Return a simple text response if data was a string
        if (typeof data === 'string') {
          return {
            statusCode,
            success: true,
            message: data,
            data: {},
          };
        }

        // Set the default message
        let message: string = 'Process ended successfully';

        // Check if the data object has a message property
        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message as string;
          delete data.message;
        }

        data = Object.keys(data).length ? data : Array.isArray(data) ? { items: data } : {};

        // Return the response object
        return {
          statusCode,
          success: true,
          message,
          data,
        };
      }),
    );
  }
}
