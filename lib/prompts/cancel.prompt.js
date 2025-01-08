import { cancel, isCancel } from "@clack/prompts";

/**
 * Handles user cancellation gracefully.
 * If the input value indicates a cancel action, it displays a message and exits the process.
 * @param {any} value - The input value to check for cancellation.
 */
export function cancelPrompt(value) {
	// Check if the value indicates cancellation; exit early if not.
	if (!isCancel(value)) return;

	// Display the cancellation message to the user.
	cancel("Operation cancelled.");

	// Exit the process with a success status (0), indicating no error occurred.
	process.exit(0);
}
