import { selectPrompt } from './select.prompt.js';

/**
 * Prompts the user to select a package manager for the project.
 *
 * Provides the following options:
 * - npm
 * - yarn
 * - pnpm
 *
 * @returns {Promise<string>} A string representing the selected package manager:
 */
export async function promptPackageManager() {
  return await selectPrompt('Which package manager should be used?', [
    { value: 'npm', label: 'npm' },
    { value: 'yarn', label: 'yarn' },
    { value: 'pnpm', label: 'pnpm' },
  ]);
}
