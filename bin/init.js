import { outro, tasks } from '@clack/prompts';
import chalk from 'chalk';
import { dockerComposeGenerator } from '../lib/docker/config-generator.js';
import { selectDockerServices } from '../lib/docker/service-selector.js';
import { filesManager } from '../lib/files/files.manager.js';
import { modifyMainTsFile } from '../lib/files/main-file.modifier.js';
import { updateJestConfig } from '../lib/files/package-json.modifier.js';
import { ensureDirectoryPermissions } from '../lib/functions/ensure-dir-permission.js';
import { errorHandler } from '../lib/functions/error-handler.js';
import { displayBanner } from '../lib/functions/main-banner.js';
import { createParentDirectory } from '../lib/functions/parent-dir-manager.js';
import { resolveProjectPaths } from '../lib/functions/resolve-project-path.js';
import { booleanPrompt } from '../lib/prompts/boolean.prompt.js';
import { cancelPrompt } from '../lib/prompts/cancel.prompt.js';
import { promptPackageManager } from '../lib/prompts/package-manager.prompt.js';
import { promptPaginationType } from '../lib/prompts/pagination.prompt.js';
import { selectPrompt } from '../lib/prompts/select.prompt.js';
import { textPrompt } from '../lib/prompts/text.prompt.js';
import {
  createProject,
  makeMainDirectories,
  manageAppModule,
  runPrettier,
} from '../lib/shell/shell.commands.js';
import { promptGlobalPrefix } from '../lib/prompts/global-prefix.prompt.js';

export async function initialization() {
  // Display the CLI banner and introduction message.
  displayBanner('Welcome to the new way of creating NestJS projects');

  // Initialize a variable to store the newly created directory for error handling.
  let newDirectory;

  // Prompt the user to input a project name.
  const projectNameInput = await textPrompt('What do you want to call your project?', true);
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
      targetDirectory, // Target directory for the project.
    );

    // Display a success message upon completing the project setup.
    outro(chalk.green('Thanks for using Nest Craft! Your project is ready.'));
  } catch (error) {
    // Handle errors by passing the error message and removing the new directory.
    await errorHandler(error, newDirectory, targetDirectory);
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
  return await selectPrompt('Do you need a Git Repo?', [
    { value: '', label: 'Initialize a Git Repo (Default)' },
    { value: '--skip-git', label: "Don't initialize a Git Repo" },
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
 * - Prettier tab indentation
 * - API prefix setup
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
 * - prettier: Boolean indicating if prettier should use tab indentation.
 * - prefix: Boolean and text indicating if user want to use API prefix in their app.
 * - nestOptions: Sanitized additional NestJS options.
 */
async function collectOptions() {
  // Prompt the user to select Docker services configuration.
  const dockerComposeConfig = await selectDockerServices();

  // Prompt the user to decide whether they need a custom exception filter.
  const customFilter = await booleanPrompt('Do you need a Custom Exception Filter?');

  // Prompt the user to decide whether they need a custom unprocessable entity pipe.
  const customPipe = await booleanPrompt('Do you need a Custom Unprocessable Entity Pipe?');

  // Prompt the user to decide whether they need a custom response interceptor.
  const customInterceptor = await booleanPrompt('Do you need a Custom Response Interceptor?');

  // Prompt the user to decide whether they need Swagger configuration.
  const swaggerConfig = await booleanPrompt('Do you need Swagger config?');

  // Prompt the user to decide whether they need a user definition for `request.user`.
  const userDefinition = await booleanPrompt('Do you need a User Definition for `request.user`?');

  // Prompt the user to select a pagination utility type (TypeORM, Mongoose, or None).
  const paginationType = await promptPaginationType();

  // Prompt the user to decide whether they need Multer file uploader.
  const multer = await booleanPrompt('Do you need Multer File Uploader?');

  // Prompt the user to decide whether they want to use tabs as indentation or not
  const prettier = await booleanPrompt(
    'Do you want prettier to use tabs for indentation instead of spaces?',
  );

  // Prompt the user to decide whether they want to use API prefix or not
  const prefix = await promptGlobalPrefix();

  // Prompt the user for any additional 'nest new' options.
  const nestOptions = await textPrompt("Enter any other 'nest new' options you need.", false);
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
    prettier,
    prefix,
    nestOptions: sanitizeNestOptions(nestOptions),
  };
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
  if (!nestOptions) return '';

  // Remove unnecessary flags from the options string (skip-git, package-manager).
  return nestOptions
    .replace('--skip-git', '') // Remove skip-git flag.
    .replace('--package-manager npm', '') // Remove npm package manager flag.
    .replace('--package-manager yarn', '') // Remove yarn package manager flag.
    .replace('--package-manager pnpm', ''); // Remove pnpm package manager flag.
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
  targetDirectory,
) {
  // Initialize the project setup tasks with a title and task function.
  await tasks([
    {
      title: 'Initializing Project',
      task: async () => {
        // Create the project using the specified parent directory, project name, Git status, package manager, and additional Nest options.
        await createProject(
          parentDirectory,
          projectName,
          gitStatus,
          packageManager,
          options.nestOptions,
        );

        // Generate the Docker Compose file if Docker configuration is provided.
        await dockerComposeGenerator(targetDirectory, options.dockerComposeConfig);

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

        // Reformat project files by the new prettier config
        await runPrettier(targetDirectory);
      },
    },
  ]);
}
