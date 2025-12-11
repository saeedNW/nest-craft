import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions, WinstonModuleOptionsFactory } from 'nest-winston';
import * as winston from 'winston';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const DailyRotateFile = require('winston-daily-rotate-file');

export interface LoggerConfig {
	level: string;
	logDir: string;
	maxFiles: string;
	maxSize: string;
}

@Injectable()
export class LoggerConfigService implements WinstonModuleOptionsFactory {
	constructor(private readonly configService: ConfigService) {}

	createWinstonModuleOptions(): WinstonModuleOptions {
		const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
		const logLevel = this.getLogLevel(nodeEnv);
		const logDir = this.configService.get<string>('LOG_DIR', 'logs');
		const maxFiles = this.configService.get<string>('LOG_MAX_FILES', '14d');
		const maxSize = this.configService.get<string>('LOG_MAX_SIZE', '20m');

		// Common format for all transports
		const timestampFormat = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' });

		// Development format: human-readable, colorized
		const devFormat = winston.format.combine(
			timestampFormat,
			winston.format.errors({ stack: true }),
			winston.format.colorize({ all: true }),
			winston.format.printf((info: winston.Logform.TransformableInfo) => {
				const { timestamp, level, message, context, requestId, ...meta } = info;
				const contextStr = context && typeof context === 'string' ? `[${context}]` : '';
				const requestIdStr = requestId && typeof requestId === 'string' ? `[req:${requestId}]` : '';
				const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';

				// Safely convert message to string
				let messageStr = '';
				if (typeof message === 'string') {
					messageStr = message;
				} else if (message != null) {
					try {
						messageStr = JSON.stringify(message);
					} catch {
						// If JSON.stringify fails, use a safe fallback
						messageStr = '[Non-stringifiable message]';
					}
				}

				// Safely convert level to string
				let levelStr = '';
				if (typeof level === 'string') {
					levelStr = level;
				} else if (level != null) {
					try {
						levelStr = JSON.stringify(level);
					} catch {
						levelStr = '[Non-stringifiable level]';
					}
				}

				// Safely convert timestamp to string
				let timestampStr = '';
				if (typeof timestamp === 'string') {
					timestampStr = timestamp;
				} else if (timestamp != null) {
					try {
						timestampStr = JSON.stringify(timestamp);
					} catch {
						timestampStr = '[Non-stringifiable timestamp]';
					}
				}

				return `${timestampStr} ${levelStr} ${contextStr}${requestIdStr} ${messageStr}${metaStr}`;
			}),
		);

		// Production format: structured JSON
		const prodFormat = winston.format.combine(
			timestampFormat,
			winston.format.errors({ stack: true }),
			winston.format.json(),
		);

		const isDevelopment = nodeEnv === 'development';
		const isTest = nodeEnv === 'test';

		// Console transport
		const consoleTransport = new winston.transports.Console({
			level: logLevel,
			format: isDevelopment ? devFormat : prodFormat,
			silent: isTest && logLevel === 'error', // Silent in test unless error level
		});

		// File transports (skip in test environment)
		const transports: winston.transport[] = [consoleTransport];

		if (!isTest) {
			// General log file (all levels)
			const generalFileTransport = new DailyRotateFile({
				filename: `${logDir}/app-%DATE%.log`,
				datePattern: 'YYYY-MM-DD',
				maxFiles: maxFiles,
				maxSize: maxSize,
				level: logLevel,
				format: prodFormat,
				zippedArchive: true,
				createSymlink: true,
				symlinkName: 'app-current.log',
			});

			// Error log file (errors and above only)
			const errorFileTransport = new DailyRotateFile({
				filename: `${logDir}/error-%DATE%.log`,
				datePattern: 'YYYY-MM-DD',
				maxFiles: maxFiles,
				maxSize: maxSize,
				level: 'error',
				format: prodFormat,
				zippedArchive: true,
				createSymlink: true,
				symlinkName: 'error-current.log',
			});

			transports.push(generalFileTransport, errorFileTransport);
		}

		return {
			level: logLevel,
			transports,
			exitOnError: false, // Don't exit on handled exceptions
		};
	}

	private getLogLevel(nodeEnv: string): string {
		// Allow override via LOG_LEVEL env var
		const envLogLevel = process.env.LOG_LEVEL;
		if (envLogLevel) {
			return envLogLevel.toLowerCase();
		}

		// Defaults based on environment
		switch (nodeEnv) {
			case 'production':
				return 'info';
			case 'test':
				return 'warn';
			case 'development':
			default:
				return 'debug';
		}
	}
}
