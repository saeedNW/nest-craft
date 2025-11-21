import { createDirectory, existsDirectory } from '../shell/shell.commands.js';

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
export async function createParentDirectory(directory) {
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
