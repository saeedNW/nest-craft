import path from "path";
import { execa } from "execa";

/**
 * Modifies the main.ts file in the NestJS project by conditionally inserting
 * necessary import statements and global method configurations based on the options.
 *
 * @param {string} projectPath The path to the project's root directory.
 * @param {Object} options The options that control which modifications to apply.
 * @param {boolean} options.customFilter If true, adds custom exception filter.
 * @param {boolean} options.customPipe If true, adds custom validation pipe.
 * @param {boolean} options.customInterceptor If true, adds custom response interceptor.
 * @param {boolean} options.swaggerConfig If true, adds Swagger configuration.
 * @throws {Error} Throws an error if modification fails.
 */
export async function modifyMainTsFile(projectPath, options) {
	// Construct the path to the main.ts file
	const mainFilePath = path
		.join(projectPath, "src", "main.ts")
		.replaceAll("\\", ""); // Ensure correct file path formatting across OS

	// Define the modifications based on the provided options
	const modifications = [
		{
			condition: options.customFilter,
			importStatement: `import { HttpExceptionFilter } from './common/filters/exception.filter';`,
			line: `app.useGlobalFilters(new HttpExceptionFilter());`,
			comment: "// initialize custom exception filter",
		},
		{
			condition: options.customPipe,
			importStatement: `import { UnprocessableEntityPipe } from './common/pipe/unprocessable-entity.pipe';`,
			line: `app.useGlobalPipes(new UnprocessableEntityPipe());`,
			comment: "// initialize custom validation pipe",
		},
		{
			condition: options.customInterceptor,
			importStatement: `import { ResponseTransformerInterceptor } from './common/interceptor/response-transformer.interceptor';`,
			line: `app.useGlobalInterceptors(new ResponseTransformerInterceptor());`,
			comment: "// initialize custom response interceptor",
		},
		{
			condition: options.swaggerConfig,
			importStatement: `import { swaggerConfiguration } from './configs/swagger.config';`,
			line: `swaggerConfiguration(app);`,
			comment: "// initialize swagger",
		},
	];

	// Modify the AppModule import statement
	await modifyAppModuleImport(mainFilePath);

	// Process each modification conditionally
	for (const mod of modifications) {
		if (mod.condition) {
			// Insert the import statement into the main.ts file
			await insertImportStatement(mod.importStatement, mainFilePath);
			// Insert the global method line and the comment for the modification
			await insertGlobalMethod(mod.line, mod.comment, mainFilePath);
		}
	}
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
	await execa("sed", ["-i", `1i${importStatement}`, mainFilePath]);
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
	const appCreationPattern = "const app = await NestFactory.create";

	// Insert the global method line after the app creation line
	await execa("sed", [
		"-i",
		`/^.*${appCreationPattern}.*$/a\\  ${line}`,
		mainFilePath,
	]);

	// Insert the comment line after the app creation line (above the global method line)
	await execa("sed", [
		"-i",
		`/^.*${appCreationPattern}.*$/a\\  ${comment}`,
		mainFilePath,
	]);
}

/**
 * Modifies the import statement for AppModule to the new path.
 *
 * @param {string} mainFilePath The path to the main.ts file.
 * @throws {Error} Throws an error if the modification fails.
 */
async function modifyAppModuleImport(mainFilePath) {
	// Use `sed` to search and replace the import statement for AppModule
	await execa("sed", [
		"-i",
		"s|import { AppModule } from './app.module';|import { AppModule } from './modules/app/app.module';|",
		mainFilePath,
	]);
}
