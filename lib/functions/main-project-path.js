import { fileURLToPath } from 'url';
import path from 'path';

export function mainProjectPath(fileUrl) {
  // Get the directory of the current script
  const __filename = fileURLToPath(fileUrl);
  return path.dirname(__filename);
}
