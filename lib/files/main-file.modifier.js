import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';

/**
 * Modifies the main.ts file in the NestJS project by conditionally inserting
 * necessary import statements and global method configurations based on the options.
 *
 * @param {string} projectPath The path to the project's root directory.
 * @param {Object} options The options that control which modifications to apply.
 * @param {boolean} options.customFilter If true, adds custom exception filter.
 * @param {boolean} options.customInterceptor If true, adds custom response interceptor.
 * @param {boolean} options.swaggerConfig If true, adds Swagger configuration.
 * @param {boolean} options.prefix If true, adds API prefix configuration.
 * @param {boolean} options.apiVersioning If true, adds API versioning configuration.
 * @param {Object} options.securityOptions - Whether to include the security files.
 * @param {boolean} options.winstonLogger If true, adds Winston Logger configuration.
 * @throws {Error} Throws an error if modification fails.
 */
export async function modifyMainTsFile(projectPath, options) {
  // Construct the path to the main.ts file
  const mainFilePath = path.join(projectPath, 'src', 'main.ts').replaceAll('\\', ''); // Ensure correct file path formatting across OS

  const customPipeModification = {
    condition: options.customPipe,
    importStatement: [`import { HttpStatus, ValidationPipe } from '@nestjs/common';`],
    line: [
      `app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true, errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY}));`,
    ],
    comment: ['// initialize custom validation pipe'],
  };

  // Define the modifications based on the provided options
  const modifications = [
    {
      condition: options.customFilter,
      importStatement: [
        `import { CustomExceptionFilter } from './common/filters/exception.filter';`,
      ],
      line: [`app.useGlobalFilters(new CustomExceptionFilter());`],
      comment: ['// initialize custom exception filter'],
    },
    customPipeModification,
    {
      condition: options.swaggerConfig,
      importStatement: [`import { swaggerConfiguration } from './configs/swagger.config';`],
      line: [`swaggerConfiguration(app);`],
      comment: ['// initialize swagger'],
    },
    {
      condition: options.apiVersioning,
      importStatement: [`import { VersioningType } from "@nestjs/common";`],
      line: [`app.enableVersioning({type: VersioningType.URI,defaultVersion: "1"});`],
      comment: ['// Enable API versioning'],
    },
    {
      condition: !!options.prefix,
      importStatement: [],
      line: [`app.setGlobalPrefix("${options.prefix}");`],
      comment: ['// Set global prefix for all routes'],
    },
    {
      condition:
        options.securityOptions.enabled && options.securityOptions.selections.includes('helmet'),
      importStatement: [
        `import helmet from 'helmet';`,
        `import { helmetConfig } from './security/helmet';`,
      ],
      line: [`if (process.env.NODE_ENV === "production") {app.use(helmet(helmetConfig));}`],
      comment: ['// Secure the app with Helmet'],
    },
    {
      condition:
        options.securityOptions.enabled && options.securityOptions.selections.includes('cors'),
      importStatement: [`import { getCorsConfig } from './security/cors';`],
      line: [`app.enableCors(getCorsConfig(["*"]));`],
      comment: ['// Apply CORS config'],
    },
    {
      condition: true,
      importStatement: [],
      line: [`app.useStaticAssets('assets');`],
      comment: ['// Register assets folder as static files directory'],
    },
    {
      condition: options.winstonLogger,
      importStatement: ['import { NextFunction, Request, Response } from "express";'],
      line: [
        'app.use((req: Request, res: Response, next: NextFunction) => {requestContextMiddleware.use(req, res, next);});',
      ],
      comment: [
        '// Register request context middleware FIRST to establish request context for all subsequent operations',
      ],
    },
    {
      condition: options.winstonLogger,
      importStatement: [],
      line: ['initializeConsoleOverrides(appLogger);'],
      comment: [
        '// This must be done early, before other modules start logging',
        '// Initialize console overrides to route all console.* calls through Winston',
      ],
    },
    {
      condition: options.winstonLogger,
      importStatement: [],
      line: ['app.useLogger(appLogger);'],
      comment: ['// Replace NestJS default logger with Winston-based AppLogger'],
    },
    {
      condition: options.winstonLogger,
      importStatement: [
        'import { AppLogger, LoggingInterceptor, initializeConsoleOverrides, RequestContextMiddleware } from "./modules/logger";',
      ],
      line: [
        'const loggingInterceptor = app.get(LoggingInterceptor);',
        'const requestContextMiddleware = app.get(RequestContextMiddleware);',
        'const appLogger = app.get(AppLogger);',
      ],
      comment: ['// Get logger services'],
    },
  ];

  const interceptorsConfig = [];

  if (options.winstonLogger) {
    interceptorsConfig.push({
      importStatement: [],
      instance: 'loggingInterceptor',
    });
  }

  if (
    options.securityOptions.enabled &&
    options.securityOptions.selections.includes('fake-tech-stack-headers')
  ) {
    interceptorsConfig.push({
      importStatement: [
        `import { CustomHeadersInterceptor } from './security/custom-headers.Interceptor';`,
      ],
      instance: 'new CustomHeadersInterceptor()',
    });
  }

  if (options.customInterceptor) {
    interceptorsConfig.push({
      importStatement: [
        `import { ResponseTransformerInterceptor } from './common/interceptor/response-transformer.interceptor';`,
      ],
      instance: 'new ResponseTransformerInterceptor()',
    });
  }

  if (interceptorsConfig.length) {
    for (const interceptor of interceptorsConfig) {
      await insertImportStatement(interceptor.importStatement, mainFilePath);
    }
    const interceptorsCall = interceptorsConfig.map(({ instance }) => instance).join(', ');
    const interceptorsModification = {
      condition: true,
      importStatement: [],
      line: [`app.useGlobalInterceptors(${interceptorsCall});`],
      comment: ['// initialize custom interceptors'],
    };

    const customPipeIndex = modifications.indexOf(customPipeModification);
    if (customPipeIndex === -1) {
      modifications.push(interceptorsModification);
    } else {
      modifications.splice(customPipeIndex, 0, interceptorsModification);
    }
  }

  // Process each modification conditionally
  for (const mod of modifications) {
    if (mod.condition) {
      if (mod.importStatement) {
        // Insert the import statement into the main.ts file
        await insertImportStatement(mod.importStatement, mainFilePath);
      }
      // Insert the global method line and the comment for the modification
      await insertGlobalMethod(mod.line, mod.comment, mainFilePath);
    }
  }

  // Replace Nest application with Nest Express Application
  await ensureNestExpressApplication(mainFilePath, options.winstonLogger);
  // add catch to bootstrap call
  await wrapBootstrapCallWithCatch(mainFilePath);
}

/**
 * Inserts the given import statement at the top of the main.ts file.
 *
 * @param {string[]} importStatement The import statement to add.
 * @param {string} mainFilePath The path to the main.ts file.
 * @throws {Error} Throws an error if the insertion fails.
 */
async function insertImportStatement(importStatement, mainFilePath) {
  // Use `sed` to insert the import statement at the very top of the file
  for (const statement of importStatement) {
    await execa('sed', ['-i', `1i${statement}`, mainFilePath]);
  }
}

/**
 * Inserts a global method line (such as filter, interceptor, etc.) and its corresponding comment
 * after the creation of the app in the main.ts file.
 *
 * @param {string[]} line The method lines to add (e.g., `app.useGlobalFilters(...)`).
 * @param {string[]} comment The comments describing the modification being made.
 * @param {string} mainFilePath The path to the main.ts file.
 * @throws {Error} Throws an error if the insertion fails.
 */
async function insertGlobalMethod(line, comment, mainFilePath) {
  // Define the pattern to locate the app creation line in main.ts
  const appCreationPattern = 'const app = await NestFactory.create';

  // Insert the global method lines after the app creation line
  for (const methodLine of line) {
    await execa('sed', ['-i', `/^.*${appCreationPattern}.*$/a\\  ${methodLine}`, mainFilePath]);
  }

  // Insert the comment lines after the app creation line (above the global method lines)
  for (const commentLine of comment) {
    await execa('sed', ['-i', `/^.*${appCreationPattern}.*$/a\\  ${commentLine}`, mainFilePath]);
  }
}

/**
 * Ensures the bootstrap function call handles rejections.
 *
 * @param {string} mainFilePath The path to the main.ts file.
 * @returns {Promise<void>} Resolves when the replacement is complete.
 */
async function wrapBootstrapCallWithCatch(mainFilePath) {
  const wrappedBootstrapCall = 'bootstrap().catch(err => console.log(err));';
  await execa('sed', ['-i', `s/bootstrap();/${wrappedBootstrapCall}/`, mainFilePath]);
}

/**
 * Ensures the NestFactory app creation call uses the NestExpressApplication type and required import.
 *
 * @param {string} mainFilePath The path to the main.ts file.
 * @param {boolean} loggerStatus Whether the user required the winston logger or not
 * @returns {Promise<void>} Resolves when the import and app creation call are updated.
 */
async function ensureNestExpressApplication(mainFilePath, loggerStatus) {
  const requiredImport = [`import { NestExpressApplication } from '@nestjs/platform-express';`];
  const defaultAppCreation = 'const app = await NestFactory.create(AppModule);';
  const typedAppCreation = loggerStatus
    ? 'const app = await NestFactory.create<NestExpressApplication>(AppModule, {bufferLogs: true});'
    : 'const app = await NestFactory.create<NestExpressApplication>(AppModule);';

  let fileContent = await fs.readFile(mainFilePath, 'utf-8');

  if (!fileContent.includes(requiredImport)) {
    await insertImportStatement(requiredImport, mainFilePath);
    fileContent = await fs.readFile(mainFilePath, 'utf-8');
  }

  if (fileContent.includes(defaultAppCreation)) {
    const updatedContent = fileContent.replace(defaultAppCreation, typedAppCreation);
    if (updatedContent !== fileContent) {
      await fs.writeFile(mainFilePath, updatedContent);
    }
  }
}
