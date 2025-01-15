import { outro, tasks } from "@clack/prompts";
import { selectDockerServices } from "../lib/docker/service-selector.js";
import { ensureDirectoryPermissions } from "../lib/functions/ensure-dir-permission.js";
import { errorHandler } from "../lib/functions/error-handler.js";
import { displayBanner } from "../lib/functions/main-banner.js";
import { resolveProjectPaths } from "../lib/functions/resolve-project-path.js";
import { booleanPrompt } from "../lib/prompts/boolean.prompt.js";
import { cancelPrompt } from "../lib/prompts/cancel.prompt.js";
import { promptPackageManager } from "../lib/prompts/package-manager.prompt.js";
import { promptPaginationType } from "../lib/prompts/pagination.prompt.js";
import { textPrompt } from "../lib/prompts/text.prompt.js";
import { isNestProject } from "../lib/shell/shell.commands.js";
import { dockerComposeGenerator } from "../lib/docker/config-generator.js";
import { filesManager } from "../lib/files/files.manager.js";
import chalk from "chalk";

export async function addFeature() {
	// Display the CLI banner and introduction message.
	displayBanner("Adding feature to existing project");

	// Prompt the user to input the project's path
	const projectPath = await textPrompt(
		'Enter Project\'s directory path [Current directory "."]:',
		true
	);
	// Handle cancellation during the prompt.
	cancelPrompt(projectPath);

	// Resolve the project paths based on the user input.
	const { targetDirectory, parentDirectory } = await resolveProjectPaths(
		projectPath
	);

	try {
		// Ensure the target and parent directories have the necessary writing permissions.
		await ensureDirectoryPermissions(targetDirectory, parentDirectory, true);

		// Ensure the target directory contain a NestJS project
		await isNestProject(targetDirectory);

		// Prompt the user to select a package manager.
		const packageManager = await promptPackageManager();
		cancelPrompt(packageManager); // Handle cancellation during the prompt.

		// Collect additional project configuration options from the user.
		const options = await collectOptions();

		await featureFinalization(targetDirectory, packageManager, options);

		// Display a success message upon completing the project setup.
		outro(chalk.green("Thanks for using Nest Craft! Your project is ready."));
	} catch (error) {
		// Handle errors by passing the error message and removing the new directory.
		await errorHandler(error);
	}
}

/**
 *Collects various configuration options for the project.
 *
 * This function prompts the user to select or input various options such as:
 * - Docker service configuration
 * - Custom exception filter, pipe, and interceptor
 * - Swagger configuration
 * - Pagination utility
 * - Multer file uploader
 *
 * @returns {Promise<Object>} An object containing the selected options:
 * - dockerComposeConfig: The selected Docker services configuration.
 * - customFilter: Boolean indicating if a custom exception filter is needed.
 * - customPipe: Boolean indicating if a custom pipe is needed.
 * - customInterceptor: Boolean indicating if a custom response interceptor is needed.
 * - swaggerConfig: Boolean indicating if Swagger config is needed.
 * - paginationType: The selected pagination utility type (if any).
 * - multer: Boolean indicating if Multer file uploader is needed.
 */
async function collectOptions() {
	// Prompt the user to select Docker services configuration.
	const dockerComposeConfig = await selectDockerServices();

	// Prompt the user to decide whether they need a custom exception filter.
	const customFilter = await booleanPrompt(
		"Do you need a Custom Exception Filter?"
	);

	// Prompt the user to decide whether they need a custom unprocessable entity pipe.
	const customPipe = await booleanPrompt(
		"Do you need a Custom Unprocessable Entity Pipe?"
	);

	// Prompt the user to decide whether they need a custom response interceptor.
	const customInterceptor = await booleanPrompt(
		"Do you need a Custom Response Interceptor?"
	);

	// Prompt the user to decide whether they need Swagger configuration.
	const swaggerConfig = await booleanPrompt("Do you need Swagger config?");

	// Prompt the user to select a pagination utility type (TypeORM, Mongoose, or None).
	const paginationType = await promptPaginationType();

	// Prompt the user to decide whether they need Multer file uploader.
	const multer = await booleanPrompt("Do you need Multer File Uploader?");

	return {
		dockerComposeConfig,
		customFilter,
		customPipe,
		customInterceptor,
		swaggerConfig,
		paginationType,
		multer,
	};
}

/**
 * Finalize adding new feature to an existing project
 *
 * This function handles the creation of the Docker configuration, directory setup,
 * application module management, and necessary file copying based on the provided options.
 *
 * @param {string} targetDirectory The target directory where the project files should be created.
 * @param {string} packageManager The package manager to be used (e.g., npm, yarn, pnpm).
 * @param {Object} options Options for customizing project setup (including Docker config, Nest options, etc.).
 */
async function featureFinalization(targetDirectory, packageManager, options) {
	await tasks([
		{
			title: "Adding features",
			task: async () => {
				// Generate the Docker Compose file if Docker configuration is provided.
				await dockerComposeGenerator(
					targetDirectory,
					options.dockerComposeConfig
				);

				// Copy required files into the project based on the options provided (e.g., filters, pipes, interceptors).
				await filesManager(targetDirectory, packageManager, options, true);
			},
		},
	]);
}
