import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

/**
 * Initialize Swagger document
 * @param {INestApplication} app - NestJS Application instance
 * @param {string} title - Swagger document title
 */
export function swaggerConfiguration(app: INestApplication, title: string = 'NestJS Application') {
  // Define Swagger options
  const document = new DocumentBuilder()
    .setTitle(title)
    .setDescription(`${title} documentation`)
    .setVersion('1.0.0')
    .addBearerAuth(swaggerBearerAuthConfig(), 'Authorization')
    .build();

  // Initialize Swagger document
  const swaggerDocument = SwaggerModule.createDocument(app, document);

  // Setup Swagger UI with custom options
  SwaggerModule.setup('/api/doc/8888', app, swaggerDocument, {
    swaggerOptions: { filter: true },
    customCssUrl: '/swagger-ui/custom.css',
    customJs: '/swagger-ui/custom.js',
  });
}

/**
 * define and return swagger bearer auth scheme
 * @returns {SecuritySchemeObject} - Swagger bearer Auth scheme object
 */
function swaggerBearerAuthConfig(): SecuritySchemeObject {
  return {
    type: 'http',
    bearerFormat: 'JWT',
    in: 'header',
    scheme: 'bearer',
  };
}
