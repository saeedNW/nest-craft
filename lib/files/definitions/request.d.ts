
/** Declare a global module augmentation */
declare global {
	/** Extend the Express namespace */
	namespace Express {
		/** Extend the Request interface within the Express namespace */
		interface Request {
			/** Add an optional `user` property to the Request interface */
			user?: {}; // Replace with the user database document
		}
	}
}
