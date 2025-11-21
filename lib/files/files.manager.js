import { log } from '@clack/prompts';
import fs from 'fs/promises';
import path from 'path';
import { mainProjectPath } from '../functions/main-project-path.js';
import {
  copyDirectory,
  copyFile,
  createDirectory,
  packageInstallation,
  removeFile,
} from '../shell/shell.commands.js';

/**
 * Manages the setup of files and configurations for the project.
 * @async
 * @function filesManager
 * @param {string} projectPath - The absolute path to the target project directory.
 * @param {string} packageManager The package manager to be used (e.g., npm, yarn, pnpm).
 * @param {Object} options - Configuration options for managing files and directories.
 * @param {boolean} options.customFilter - Whether to include custom filter files.
 * @param {boolean} options.customPipe - Whether to include custom pipe files.
 * @param {boolean} options.customInterceptor - Whether to include custom interceptor files.
 * @param {boolean} options.userDefinition - Whether to include user definition files.
 * @param {boolean} options.swaggerConfig - Whether to include the Swagger configuration file.
 * @param {string} [options.paginationType] - The type of pagination utility to include.
 * @param {boolean} options.multer - Whether to include Multer utility files and install its dependencies.
 * @param {boolean} options.prettier - Whether to Update prettier to use tabs ot not.
 * @param {boolean} [addingFeature=false] - Whether the process involves adding a feature to an existing directory.
 * @returns {Promise<void>} Resolves when all file management tasks are completed.
 */
export async function filesManager(projectPath, packageManager, options, addingFeature = false) {
  const basePath = mainProjectPath(import.meta.url);
  const commonDirectory = path.join(projectPath, 'src/common');
  const configDirectory = path.join(projectPath, 'src/configs');

  /** Create common and config directories if don't exists */
  await createDirectory(commonDirectory);
  await createDirectory(configDirectory);

  // Replace default eslint file with a custom one
  await handleEsLint(projectPath, basePath);

  // Replace default prettier file with a more detailed and option one
  await handlePrettier(projectPath, basePath, options.prettier);

  // Replace default jest-e2e.json` with a custom one
  await handleJestE2EConfig(projectPath, basePath, packageManager, addingFeature);

  // Utility to handle optional file/directory copying
  const handleCopy = async (condition, source, destination, isFile = false) => {
    if (isFile) {
      if (condition) await copyFile(source, destination);
    }

    if (condition) await copyDirectory(source, destination);
  };

  // Process filters, interceptors definitions
  await handleCopy(options.customFilter, path.join(basePath, 'filters/'), commonDirectory);
  await handleCopy(options.customInterceptor, path.join(basePath, 'interceptor/'), commonDirectory);

  // Process env definition
  await createDirectory(path.join(commonDirectory, 'definitions'));
  await copyFile(
    path.join(basePath, 'definitions/env.d.ts'),
    path.join(commonDirectory, 'definitions/env.d.ts'),
  );

  // Process user definition
  await handleCopy(
    options.userDefinition,
    path.join(basePath, 'definitions/request.d.ts'),
    path.join(commonDirectory, 'definitions/request.d.ts'),
    true,
  );

  // Copy Swagger configuration file
  if (options.swaggerConfig) {
    await packageInstallation(projectPath, packageManager, [
      '@nestjs/swagger',
      'swagger-ui-express',
    ]);

    await copyFile(path.join(basePath, 'configs/swagger.config.ts'), configDirectory);

    // Copy assets directory to project root
    await copyDirectory(path.join(basePath, 'assets/'), projectPath);
  }

  // Handle pagination utilities
  await handlePagination(
    options.paginationType,
    basePath,
    commonDirectory,
    projectPath,
    packageManager,
  );

  // Handle Multer utility
  if (options.multer) {
    await packageInstallation(projectPath, packageManager, ['multer'], ['@types/multer']);
    await copyDirectory(path.join(basePath, 'utils/multer/'), path.join(commonDirectory, 'utils/'));
  }
}

/**
 * Handles the setup of pagination utilities based on the specified type.
 * @async
 * @function handlePagination
 * @param {string} paginationType - The type of pagination utility to include. Supported values: "typeorm", "mongoose".
 * @param {string} basePath - The base path of the source project files.
 * @param {string} commonDirectory - The path to the "common" directory in the target project.
 * @param {string} projectPath - The absolute path to the target project directory.
 * @param {string} packageManager The package manager to be used (e.g., npm, yarn, pnpm).
 * @returns {Promise<void>} Resolves when the pagination setup is completed.
 */
async function handlePagination(
  paginationType,
  basePath,
  commonDirectory,
  projectPath,
  packageManager,
) {
  if (!paginationType) return;

  const paginationDirectory = path.join(commonDirectory, 'utils/pagination/');
  await createDirectory(paginationDirectory);

  switch (paginationType) {
    case 'typeorm':
      await packageInstallation(projectPath, packageManager, ['@nestjs/typeorm', 'typeorm']);
      await copyFile(
        path.join(basePath, 'utils/pagination/pagination.dto.ts'),
        path.join(paginationDirectory, 'pagination.dto.ts'),
      );
      await copyFile(
        path.join(basePath, 'utils/pagination/pagination.interface.ts'),
        path.join(paginationDirectory, 'pagination.interface.ts'),
      );
      await copyFile(
        path.join(basePath, 'utils/pagination/typeorm.pagination.utility.ts'),
        path.join(paginationDirectory, 'typeorm.pagination.utility.ts'),
      );
      break;

    case 'mongoose':
      await packageInstallation(
        projectPath,
        packageManager,
        ['@nestjs/mongoose', 'mongoose'],
        ['@types/mongoose'],
      );
      await copyFile(
        path.join(basePath, 'utils/pagination/pagination.dto.ts'),
        path.join(paginationDirectory, 'pagination.dto.ts'),
      );
      await copyFile(
        path.join(basePath, 'utils/pagination/pagination.interface.ts'),
        path.join(paginationDirectory, 'pagination.interface.ts'),
      );
      await copyFile(
        path.join(basePath, 'utils/pagination/mongoose.pagination.utility.ts'),
        path.join(paginationDirectory, 'mongoose.pagination.utility.ts'),
      );
      break;

    default:
      log.warn(`Unsupported pagination type: ${paginationType}`);
  }
}

/**
 * Handles ESLint configuration by removing the existing `eslint.config.mjs` file
 * and copying a new configuration file from the base path to the project path.
 *
 * @param {string} projectPath - The absolute path to the target project directory.
 * @param {string} basePath - The absolute path to the base directory containing the ESLint configuration.
 * @returns {Promise<void>} - Resolves when the operation is complete.
 */
async function handleEsLint(projectPath, basePath) {
  await removeFile(path.join(projectPath, 'eslint.config.mjs'));

  await copyFile(path.join(basePath, 'configs/eslint.config.mjs'), projectPath);
}

/**
 * Handles prettier configuration by removing the existing `.prettierrc` file
 * and copying a new configuration file from the base path to the project path.
 *
 * Additionally update the final file to use tabs for indentation on user request.
 *
 * @param {string} projectPath - The absolute path to the target project directory.
 * @param {string} basePath - The absolute path to the base directory containing the prettier configuration.
 * @param {boolean} condition - Condition which will determine whether to update the prettier file or not
 * @returns {Promise<void>} - Resolves when the operation is complete.
 */
async function handlePrettier(projectPath, basePath, condition) {
  const prettierConfigPath = path.join(projectPath, '.prettierrc');
  await removeFile(prettierConfigPath);

  await copyFile(path.join(basePath, 'configs/.prettierrc'), projectPath);
  await copyFile(path.join(basePath, 'configs/.prettierignore'), projectPath);

  if (!condition) return;

  const prettierConfigContent = await fs.readFile(prettierConfigPath, 'utf-8');
  const prettierConfig = JSON.parse(prettierConfigContent);

  prettierConfig.tabWidth = 2;
  prettierConfig.useTabs = true;

  await fs.writeFile(prettierConfigPath, `${JSON.stringify(prettierConfig, null, 2)}\n`);
}

/**
 * Handles jest-e2e configuration by removing the existing `jest-e2e.json` file
 * and copying a new configuration file from the base path to the project path.
 *
 * @param {string} projectPath - The absolute path to the target project directory.
 * @param {string} basePath - The absolute path to the base directory containing the jest-e2e configuration.
 * @param {string} packageManager The package manager to be used (e.g., npm, yarn, pnpm).
 * @param {boolean} [addingFeature] - Whether the process involves adding a feature to an existing directory.
 * @returns {Promise<void>} - Resolves when the operation is complete.
 */
async function handleJestE2EConfig(projectPath, basePath, packageManager, addingFeature) {
  // Don't modify jest config if it's during adding new feature
  if (addingFeature) return;

  await removeFile(path.join(projectPath, 'test/jest-e2e.json'));

  // Install required package
  await packageInstallation(projectPath, packageManager, [], ['jest-module-name-mapper']);

  await copyFile(
    path.join(basePath, 'configs/jest-e2e.json'),
    path.join(projectPath, 'test/jest-e2e.json'),
  );
}
