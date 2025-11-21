// Define a Type for multer's destination manager function's callback
export type TCallbackDestination = (error: Error | null, destination: string) => void;
// Define a Type for multer's file name manager function's callback
export type TCallbackFilename = (error: Error | null, filename: string) => void;
// Define a Type for multer destination manager function's callback
export type TCallbackValidator = (error: Error, status: null | boolean) => void;
// Define a Type for uploaded file
export type TMulterFile = Express.Multer.File;
