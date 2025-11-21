import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { copyFile, moveFile } from '../shell/shell.commands.js';
import { mainProjectPath } from '../functions/main-project-path.js';
import { ServicesName } from './enums/services.enum.js';

/**
 * Generates a docker-compose.yml file based on the provided configuration.
 * @param {string} projectPath - Path to the project directory.
 * @param {Object} dockerComposeConfig - Docker Compose configuration.
 * @returns {Promise<void>}
 */
export async function dockerComposeGenerator(projectPath, dockerComposeConfig) {
  if (!dockerComposeConfig.status) return;

  const basePath = mainProjectPath(import.meta.url);
  const tempFilePath = await createTempDockerComposeFile();

  const dockerComposeContent = await generateDockerComposeContent(dockerComposeConfig, basePath);

  // Write the content to the temporary file and move it to the target directory
  await fs.writeFile(tempFilePath, dockerComposeContent, 'utf8');
  await moveFile(tempFilePath, path.join(projectPath, 'docker-compose.yml'));

  // Handle additional files (e.g., Dockerfile, nginx.conf) based on services
  await handleAdditionalFiles(projectPath, basePath, dockerComposeConfig.services);
}

/**
 * Creates a temporary file for the docker-compose content.
 * @returns {Promise<string>} - Path to the temporary file.
 */
async function createTempDockerComposeFile() {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'docker-compose-'));
  return path.join(tempDirectory, 'docker-compose.yml');
}

/**
 * Generates the content for the docker-compose file.
 * @param {Object} config - Docker Compose configuration.
 * @param {string} basePath - Base path for service configurations.
 * @returns {Promise<string>} - The docker-compose content.
 */
async function generateDockerComposeContent(config, basePath) {
  const { services, network } = config;
  let content = '';

  // Add network section if configured
  if (network) {
    const networkConfigPath = path.join(basePath, 'services/network.config.yaml');
    const networkConfigContent = await fs.readFile(networkConfigPath, 'utf8');
    content += networkConfigContent.replace('{ { NETWORK } }', network);
  }

  content += '\nservices:';
  for (const service of services) {
    const serviceConfig = await getServiceConfig(basePath, service, network, services);
    content += serviceConfig;
  }

  return content;
}

/**
 * Retrieves and processes the configuration for a specific service.
 * @param {string} basePath - Base path for service configurations.
 * @param {string} service - Service name.
 * @param {string} network - Network name.
 * @param {string[]} services - List of selected services.
 * @returns {Promise<string>} - The processed service configuration.
 */
async function getServiceConfig(basePath, service, network, services) {
  const serviceConfigPath = path.join(basePath, `services/${service}.config.yaml`);
  let configContent = await fs.readFile(serviceConfigPath, 'utf8');

  // Remove "services:" prefix
  configContent = configContent.replace('services:', '');

  // Adjust network settings
  if (!network) {
    configContent = configContent.replaceAll(
      `
    networks:
      - { { NETWORK } }`,
      '',
    );
  } else {
    configContent = configContent.replaceAll('{ { NETWORK } }', network);
  }

  // Add `depends_on` section for Node service
  if (service === ServicesName.node) {
    const dependsOn = [
      'mongodb',
      'redis',
      'mysql',
      'postgresql',
      'rabbitmq',
      'elasticsearch',
      'kafka',
    ].filter(dependency => services.includes(dependency));

    if (dependsOn.length) {
      const dependsOnSection = `
    depends_on:
${dependsOn.map(dep => `      - ${dep}`).join('\n')}`;

      configContent = configContent.replace(
        `
    restart: always`,
        dependsOnSection +
          `
    restart: always`,
      );
    }
  }

  return configContent;
}

/**
 * Copies additional required files (e.g., Dockerfile, nginx.conf) based on the selected services.
 * @param {string} projectPath - Path to the project directory.
 * @param {string} basePath - Base path for additional configurations.
 * @param {string[]} services - List of selected services.
 * @returns {Promise<void>}
 */
async function handleAdditionalFiles(projectPath, basePath, services) {
  const copyTasks = [];

  if (services.includes(ServicesName.node)) {
    copyTasks.push(
      copyFile(path.join(basePath, 'config/Dockerfile'), path.join(projectPath, 'Dockerfile')),
    );
  }

  if (services.includes(ServicesName.nginx)) {
    copyTasks.push(
      copyFile(path.join(basePath, 'config/nginx.conf'), path.join(projectPath, 'nginx.conf')),
    );
  }

  await Promise.all(copyTasks);
}
