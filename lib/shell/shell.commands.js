import { execa } from "execa";

/**
 * Checks if a directory exists.
 * @param {string} directory - The path to the directory to check.
 * @returns {Promise<boolean>} `true` if the directory exists, otherwise `false`.
 */
export async function existsDirectory(directory) {
	// Execute the shell command to check if the directory exists.
	const command = `test -d ${directory} && echo true || echo false`; // Safeguard against spaces or special characters.
	const { stdout } = await execa(command, { shell: true });

	// Return the parsed result as a boolean.
	return stdout.trim() === "true";
}

/**
 * Retrieves the current working directory.
 * @returns {Promise<string>} The current directory path with spaces escaped.
 */
export async function getCurrentDirectory() {
	// Use `pwd` command to get the current working directory.
	const { stdout: currentPath } = await execa("pwd", { shell: true });

	// Safeguard against spaces or special characters.
	return currentPath.replaceAll(" ", "\\ ");
}

/**
 * Checks if the specified directory or its closest ancestor is writable.
 * @param {string} directory - The directory path to check.
 * @returns {Promise<boolean>} `true` if the directory is writable, otherwise throws an error.
 */
export async function canModifyDirectory(directory) {
	const command = `
		dir="${directory}"
		while [ ! -d "$dir" ]; do
			dir=$(dirname "$dir")
			if [ "$dir" = "/" ]; then
				echo "false"
			fi
		done

		if [ -w "$dir" ]; then
			echo "true"
		else
			echo "false"
		fi
    `;

	const { stdout } = await execa(command, { shell: true });

	// Parse and return the result, or throw an error if access is denied.
	if (stdout.trim() !== "true") {
		throw {
			code: "EACCES",
			message: "Access denied",
		};
	}

	return true; // Writable directory found.
}

/**
 * Creates a directory if it does not exist.
 * @param {string} directory - The path of the directory to create.
 * @returns {Promise<boolean>} Returns `true` if the directory is created successfully.
 */
export async function createDirectory(directory) {
	// Create the directory using `mkdir -p` to avoid errors if the directory already exists.
	const command = `mkdir -p ${directory}`;
	await execa(command, { shell: true });

	return true; // Return true if the directory is successfully created.
}

/**
 * Removes the specified directory and its contents.
 * @param {string} directory - The path of the directory to remove.
 * @returns {Promise<boolean>} Returns `true` if the directory is removed successfully.
 */
export async function removeDirectory(directory) {
	// Check if the directory exists before attempting removal.
	const directoryExists = await existsDirectory(directory);
	// exit early if directory does not exist.
	if (!directoryExists) return;

	// Remove the directory and its contents using `rm -rf`.
	const command = `rm -rf ${directory}`;
	await execa(command, { shell: true });

	return true; // Return true if the directory is removed successfully.
}

/**
 * Removes the specified file.
 * @param {string} filePath - The path of the file to remove.
 * @returns {Promise<boolean>} Returns `true` if the file is removed successfully.
 */
export async function removeFile(filePath) {
	// Remove the file and its contents using `rm -rf`.
	const command = `rm -rf ${filePath}`;
	await execa(command, { shell: true });

	return true; // Return true if the file is removed successfully.
}

/**
 * Checks if a directory is empty.
 * @param {string} directory - The path of the directory to check.
 * @returns {Promise<boolean>} `true` if the directory is empty, `false` otherwise.
 */
export async function isEmptyDirectory(directory) {
	// Use `find` to check if the directory is empty.
	const command = `find ${directory} -mindepth 1 -print -quit | grep -q . && echo false || echo true`;
	const { stdout } = await execa(command, { shell: true });

	// throw error if directory is not empty
	if (stdout.trim() !== "true") {
		throw {
			code: "INVALID",
			message: "Directory is not empty",
		};
	}

	return true;
}

/**
 * Creates a new NestJS project in the specified directory with the given configuration.
 * @param {string} directory - The directory where the project will be created.
 * @param {string} projectName - The name of the new NestJS project.
 * @param {string} [gitStatus=""] - Optional flag to NOT initialize a Git repository (`--skip-git`).
 * @param {string} packageManager - The package manager to use (`npm`, `yarn` or `pnpm`).
 * @param {string} [additionalOptions] - Optional additional command-line flags for customizing the project creation.
 * @returns {Promise<boolean>} - Returns `true` if the project is successfully created.
 */
export async function createProject(
	directory,
	projectName,
	gitStatus = "",
	packageManager,
	additionalOptions = ""
) {
	// Construct the command to create the project using Nest CLI.
	const nestCreationCommand = `cd ${directory} && nest new ${projectName} ${gitStatus} --package-manager ${packageManager} ${additionalOptions}`;

	// Execute the command using execa to create the project.
	await execa(nestCreationCommand, { shell: true });

	// Construct the command to Install general packages using NPM cli
	const generalPackagesInstallationCommand = `cd ${directory}/${projectName} && ${packageManager} ${
		packageManager === "yarn" ? "add" : "install"
	} @nestjs/swagger swagger-ui-express class-validator class-transformer`;

	// Execute the command using execa to install packages.
	await execa(generalPackagesInstallationCommand, { shell: true });

	// Return true to indicate the project has been created successfully.
	return true;
}

/**
 * Moves a file from one location to another.
 * @param {string} filePath - The path of the file to move.
 * @param {string} destination - The destination directory or file path.
 * @returns {Promise<boolean>} - Resolves to `true` if the operation is successful.
 */
export async function moveFile(filePath, destination) {
	// Move the file using execa
	await execa("mv", [filePath, destination], { shell: true });
	return true;
}

/**
 * copy a file from one location to another.
 * @param {string} filePath - The path of the file to be copy.
 * @param {string} destination - The destination directory or file path.
 * @returns {Promise<boolean>} - Resolves to `true` if the operation is successful.
 */
export async function copyFile(filePath, destination) {
	// copy the file using execa
	await execa("cp", [filePath, destination], { shell: true });
	return true;
}

/**
 * copy a directory from one location to another.
 * @param {string} directoryPath - The path of the directory to be copy.
 * @param {string} destination - The destination directory or directory path.
 * @returns {Promise<boolean>} - Resolves to `true` if the operation is successful.
 */
export async function copyDirectory(directoryPath, destination) {
	// copy the directory using execa
	await execa("cp -r", [directoryPath, destination], { shell: true });
	return true;
}

/**
 * Creates the main directories for a project structure.
 * @param {string} targetDirectory - The root directory where the directories will be created.
 * @returns {Promise<boolean>}
 */
export async function makeMainDirectories(targetDirectory) {
	const mainDirectories = [
		`${targetDirectory}/src/common`,
		`${targetDirectory}/src/configs`,
		`${targetDirectory}/src/modules`,
	];

	for (const directory of mainDirectories) {
		await execa("mkdir -p", [directory], { shell: true });
	}

	return true;
}

/**
 * Manages the app module by creating a directory and moving app files.
 * @param {string} targetDirectory - The root directory of the project.
 * @returns {Promise<boolean>}
 */
export async function manageAppModule(targetDirectory) {
	const appModuleDirectory = `${targetDirectory}/src/modules/app`;

	// Create the app module directory
	await execa("mkdir -p", [appModuleDirectory], { shell: true });

	// Find and move app files to the app module directory
	await execa("mv", [`${targetDirectory}/src/app.*`, appModuleDirectory], {
		shell: true,
	});

	return true;
}

/**
 * Installs packages in the specified directory using npm.
 * @param {string} directory - The directory where packages should be installed.
 * @param {string} packageManager The package manager to be used (e.g., npm, yarn, pnpm).
 * @param {string[]} packages - The list of regular dependencies to install.
 * @param {string[]} devPackages - The list of development dependencies to install.
 * @returns {Promise<void>}
 */
export async function packageInstallation(
	directory,
	packageManager,
	packages = [],
	devPackages = []
) {
	// Install regular packages
	if (Array.isArray(packages) && packages.length > 0) {
		await execa(
			packageManager,
			[packageManager === "yarn" ? "add" : "install", ...packages],
			{
				cwd: directory.replaceAll("\\", ""), // Ensure correct file path formatting across OS
			}
		);
	}

	// Install development packages
	if (Array.isArray(devPackages) && devPackages.length > 0) {
		await execa(
			packageManager,
			[
				packageManager === "yarn" ? "add" : "install",
				...devPackages,
				packageManager === "yarn" ? "--dev" : "-D",
			],
			{
				cwd: directory.replaceAll("\\", ""), // Ensure correct file path formatting across OS
			}
		);
	}

	return true;
}
