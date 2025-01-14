import { readFileSync } from "fs";

/**
 * Logs the current version of the application from the package.json file.
 */
export function versionManager() {
	// Parse the package.json file located in the parent directory
	const packageJson = JSON.parse(
		// Read the file synchronously using its URL
		readFileSync(new URL("../package.json", import.meta.url))
	);

	// Log the version prefixed with "v" to the console
	console.log(`v${packageJson.version}`);
}
