import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppLogger } from './app-logger.service';
import { LoggerConfigService } from './logger.config';
import { LoggingInterceptor } from './logging.interceptor';
import { RequestContextMiddleware } from './request-context.middleware';
import { RequestContextService } from './request-context.service';

@Global()
@Module({
	imports: [
		WinstonModule.forRootAsync({
			useClass: LoggerConfigService,
		}),
	],
	providers: [
		LoggerConfigService,
		RequestContextService,
		RequestContextMiddleware,
		AppLogger,
		LoggingInterceptor,
	],
	exports: [AppLogger, RequestContextService, RequestContextMiddleware, LoggingInterceptor],
})
export class LoggerModule {}
