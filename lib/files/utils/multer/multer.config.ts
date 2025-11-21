import { Request } from 'express';
import { basename, extname, resolve } from 'path';
import { UnprocessableEntityException } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { TCallbackDestination, TCallbackFilename, TMulterFile } from './multer.types';
import { diskStorage, Options } from 'multer';

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
    // Throw error if the uploaded file was invalid
    if (!file?.originalname) {
      return cb(new UnprocessableEntityException('Invalid file data'), '');
    }

    // Define the upload path for storing files temporarily
    const uploadPath: string = resolve('./assets/.temp');

    // Ensure the directory exists, creating it if necessary
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
  // Throw error if the uploaded file was invalid
  if (!file?.originalname) {
    return cb(new UnprocessableEntityException('Invalid file data'), '');
  }

  const fileOriginalName: string = file?.originalname || '';

  // Extract the file extension and convert it to lowercase
  const ext: string = extname(fileOriginalName).toLowerCase();

  // Extract the base name of the file and replace spaces with hyphens
  const originalName: string = basename(fileOriginalName, extname(fileOriginalName)).replace(
    /\s/g,
    '-',
  );

  // Generate a unique temporary name for the uploaded file
  const fileTempName: string = String(Date.now() + originalName + ext);

  return cb(null, fileTempName);
}

/**
 * Creates a multer configuration object for handling file uploads. *
 * @returns {Options} - A multer configuration object.
 */
export function multerFileUploader(): Options {
  return {
    // Config storage option
    storage: diskStorage({
      destination: multerDestination(),
      filename: multerFilename,
    }),
  };
}
