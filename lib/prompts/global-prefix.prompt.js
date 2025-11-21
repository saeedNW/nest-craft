import { booleanPrompt } from './boolean.prompt.js';
import { cancelPrompt } from './cancel.prompt.js';
import { textPrompt } from './text.prompt.js';

/**
 * Prompts the user to decide whether they want to configure a global API prefix and, if so, captures it.
 *
 * The flow is:
 * 1. Ask whether a global prefix should be enabled.
 * 2. If the user agrees, ask them to provide the prefix text.
 *
 * @returns {Promise<string|undefined>} The chosen prefix string, or `undefined` when no global prefix is desired.
 */
export async function promptGlobalPrefix() {
  // Determine whether the user wants to configure a global prefix at all.
  const shouldSetGlobalPrefix = await booleanPrompt(
    'Do you want to set a global prefix for your APIs?',
  );

  // If the feature is declined, return `undefined` so callers can skip related logic.
  if (!shouldSetGlobalPrefix) return undefined;

  // Ask the user to provide the actual prefix text, offering `/api` as the default when no input is provided.
  const rawGlobalPrefix = await textPrompt(
    'Enter the global prefix for your APIs (leave empty to use /api):',
    false,
  );

  // Handle cancellation in case the user aborts while entering the prefix.
  cancelPrompt(rawGlobalPrefix);

  // Return the provided prefix (trimmed) or fall back to `/api` when no custom prefix was supplied.
  return rawGlobalPrefix?.trim() ? rawGlobalPrefix.trim() : '/api';
}
