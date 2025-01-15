import figlet from "figlet";
import chalk from "chalk";
import { intro } from "@clack/prompts";

/**
 * Displays the CLI banner and an introductory message.
 * Uses ASCII art and colored text to enhance the user experience.
 * @param {string} message - The into message
 */
export function displayBanner(message) {
	// Render the "Nest Craft" ASCII art using Figlet and color it green.
	console.log(chalk.green(figlet.textSync("Nest Craft")));

	// Display an introductory message below the banner in cyan.
	intro(chalk.cyan(message));
}
