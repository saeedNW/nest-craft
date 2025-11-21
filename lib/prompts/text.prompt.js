import { text } from '@clack/prompts';

/**
 * Displays a prompt asking for text input and validates the response.
 * @param {string} message - The message to be displayed in the prompt.
 * @param {boolean} [required=false] - Whether the input is mandatory (default is `false`).
 * @returns {Promise<string>} - The text input provided by the user.
 * @throws {Error} - If the provided message is not valid (not a string or empty).
 */
export async function textPrompt(
  message,
  required = false,
  customValidation = undefined,
  customError = undefined,
) {
  // Ensure that a valid message is provided.
  if (!message || typeof message !== 'string') {
    throw new Error('A valid prompt message is required.');
  }

  // Display the prompt and validate the user's input.
  return await text({
    message,
    validate(input) {
      // If required, ensure the input is not empty.
      if (required && input.trim().length === 0) return 'Value is required!';

      if (customValidation && !customValidation(input)) {
        return customError || 'Invalid input.';
      }
    },
  });
}
