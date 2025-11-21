#!/usr/bin/env node

import { verifyNonSudo } from '../lib/functions/verify-non-sudo.js';
import { commandManager } from './argv-manager.js';

/**
 * Main entry point for the Nest Craft CLI.
 * Orchestrates the process of creating a custom NestJS project by collecting user input,
 * setting up the project directory, and initializing the desired configurations.
 */
async function main() {
  // Verify the script is not executed with superuser privileges.
  verifyNonSudo();

  // Tool's Argv commands and process manager
  commandManager();
}

// Execute the main function
main();
