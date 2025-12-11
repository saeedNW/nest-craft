import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
	requestId: string;
	method?: string;
	url?: string;
	ip?: string;
	userAgent?: string;
}

@Injectable()
export class RequestContextService {
	private readonly als = new AsyncLocalStorage<RequestContext>();

	/**
	 * Run a function within a request context
	 */
	run<T>(context: RequestContext, callback: () => T): T {
		return this.als.run(context, callback);
	}

	/**
	 * Get the current request context
	 */
	getContext(): RequestContext | undefined {
		return this.als.getStore();
	}

	/**
	 * Get the current request ID
	 */
	getRequestId(): string | undefined {
		return this.als.getStore()?.requestId;
	}

	/**
	 * Set context properties (for updating during request lifecycle)
	 */
	setContext(updates: Partial<RequestContext>): void {
		const context = this.als.getStore();
		if (context) {
			Object.assign(context, updates);
		}
	}
}
