import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { rename } from 'fs/promises';
import { basename, extname, resolve } from 'path';
import { TMulterFile } from './multer.types';

/**
 * Removes uploaded files from the file system. Handles both single and multiple file scenarios.
 * @param {TMulterFile} files - The file or files metadata provided by multer.
 * @param {boolean} multiFile - A flag indicating whether the input contains multiple files (default: `false`).
 * @returns {boolean} - Returns `true` after successfully removing the files.
 */
export function removeUploadedFiles(files: TMulterFile, multiFile: boolean = false): boolean {
  if (multiFile) {
    // Loop through each file object and remove it if it exists
    for (const file of Object.values(files)) {
      // Save the file path
      const filePath: string = String(file[0]?.path);

      // Remove the file if it exists
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    }
  } else {
    // Remove a single file if it exists
    if (existsSync(files?.path)) {
      unlinkSync(files.path);
    }
  }

  return true;
}

/**
 * File remover
 * @param {string} filePath - File location path
 * @returns {void} - Returns nothing.
 */
export function fileRemoval(filePath: string): void {
  if (!filePath) return;

  // Convert file path to relative absolute path
  filePath = resolve('./assets' + filePath);

  // Remove a single file if it exists
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

/**
 * Finalizes the upload process by moving the uploaded file to its final directory. *
 * @param {TMulterFile} file - The file metadata provided by multer.
 * @param {string} finalPath - The target directory (relative to the base upload directory).
 * @returns {Promise<string>} - The relative path to the finalized file .
 */
export async function uploadFinalization(file: TMulterFile, finalPath: string): Promise<string> {
  let filePath: string;

  // Determine the final file path
  if (finalPath[0] === '/') {
    filePath = `./assets/uploads${finalPath}`;
  } else {
    filePath = `./assets/uploads/${finalPath}`;
  }

  // Ensure the target directory exists, creating it recursively if necessary
  mkdirSync(filePath, { recursive: true });

  // Extract the file extension and convert it to lowercase
  const ext: string = extname(file?.originalname || '').toLowerCase();

  // Extract the base name of the file and replace spaces with hyphens
  const originalName: string = basename(
    file?.originalname || '',
    extname(file?.originalname || ''),
  ).replace(/\s/g, '-');

  // Generate a unique file name for the uploaded file
  const fileName = String(Date.now() + '-' + originalName + ext);

  // Move the file to the final directory with the new name
  await rename(file.path, `${filePath}/${fileName}`);

  return `${filePath}/${fileName}`.slice(8);
}
