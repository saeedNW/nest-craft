import { select } from '@clack/prompts';

/**
 * Displays a selection prompt to the user with the given message and options.
 * @param {string} message - The prompt message to display.
 * @param {Array<{value: string, label: string}>} options - The options for the user to select from.
 * @returns {Promise<string>} The selected value.
 * @throws {Error} If the options array is empty or invalid.
 */
export async function selectPrompt(message, options) {
  // Validate the input to ensure options are provided.
  if (!Array.isArray(options) || options.length === 0) {
    throw new Error('Options must be a non-empty array.');
  }

  // Display the selection prompt and return the selected value.
  return await select({ message, options });
}
