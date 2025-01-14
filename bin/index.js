#!/usr/bin/env node

import { intro, outro, tasks } from "@clack/prompts";
import chalk from "chalk";
import figlet from "figlet";
import path from "path";
import { textPrompt } from "../lib/prompts/text.prompt.js";
import { cancelPrompt } from "../lib/prompts/cancel.prompt.js";
import { selectPrompt } from "../lib/prompts/select.prompt.js";
import { errorHandler } from "../lib/functions/error-handler.function.js";
import { convertToAbsolutePath } from "../lib/functions/convert-path.function.js";
import {
	existsDirectory,
	canModifyDirectory,
	createDirectory,
	getCurrentDirectory,
	isEmptyDirectory,
	createProject,
	makeMainDirectories,
	manageAppModule,
} from "../lib/shell/shell.commands.js";
import { selectDockerServices } from "../lib/docker/service-selector.js";
import { dockerComposeGenerator } from "../lib/docker/config-generator.js";
import { filesManager } from "../lib/files/files.manager.js";
import { modifyMainTsFile } from "../lib/files/main-file.modifier.js";
import { updateJestConfig } from "../lib/files/package-json.modifier.js";
import { commandManager } from "./argv-manager.js";

/**
 * Main entry point for the Nest Craft CLI.
 * Orchestrates the process of creating a custom NestJS project by collecting user input,
 * setting up the project directory, and initializing the desired configurations.
 */
async function main() {
	// Verify the script is not executed with superuser privileges.
	verifyNonSudo();

	// Tool's Argv commands and process manager
	commandManager();

	// Display the CLI banner and introduction message.
	displayBanner();

	// Initialize a variable to store the newly created directory for error handling.
	let newDirectory;

	// Prompt the user to input a project name.
	const projectNameInput = await textPrompt(
		"What do you want to call your project?",
		true
	);
	// Handle cancellation during the prompt.
	cancelPrompt(projectNameInput);

	// Resolve the project paths based on the user input.
	const { projectName, targetDirectory, parentDirectory } =
		await resolveProjectPaths(projectNameInput);

	try {
		// Ensure the target and parent directories have the necessary writing permissions.
		await ensureDirectoryPermissions(targetDirectory, parentDirectory);

		// Prompt the user to decide if they want to initialize a Git repository.
		const gitStatus = await promptGitRepo();
		cancelPrompt(gitStatus); // Handle cancellation during the prompt.

		// Prompt the user to select a package manager.
		const packageManager = await promptPackageManager();
		cancelPrompt(packageManager); // Handle cancellation during the prompt.

		// Collect additional project configuration options from the user.
		const options = await collectOptions();

		// Create the parent directory for the project.
		newDirectory = await createParentDirectory(parentDirectory);

		// Initialize the project by creating files, configuring settings, and applying options.
		await initializeProject(
			parentDirectory, // The parent directory of the project.
			projectName, // The name of the project.
			gitStatus, // Git repository initialization status.
			packageManager, // Selected package manager.
			options, // Additional user-selected options.
			targetDirectory // Target directory for the project.
		);

		// Display a success message upon completing the project setup.
		outro(chalk.green("Thanks for using Nest Craft! Your project is ready."));
	} catch (error) {
		// Handle errors by passing the error message and removing the new directory.
		await errorHandler(error, newDirectory, targetDirectory);
	}
}

/**
 * Verifies that the script is not being executed with superuser privileges.
 * If the script is run as a superuser, it logs an error message and exits the process.
 */
function verifyNonSudo() {
	// Check if the `getuid` function exists and the current user ID is 0 (root).
	if (process.getuid && process.getuid() === 0) {
		// Log an error message indicating that running as a superuser is not recommended.
		console.error(
			chalk.red(
				"You are trying to start Nest Craft as a super user, which isn't recommended."
			)
		);
		// Exit the process with a status code of 1 to indicate an error.
		process.exit(1);
	}
}

/**
 * Displays the CLI banner and an introductory message.
 * Uses ASCII art and colored text to enhance the user experience.
 */
function displayBanner() {
	// Render the "Nest Craft" ASCII art using Figlet and color it green.
	console.log(chalk.green(figlet.textSync("Nest Craft")));

	// Display an introductory message below the banner in cyan.
	intro(chalk.cyan("Welcome to the new way of creating NestJS projects"));
}

/**
 * Resolves project paths based on the provided project name or path input.
 * Determines the project name, target directory, and parent directory.
 *
 * @param {string} projectNameInput - The user-provided project name or path input.
 * @returns {Promise<{ projectName: string, targetDirectory: string, parentDirectory: string }>}
 * An object containing the resolved project name, target directory, and parent directory.
 */
async function resolveProjectPaths(projectNameInput) {
	// Convert the user input into an absolute path.
	let projectName = convertToAbsolutePath(projectNameInput);
	let targetDirectory; // Full path to the project's target directory.
	let parentDirectory; // Full path to the parent directory.

	// If the input includes a directory separator, assume it's a full path.
	if (projectName.includes(path.sep)) {
		// Use the input as the target directory.
		targetDirectory = projectName;
		// Derive the parent directory from the target directory.
		parentDirectory = path.dirname(targetDirectory);
		// Extract the project name from the target directory path.
		projectName = path.basename(targetDirectory);
	} else {
		// If no directory separator is present, treat it as a simple project name.
		// Get the current working directory to use as the parent directory.
		parentDirectory = await getCurrentDirectory();
		// Combine the parent directory with the project name to form the target directory.
		targetDirectory = path.join(parentDirectory, projectName);
	}

	// Return the resolved paths as an object.
	return { projectName, targetDirectory, parentDirectory };
}

/**
 * Ensures the target directory has appropriate permissions and is ready for use.
 *
 * - Verifies if the parent directory is writable.
 * - Checks if the target directory exists and ensures it is empty if it does.
 *
 * @param {string} targetDirectory - The full path of the target directory for the project.
 * @param {string} parentDirectory - The full path of the parent directory.
 * @returns {Promise<void>} Resolves when all checks and validations pass.
 */
async function ensureDirectoryPermissions(targetDirectory, parentDirectory) {
	// Ensure the parent directory is writable.
	await canModifyDirectory(parentDirectory);

	// If the target directory already exists, ensure it is empty.
	if (await existsDirectory(targetDirectory)) {
		await isEmptyDirectory(targetDirectory);
	}
}

/**
 * Prompts the user to decide whether to initialize a Git repository.
 *
 * Provides two options:
 * - Initialize a Git repository (default).
 * - Skip Git initialization.
 *
 * @returns {Promise<string>} A string representing the selected option:
 * - An empty string for initializing a Git repository.
 * - "--skip-git" to skip Git initialization.
 */
async function promptGitRepo() {
	return await selectPrompt("Do you need a Git Repo?", [
		{ value: "", label: "Initialize a Git Repo (Default)" },
		{ value: "--skip-git", label: "Don't initialize a Git Repo" },
	]);
}

/**
 * Prompts the user to select a package manager for the project.
 *
 * Provides the following options:
 * - npm
 * - yarn
 * - pnpm
 *
 * @returns {Promise<string>} A string representing the selected package manager:
 */
async function promptPackageManager() {
	return await selectPrompt("Which package manager should be used?", [
		{ value: "npm", label: "npm" },
		{ value: "yarn", label: "yarn" },
		{ value: "pnpm", label: "pnpm" },
	]);
}

/**
 * Collects various configuration options for the project.
 *
 * This function prompts the user to select or input various options such as:
 * - Docker service configuration
 * - Custom exception filter, pipe, and interceptor
 * - Swagger configuration
 * - User definition for `request.user`
 * - Pagination utility
 * - Multer file uploader
 * - Additional NestJS options
 *
 * @returns {Promise<Object>} An object containing the selected options:
 * - dockerComposeConfig: The selected Docker services configuration.
 * - customFilter: Boolean indicating if a custom exception filter is needed.
 * - customPipe: Boolean indicating if a custom pipe is needed.
 * - customInterceptor: Boolean indicating if a custom response interceptor is needed.
 * - swaggerConfig: Boolean indicating if Swagger config is needed.
 * - userDefinition: Boolean indicating if a user definition for `request.user` is needed.
 * - paginationType: The selected pagination utility type (if any).
 * - multer: Boolean indicating if Multer file uploader is needed.
 * - nestOptions: Sanitized additional NestJS options.
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

	// Prompt the user to decide whether they need a user definition for `request.user`.
	const userDefinition = await booleanPrompt(
		"Do you need a User Definition for `request.user`?"
	);

	// Prompt the user to select a pagination utility type (TypeORM, Mongoose, or None).
	const paginationType = await promptPaginationType();

	// Prompt the user to decide whether they need Multer file uploader.
	const multer = await booleanPrompt("Do you need Multer File Uploader?");

	// Prompt the user to decide whether they want to use tabs as indentation or not
	const eslint = await booleanPrompt(
		"Do you want eslint to use tabs for indentation instead of spaces?"
	);

	// Prompt the user for any additional 'nest new' options.
	const nestOptions = await textPrompt(
		"Enter any other 'nest new' options you need.",
		false
	);
	cancelPrompt(nestOptions); // Handle cancellation during the prompt.

	return {
		dockerComposeConfig,
		customFilter,
		customPipe,
		customInterceptor,
		swaggerConfig,
		userDefinition,
		paginationType,
		multer,
		eslint,
		nestOptions: sanitizeNestOptions(nestOptions),
	};
}

/**
 * Prompts the user with a yes/no question and returns the selected boolean value.
 *
 * This function uses a selection prompt with two options:
 * - Yes (true)
 * - No (false)
 *
 * @param {string} message The message or question to display to the user.
 * @returns {Promise<boolean>} A boolean value indicating the user's choice:
 * - `true` for "Yes"
 * - `false` for "No"
 */
async function booleanPrompt(message) {
	// Display a selection prompt with Yes/No options.
	const response = await selectPrompt(message, [
		{ value: true, label: "Yes" },
		{ value: false, label: "No" },
	]);

	// Handle cancellation during the prompt.
	cancelPrompt(response);

	// Return the boolean response (true for Yes, false for No).
	return response;
}

/**
 * Prompts the user to determine if pagination is required and, if so, which ORM or ODM should be used for pagination.
 *
 * This function first asks if pagination is needed. If the user selects "Yes", it then asks which ORM or ODM should
 * be used for pagination (e.g., TypeORM, Mongoose, or None).
 *
 * @returns {Promise<string|undefined>} The selected pagination type:
 * - `typeorm` for TypeORM,
 * - `mongoose` for Mongoose,
 * - `undefined` for None (if pagination is not needed).
 */
async function promptPaginationType() {
	// Ask if the user needs a Pagination Utility.
	const paginationRequired = await booleanPrompt(
		"Do you need a Pagination Utility?"
	);

	// If pagination is not required, return undefined.
	if (!paginationRequired) return undefined;

	// Ask which ORM/ODM the user wants to use for pagination.
	const paginationType = await selectPrompt(
		"Which ORM or ODM do you need for pagination?",
		[
			{ value: "typeorm", label: "TypeORM" }, // Option for TypeORM.
			{ value: "mongoose", label: "Mongoose" }, // Option for Mongoose.
			{ value: undefined, label: "None" }, // Option for no ORM/ODM (None).
		]
	);

	// Handle cancellation during the prompt.
	cancelPrompt(paginationType);

	// Return the selected pagination type (could be 'typeorm', 'mongoose', or undefined).
	return paginationType;
}

/**
 * Sanitizes the provided NestJS options by removing specific flags.
 *
 * This function removes the following options from the input string:
 * - `--skip-git`: Option to skip Git initialization.
 * - `--package-manager <name>`: Option to specify a package manager (npm, yarn, pnpm).
 *
 * @param {string} nestOptions The raw options string to sanitize.
 * @returns {string} The sanitized options string with specific flags removed.
 */
function sanitizeNestOptions(nestOptions) {
	// If no options are provided, return an empty string.
	if (!nestOptions) return "";

	// Remove unnecessary flags from the options string (skip-git, package-manager).
	return nestOptions
		.replace("--skip-git", "") // Remove skip-git flag.
		.replace("--package-manager npm", "") // Remove npm package manager flag.
		.replace("--package-manager yarn", "") // Remove yarn package manager flag.
		.replace("--package-manager pnpm", ""); // Remove pnpm package manager flag.
}

/**
 * Creates a parent directory if it does not already exist.
 *
 * This function checks if the specified directory exists. If it exists, it returns a status of `false`.
 * If the directory does not exist, it creates the directory and returns the status as `true` along with the directory path.
 *
 * @param {string} directory The path of the directory to be created.
 * @returns {Promise<{ status: boolean, path?: string }>}
 * An object containing:
 * - `status`: A boolean indicating whether the directory was successfully created (`true` if created, `false` if already exists).
 * - `path`: The path of the created directory (only if `status` is `true`).
 */
async function createParentDirectory(directory) {
	// Check if the directory already exists.
	if (await existsDirectory(directory)) {
		// Return status false if the directory exists.
		return { status: false };
	}

	// Create the directory if it does not exist.
	await createDirectory(directory);

	// Return status true and the directory path.
	return {
		status: true,
		path: directory,
	};
}

/**
 * Initializes a new project by performing a series of setup tasks.
 *
 * This function handles the creation of the project, Docker configuration, directory setup,
 * application module management, and necessary file copying based on the provided options.
 *
 * @param {string} parentDirectory The directory where the project should be created.
 * @param {string} projectName The name of the project to be created.
 * @param {string} gitStatus The Git repository status (e.g., to initialize or skip Git).
 * @param {string} packageManager The package manager to be used (e.g., npm, yarn, pnpm).
 * @param {Object} options Options for customizing project setup (including Docker config, Nest options, etc.).
 * @param {string} targetDirectory The target directory where the project files should be created.
 * @returns {Promise<void>} A promise that resolves when all tasks are completed.
 */
async function initializeProject(
	parentDirectory,
	projectName,
	gitStatus,
	packageManager,
	options,
	targetDirectory
) {
	// Initialize the project setup tasks with a title and task function.
	await tasks([
		{
			title: "Initializing Project",
			task: async () => {
				// Create the project using the specified parent directory, project name, Git status, package manager, and additional Nest options.
				await createProject(
					parentDirectory,
					projectName,
					gitStatus,
					packageManager,
					options.nestOptions
				);

				// Generate the Docker Compose file if Docker configuration is provided.
				await dockerComposeGenerator(
					targetDirectory,
					options.dockerComposeConfig
				);

				// Create the main directories needed for the project.
				await makeMainDirectories(targetDirectory);

				// Manage the app module (e.g., adding necessary configurations).
				await manageAppModule(targetDirectory);

				// Copy required files into the project based on the options provided (e.g., filters, pipes, interceptors).
				await filesManager(targetDirectory, packageManager, options);

				// Modify `main.ts` file and add required utilities
				await modifyMainTsFile(targetDirectory, options);

				// Update jest config to make tests to accept absolute path
				await updateJestConfig(targetDirectory);
			},
		},
	]);
}

// Execute the main function
main();
