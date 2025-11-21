import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

/**
 * Implement custom response logic for exceptions.
 * This filter will change the application exception
 * response structure before sending it to client
 */
@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    // Get the response object from context
    const response = host.switchToHttp().getResponse<Response>();

    // Retrieve the exception's status code
    const statusCode: number =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    // Retrieve the exception's message
    const exceptionResponse: string | object | undefined =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    // Retrieve the exception's response message and code
    let message: string;
    let code: string | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      code = exception instanceof HttpException ? 'UNKNOWN_ERROR' : 'INTERNAL_ERROR';
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const errorObj = exceptionResponse as { message?: string; code?: string };
      message = errorObj.message || '';
      code = errorObj.code;
    } else {
      message = 'Internal server error';
      code = 'INTERNAL_ERROR';
    }

    // Send the response
    const responseBody: {
      statusCode: number;
      success: boolean;
      timestamp: string;
      errors: {
        message: string;
        code?: string;
      };
    } = {
      statusCode,
      success: false,
      timestamp: new Date().toISOString(),
      errors: {
        message,
      },
    };

    // Include code if it exists
    if (code) {
      responseBody.errors.code = code;
    }

    response.status(statusCode).json(responseBody);
  }
}
