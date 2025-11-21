import { multiselect } from '@clack/prompts';
import { booleanPrompt } from './boolean.prompt.js';
import { cancelPrompt } from './cancel.prompt.js';

const SECURITY_OPTIONS = [
  { value: 'cors', label: 'CORS' },
  { value: 'helmet', label: 'Helmet' },
  { value: 'fake-tech-stack-headers', label: 'Fake tech stack headers' },
];

/**
 * Prompts the user to decide whether security utilities should be added and which ones to include.
 *
 * Flow:
 * 1. Ask if security enhancements are desired.
 * 2. If yes, present a multi-select list of supported options (CORS, Helmet, fake tech stack headers).
 * 3. If no option is picked after opting in, the flow is treated as if the user declined security utilities.
 *
 * @returns {Promise<{ enabled: boolean, selections: string[] }>} An object describing the user's choices.
 */
export async function promptSecurityOptions() {
  // STEP 1: Determine whether the user wants any security measures.
  let securityEnabled = await booleanPrompt('Do you want to add security utilities?');

  // If security is not desired, short-circuit with a disabled response.
  if (!securityEnabled) {
    return { enabled: false, selections: [] };
  }

  // STEP 2: Let the user pick which utilities they want to enable.
  const selectedOptions = await multiselect({
    message: 'Select the security utilities you want to enable:',
    options: SECURITY_OPTIONS,
    required: false, // allow users to skip selection (we will normalize below).
  });

  // Handle cancellation if the user aborts during the multi-select prompt.
  cancelPrompt(selectedOptions);

  // Normalize the selection to an array (multiselect returns an array or undefined).
  const selections = Array.isArray(selectedOptions)
    ? selectedOptions.filter(option => typeof option === 'string' && option.length > 0)
    : [];

  // If they opted in but chose nothing, treat it as opting out.
  if (selections.length === 0) {
    securityEnabled = false;
  }

  return {
    enabled: securityEnabled,
    selections: securityEnabled ? selections : [],
  };
}
