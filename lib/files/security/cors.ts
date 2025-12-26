import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

function getEnvVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export function getCorsConfig(origin: string[]): CorsOptions {
  const corsOrigin = origin ?? getEnvVariable('CORS_ORIGIN').split(',');
  const finalOrigin = corsOrigin.includes('*') ? '*' : corsOrigin;
  return {
    origin: finalOrigin, // Restrict origins (use env variable)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // OPTIONS is automatically handled
    allowedHeaders: ['Content-Type', 'Authorization'], // Restrict headers
    credentials: false, // Allow cookies, but only if origin is not "*"
    preflightContinue: false, // Handle preflight requests
    optionsSuccessStatus: 204, // Respond with 204 for preflight requests (improves performance)
  };
}
