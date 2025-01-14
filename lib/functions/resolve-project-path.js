import path from "path";
import { convertToAbsolutePath } from "./convert-path.js";
import { getCurrentDirectory } from "../shell/shell.commands.js";

/**
 * Resolves project paths based on the provided project name or path input.
 * Determines the project name, target directory, and parent directory.
 *
 * @param {string} projectNameInput - The user-provided project name or path input.
 * @returns {Promise<{ projectName: string, targetDirectory: string, parentDirectory: string }>}
 * An object containing the resolved project name, target directory, and parent directory.
 */
export async function resolveProjectPaths(projectNameInput) {
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
