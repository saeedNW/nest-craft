import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';

/**
 * Response transformer interceptor.
 * This interceptor is used to transform the response object.
 */
@Injectable()
export class ResponseTransformerInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler<any>): any {
		/**
		 * Handle the request and return the response object.
		 */
		return next.handle().pipe(
			map((data) => {
				// Get the response object from context
				const ctx = context.switchToHttp();
				const Response = ctx.getResponse();
				// Get the status code from the response object
				const statusCode: number = Response.statusCode;

				// Return a simple text response if data was a string
				if (typeof data === 'string') {
					return {
						statusCode,
						success: true,
						message: data,
					};
				}

				// Set the default message
				let message: string = 'Process ended successfully';

				// Check if the data object has a message property
				if (data && typeof data === 'object' && 'message' in data) {
					message = data.message;
					delete data.message;
				}

				// Return the response object
				return {
					statusCode,
					success: true,
					message,
					data: Object.keys(data).length ? data : undefined,
				};
			}),
		);
	}
}
