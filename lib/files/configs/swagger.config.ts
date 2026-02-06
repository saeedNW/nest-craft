import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

/**
 * Initialize Swagger document
 * @param {INestApplication} app - NestJS Application instance
 * @param {string} title - Swagger document title
 */
export function swaggerConfiguration(app: INestApplication, title: string = 'NestJS Application') {
  if (process.env.NODE_ENV !== 'development') return;

  // Define Swagger options
  const document = new DocumentBuilder()
    .setTitle(title)
    .setDescription(`${title} documentation`)
    .setVersion('1.0.0')
    .addBearerAuth(swaggerBearerAuthConfig())
    .build();

  // Initialize Swagger document
  const swaggerDocument = SwaggerModule.createDocument(app, document);

  // Setup Swagger UI with custom options
  SwaggerModule.setup('/api-doc', app, swaggerDocument, {
    customSiteTitle: title,
    customfavIcon: 'https://cdn-icons-png.flaticon.com/512/3176/3176376.png',
    swaggerOptions: {
      persistAuthorization: true,
      filter: true,
      showRequestDuration: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
      syntaxHighlight: {
        activate: true,
        theme: 'obsidian',
        // arta
        // monokai
        // obsidian
        // tomorrow-night
      },
    },
    customJs: '/swagger-ui/custom.js',
    customCssUrl: '/swagger-ui/custom.css',
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
    name: 'Authorization',
    description: 'Enter JWT as: Bearer <token>',
    in: 'header',
    scheme: 'bearer',
  };
}
