import { cancel } from "@clack/prompts";
import { removeDirectory } from "../shell/shell.commands.js";

/**
 * Gracefully handles errors by displaying a message, attempting to clean up
 * any specified directories, and exiting the process.
 *
 * @param {Error} error - The error object containing the message and details.
 * @param {Object} [parentDirectory] - Optional metadata of the parent directory.
 * @param {boolean} [parentDirectory.status] - Indicates whether cleanup is required.
 * @param {string} [parentDirectory.path] - The path of the parent directory to remove.
 * @param {string} [projectDirectory] - The path of the project directory to remove.
 */
export async function errorHandler(error, parentDirectory, projectDirectory) {
	// Display the error message to the user.
	cancel(`Operation Error: ${error?.message || "Unknown error occurred"}`);

	// Attempt to remove the project directory.
	if (projectDirectory) {
		try {
			await removeDirectory(projectDirectory);
		} catch (cleanupError) {
			// Log an error if directory removal fails.
			console.error(
				`Failed to remove project directory: ${projectDirectory.path}`,
				cleanupError
			);
		}
	}

	// Attempt to remove the parent directory if cleanup is needed.
	if (parentDirectory?.status && parentDirectory?.path) {
		try {
			await removeDirectory(parentDirectory.path);
		} catch (cleanupError) {
			// Log an error if directory removal fails.
			console.error(
				`Failed to remove parent directory: ${parentDirectory.path}`,
				cleanupError
			);
		}
	}

	// Exit the process with a non-zero status to indicate an error occurred.
	process.exit(1);
}
