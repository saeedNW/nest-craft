import { cancelPrompt } from './cancel.prompt.js';
import { selectPrompt } from './select.prompt.js';

/**
 * Prompts the user with a yes/no question and returns the selected boolean value.
 *
 * This function uses a selection prompt with two options:
 * - Yes (true)
 * - No (false)
 *
 * @param {string} message The message or question to display to the user.
 * @returns {Promise<boolean>} A boolean value indicating the user's choice:
 * - `true` for "Yes"
 * - `false` for "No"
 */
export async function booleanPrompt(message) {
  // Display a selection prompt with Yes/No options.
  const response = await selectPrompt(message, [
    { value: true, label: 'Yes' },
    { value: false, label: 'No' },
  ]);

  // Handle cancellation during the prompt.
  cancelPrompt(response);

  // Return the boolean response (true for Yes, false for No).
  return response;
}
