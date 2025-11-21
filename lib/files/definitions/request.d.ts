/** Declare a global module augmentation */
declare global {
  /** Extend the Express namespace */
  namespace Express {
    /** Extend the Request interface within the Express namespace */
    interface Request {
      /** Add an optional `userId` property to the Request interface */
      userId?: string;
    }
  }
}
