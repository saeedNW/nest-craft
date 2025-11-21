import { booleanPrompt } from './boolean.prompt.js';
import { cancelPrompt } from './cancel.prompt.js';
import { selectPrompt } from './select.prompt.js';

/**
 * Prompts the user to determine if pagination is required and, if so, which ORM or ODM should be used for pagination.
 *
 * This function first asks if pagination is needed. If the user selects "Yes", it then asks which ORM or ODM should
 * be used for pagination (e.g., TypeORM, Mongoose, or None).
 *
 * @returns {Promise<string|undefined>} The selected pagination type:
 * - `typeorm` for TypeORM,
 * - `mongoose` for Mongoose,
 * - `undefined` for None (if pagination is not needed).
 */
export async function promptPaginationType() {
  // Ask if the user needs a Pagination Utility.
  const paginationRequired = await booleanPrompt('Do you need a Pagination Utility?');

  // If pagination is not required, return undefined.
  if (!paginationRequired) return undefined;

  // Ask which ORM/ODM the user wants to use for pagination.
  const paginationType = await selectPrompt('Which ORM or ODM do you need for pagination?', [
    { value: 'typeorm', label: 'TypeORM' }, // Option for TypeORM.
    { value: 'mongoose', label: 'Mongoose' }, // Option for Mongoose.
    { value: undefined, label: 'None' }, // Option for no ORM/ODM (None).
  ]);

  // Handle cancellation during the prompt.
  cancelPrompt(paginationType);

  // Return the selected pagination type (could be 'typeorm', 'mongoose', or undefined).
  return paginationType;
}
