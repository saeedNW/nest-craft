import path from 'path';
import os from 'os';

/**
 * Converts a given project path to an absolute path.
 * Supports paths starting with '~' (home directory).
 * @param {string} projectPath - The input project path.
 * @returns {string} The absolute path.
 */
export function convertToAbsolutePath(projectPath) {
  if (projectPath.startsWith('~')) {
    return escapeSpacesInPath(path.join(os.homedir(), projectPath.slice(1)));
  }

  return escapeSpacesInPath(projectPath);
}

/**
 * Escapes spaces in a given path by adding a backslash before each space.
 * @param {string} path - The path in which spaces need to be escaped.
 * @returns {string} The path with spaces escaped.
 */
function escapeSpacesInPath(path) {
  // Split the path by '/' to process each directory separately
  return path
    .split('/')
    .map(segment => {
      // Escape spaces in segments if not already escaped
      return segment.replace(/(?<!\\) /g, '\\ ');
    })
    .join('/');
}
