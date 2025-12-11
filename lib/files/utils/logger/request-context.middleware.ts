import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from './request-context.service';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
	constructor(private readonly requestContext: RequestContextService) {}

	use(req: Request, res: Response, next: NextFunction): void {
		// Generate or extract request ID from headers
		const requestId = (req.headers['x-request-id'] as string) || uuidv4();

		// Set request ID in response headers for client correlation
		res.setHeader('X-Request-Id', requestId);

		// Create request context
		const context = {
			requestId,
			method: req.method,
			url: req.originalUrl || req.url,
			ip: req.ip || req.socket.remoteAddress || 'unknown',
			userAgent: req.headers['user-agent'],
		};

		// Run the request within the context
		this.requestContext.run(context, () => {
			next();
		});
	}
}
