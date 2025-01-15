import { addFeature } from "./add-feature.js";
import { displayFeaturesAndOptions } from "./features-list.js";
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
			initialization();
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

		// Add-feature flag triggers the feature addition process
		case "--add-feature":
			addFeature();
			return;

		// List-features flag displays the list of available features
		case "--list-features": // Full list features flag
		case "-l": // Short form for list features flag
			displayFeaturesAndOptions();
			break;

		// Unknown arguments log an error and exit with a failure code
		default:
			console.error(`Error: Unknown command "${argv}"`);
			process.exit(1);
	}

	// Exit the process with a success status code
	process.exit(0);
}
