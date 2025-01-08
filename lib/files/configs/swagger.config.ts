import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

/**
 * Define swagger consumes type as an enum
 */
export enum SwaggerConsumes {
	// Swagger form input type
	URL_ENCODED = 'application/x-www-form-urlencoded',
	// Swagger raw json data type
	JSON = 'application/json',
	// Swagger multipart form data type
	MULTIPART_FORM_DATA = 'multipart/form-data',
}

/**
 * initialize swagger document
 * @param app NestJS Application instance
 */
export function swaggerConfiguration(app: INestApplication) {
	// define the swagger options and configs
	const document = new DocumentBuilder()
		.setTitle('NestJS Application')
		.setDescription('API documentation of the NestJS application')
		.setVersion('1.0.0')
		.addBearerAuth(swaggerBearerAuthConfig(), 'Authorization')
		.build();

	// Initialize swagger document based on defined options
	const swaggerDocument = SwaggerModule.createDocument(app, document);

	// setup swagger ui page
	SwaggerModule.setup('/api-doc', app, swaggerDocument);
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
