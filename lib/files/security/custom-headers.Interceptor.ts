import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Response } from "express";
import { Observable } from "rxjs";

/**
 * Interceptor to modify the response headers.
 *
 * This interceptor sets custom response headers to fake the tech stack
 * and mimic a different server environment.
 */
@Injectable()
export class CustomHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse<Response>();

    // Modify the response headers
    response.setHeader("X-Powered-By", "Python 3.14.0"); // Fake the tech stack
    response.setHeader("Server", "Gunicorn/20.1.0"); // Mimic a Python server

    return next.handle();
  }
}
