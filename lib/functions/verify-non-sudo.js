/**
 * Verifies that the script is not being executed with superuser privileges.
 * If the script is run as a superuser, it logs an error message and exits the process.
 */
export function verifyNonSudo() {
	// Check if the `getuid` function exists and the current user ID is 0 (root).
	if (process.getuid && process.getuid() === 0) {
		// Log an error message indicating that running as a superuser is not recommended.
		console.error(
			chalk.red(
				"You are trying to start Nest Craft as a super user, which isn't recommended."
			)
		);
		// Exit the process with a status code of 1 to indicate an error.
		process.exit(1);
	}
}
