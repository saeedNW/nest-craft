import { execa } from 'execa';
import fs from 'fs/promises';
import path from 'path';

/**
 * Updates the Jest configuration in the project's package.json file.
 *
 * @param {string} projectPath The path to the project's root directory.
 * @throws {Error} Throws an error if the modification fails.
 */
export async function updateJestConfig(projectPath) {
  // Construct the path to package.json
  const packageJsonPath = path.join(projectPath, 'package.json').replaceAll('\\', ''); // Ensure correct file path formatting across OS

  // Read the existing package.json file
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);

  // Define the new Jest configuration
  const jestConfig = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: 'src',
    testRegex: '.*\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['**/*.(t|j)s'],
    coverageDirectory: '../coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
      '^src/(.*)$': '<rootDir>/$1',
    },
  };

  // Update the Jest configuration in the package.json
  packageJson.jest = jestConfig;

  // Update the start:dev script to include NODE_ENV=development
  if (packageJson.scripts && packageJson.scripts['start:dev']) {
    const startDevCommand = packageJson.scripts['start:dev'];
    // Only add NODE_ENV if it's not already present
    if (!startDevCommand.includes('NODE_ENV=development')) {
      packageJson.scripts['start:dev'] = `NODE_ENV=development ${startDevCommand}`;
    }
  }

  // Write the updated package.json back to the file
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');

  // Optionally, format the file using a package like Prettier
  await execa('npx', ['prettier', '--write', packageJsonPath]);
}
