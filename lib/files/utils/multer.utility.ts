import { Request } from 'express';
import { basename, extname, resolve } from 'path';
import { UnprocessableEntityException } from '@nestjs/common';
import { diskStorage, Options } from 'multer';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { rename } from 'fs/promises';

/** Define a Type for multer's destination manager function's callback */
export type TCallbackDestination = (error: Error, destination: string) => void;
/** Define a Type for multer's file name manager function's callback */
export type TCallbackFilename = (error: Error, filename: string) => void;
/** Define a Type for multer destination manager function's callback */
export type TCallbackValidator = (error: Error, status: null | boolean) => void;
/** Define a Type for uploaded file */
export type TMulterFile = Express.Multer.File;

/**
 * A function which will create and manage multer's uploaded
 * file temporary destination
 * @returns Return a callback used by multer for setting the destination
 */
function multerDestination() {
  /**
   * @param {Request} req - The incoming HTTP request object
   * @param {TMulterFile} file - The file metadata provided by multer
   * @param {TCallbackDestination} cb - The callback function to pass the result to multer
   */
  return function (req: Request, file: TMulterFile, cb: TCallbackDestination): void {
    /** Throw error if the uploaded file was invalid */
    if (!file?.originalname) {
      return cb(new UnprocessableEntityException('invalid file data'), null);
    }

    /** Define the upload path for storing files temporarily */
    const uploadPath: string = resolve('./public/uploads/temp');

    /** Ensure the directory exists, creating it if necessary */
    mkdirSync(uploadPath, { recursive: true });

    return cb(null, uploadPath);
  };
}

/**
 * Generates a unique filename for uploaded files
 * @param {Request} req - The incoming HTTP request object
 * @param {TMulterFile} file - The file metadata provided by multer
 * @param {TCallbackFilename} cb - The callback function to pass the generated filename to multer.
 */
function multerFilename(req: Request, file: TMulterFile, cb: TCallbackFilename): void {
  /** Throw error if the uploaded file was invalid */
  if (!file?.originalname) {
    return cb(new UnprocessableEntityException('invalid file data'), null);
  }

  /** Extract the file extension and convert it to lowercase */
  const ext: string = extname(file?.originalname || '').toLowerCase();

  /** Extract the base name of the file and replace spaces with hyphens */
  const originalName: string = basename(
    file?.originalname || '',
    extname(file?.originalname || ''),
  ).replace(/\s/g, '-');

  /** Generate a unique temporary name for the uploaded file */
  const fileTempName: string = String(Date.now() + originalName + ext);

  return cb(null, fileTempName);
}

/**
 * Removes uploaded files from the file system. Handles both single and multiple file scenarios.
 * @param {TMulterFile} files - The file or files metadata provided by multer.
 * @param {boolean} multiFile - A flag indicating whether the input contains multiple files (default: `false`).
 * @returns {boolean} - Returns `true` after successfully removing the files.
 */
export function removeUploadedFiles(files: TMulterFile, multiFile: boolean = false): boolean {
  if (multiFile) {
    /**  Loop through each file object and remove it if it exists */
    for (const file of Object.values(files)) {
      if (existsSync(file[0]?.path)) {
        /** Remove the file */
        unlinkSync(file[0].path);
      }
    }
  } else {
    /** Remove a single file if it exists */
    if (existsSync(files?.path)) {
      unlinkSync(files.path);
    }
  }

  return true;
}

/**
 * Finalizes the upload process by moving the uploaded file to its final directory. *
 * @param {TMulterFile} file - The file metadata provided by multer.
 * @param {number | undefined} userId - The ID of the user associated with the upload (optional).
 * @param {string} finalPath - The target directory (relative to the base upload directory).
 * @returns {Promise<string>} - The relative path to the finalized file .
 */
export async function uploadFinalization(file: TMulterFile, finalPath: string): Promise<string> {
  let filePath: string;

  /** Determine the final file path */
  if (finalPath[0] === '/') {
    filePath = `./public/uploads${finalPath}`;
  } else {
    filePath = `./public/uploads/${finalPath}`;
  }

  /** Ensure the target directory exists, creating it recursively if necessary */
  mkdirSync(filePath, { recursive: true });

  /** Extract the file extension and convert it to lowercase */
  const ext: string = extname(file?.originalname || '').toLowerCase();

  /** Extract the base name of the file and replace spaces with hyphens */
  const originalName: string = basename(
    file?.originalname || '',
    extname(file?.originalname || ''),
  ).replace(/\s/g, '-');

  /** Generate a unique file name for the uploaded file */
  const fileName = String(Date.now() + '-' + originalName + ext);

  /** Move the file to the final directory with the new name */
  await rename(file.path, `${filePath}/${fileName}`);

  return `${filePath}/${fileName}`.slice(8);
}

/**
 * Creates a multer configuration object for handling image uploads. *
 * @returns {Options} - A multer configuration object.
 */
export function multerImageUploader(): Options {
  return {
    /** Config storage option */
    storage: diskStorage({
      destination: multerDestination(),
      filename: multerFilename,
    }),
  };
}
