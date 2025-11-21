import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getCorsConfig(origin: string[]): CorsOptions {
  return {
    origin: origin ?? getEnvVariable('CORS_ORIGIN').split(','), // Restrict origins (use env variable)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // OPTIONS is automatically handled
    allowedHeaders: ['Content-Type', 'Authorization'], // Restrict headers
    credentials: true, // Allow cookies, but only if origin is not "*"
    preflightContinue: false, // Automatically handle preflight requests
    optionsSuccessStatus: 204, // Respond with 204 for preflight requests (improves performance)
  };
}
