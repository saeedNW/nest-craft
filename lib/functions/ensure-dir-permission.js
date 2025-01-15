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
 * @param {boolean} [addingFeature=false] - Whether the process involves adding a feature to an existing directory.
 * @returns {Promise<void>} Resolves when all checks and validations pass.
 */
export async function ensureDirectoryPermissions(
	targetDirectory,
	parentDirectory,
	addingFeature = false
) {
	// Ensure the parent directory is writable.
	await canModifyDirectory(parentDirectory);

	// Check the target directory status.
	const directoryExists = await existsDirectory(targetDirectory);

	if (directoryExists && !addingFeature) {
		// Ensure the target directory is empty if it exists and addingFeature is false.
		await isEmptyDirectory(targetDirectory);
	}
}
