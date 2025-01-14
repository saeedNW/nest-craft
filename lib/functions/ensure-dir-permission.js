import {
	canModifyDirectory,
	existsDirectory,
	isEmptyDirectory,
} from "../shell/shell.commands.js";

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
export async function ensureDirectoryPermissions(
	targetDirectory,
	parentDirectory
) {
	// Ensure the parent directory is writable.
	await canModifyDirectory(parentDirectory);

	// If the target directory already exists, ensure it is empty.
	if (await existsDirectory(targetDirectory)) {
		await isEmptyDirectory(targetDirectory);
	}
}
