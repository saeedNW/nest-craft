import { displayHelp } from "./help.js";
import { initialization } from "./init.js";
import { versionManager } from "./version-manager.js";

/**
 * Manages command-line arguments and executes the corresponding functionality.
 */
export function commandManager() {
	// Retrieve the third command-line argument (e.g., "node script.js <arg>")
	const argv = process.argv[2];

	switch (argv) {
		// No argument or valid initialization commands trigger initialization
		case undefined: // No arguments passed
		case "init": // Full initialization command
		case "i": // Short form for initialization
			initialization()
			return;

		// Version flags trigger the version manager
		case "--version": // Full version flag
		case "-v": // Short form for version flag
			versionManager();
			break;

		// Help flags display help information
		case "--help": // Full help flag
		case "-h": // Short form for help flag
			displayHelp();
			break;

		// Unknown arguments log an error and exit with a failure code
		default:
			console.error(`Error: Unknown command "${argv}"`);
			process.exit(1);
	}

	// Exit the process with a success status code
	process.exit(0);
}
