/**
 * Extend the 'ProcessEnv' interface in the NodeJS namespace to create
 * globally accessible types for environment variables.
 *
 * Adding types here provides type suggestions when accessing variables
 * through 'process.env'.
 */
namespace NodeJS {
  interface ProcessEnv {
    // Application Environmental Variables
    PORT: string;
  }
}
