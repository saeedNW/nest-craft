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
 * @throws {Error} Throws an error if modification fails.
 */
export async function modifyMainTsFile(projectPath, options) {
  // Construct the path to the main.ts file
  const mainFilePath = path.join(projectPath, 'src', 'main.ts').replaceAll('\\', ''); // Ensure correct file path formatting across OS

  // Define the modifications based on the provided options
  const modifications = [
    {
      condition: options.customFilter,
      importStatement: `import { CustomExceptionFilter } from './common/filters/exception.filter';`,
      line: `app.useGlobalFilters(new CustomExceptionFilter());`,
      comment: '// initialize custom exception filter',
    },
    {
      condition: options.customPipe,
      importStatement: `import { HttpStatus, ValidationPipe } from '@nestjs/common';`,
      line: `app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true }, errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY}));`,
      comment: '// initialize custom validation pipe',
    },
    {
      condition: options.customInterceptor,
      importStatement: `import { ResponseTransformerInterceptor } from './common/interceptor/response-transformer.interceptor';`,
      line: `app.useGlobalInterceptors(new ResponseTransformerInterceptor());`,
      comment: '// initialize custom response interceptor',
    },
    {
      condition: options.swaggerConfig,
      importStatement: `import { swaggerConfiguration } from './configs/swagger.config';`,
      line: `swaggerConfiguration(app);`,
      comment: '// initialize swagger',
    },
    {
      condition: options.apiVersioning,
      importStatement: `import { VersioningType } from "@nestjs/common";`,
      line: `app.enableVersioning({type: VersioningType.URI,defaultVersion: "1"});`,
      comment: '// Enable API versioning',
    },
    {
      condition: !!options.prefix,
      importStatement: undefined,
      line: `app.setGlobalPrefix("${options.prefix}");`,
      comment: '// Set global prefix for all routes',
    },
    {
      condition: true,
      importStatement: undefined,
      line: `app.useStaticAssets("assets");`,
      comment: '// Register assets folder as static files directory',
    },
  ];

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
  await ensureNestExpressApplication(mainFilePath);
  // add catch to bootstrap call
  await wrapBootstrapCallWithCatch(mainFilePath);
}

/**
 * Inserts the given import statement at the top of the main.ts file.
 *
 * @param {string} importStatement The import statement to add.
 * @param {string} mainFilePath The path to the main.ts file.
 * @throws {Error} Throws an error if the insertion fails.
 */
async function insertImportStatement(importStatement, mainFilePath) {
  // Use `sed` to insert the import statement at the very top of the file
  await execa('sed', ['-i', `1i${importStatement}`, mainFilePath]);
}

/**
 * Inserts a global method line (such as filter, interceptor, etc.) and its corresponding comment
 * after the creation of the app in the main.ts file.
 *
 * @param {string} line The method line to add (e.g., `app.useGlobalFilters(...)`).
 * @param {string} comment The comment describing the modification being made.
 * @param {string} mainFilePath The path to the main.ts file.
 * @throws {Error} Throws an error if the insertion fails.
 */
async function insertGlobalMethod(line, comment, mainFilePath) {
  // Define the pattern to locate the app creation line in main.ts
  const appCreationPattern = 'const app = await NestFactory.create';

  // Insert the global method line after the app creation line
  await execa('sed', ['-i', `/^.*${appCreationPattern}.*$/a\\  ${line}`, mainFilePath]);

  // Insert the comment line after the app creation line (above the global method line)
  await execa('sed', ['-i', `/^.*${appCreationPattern}.*$/a\\  ${comment}`, mainFilePath]);
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
 * @returns {Promise<void>} Resolves when the import and app creation call are updated.
 */
async function ensureNestExpressApplication(mainFilePath) {
  const requiredImport = `import { NestExpressApplication } from '@nestjs/platform-express';`;
  const defaultAppCreation = 'const app = await NestFactory.create(AppModule);';
  const typedAppCreation =
    'const app = await NestFactory.create<NestExpressApplication>(AppModule);';

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
