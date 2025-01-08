import { cancelPrompt } from "../prompts/cancel.prompt.js";
import { selectPrompt } from "../prompts/select.prompt.js";
import { textPrompt } from "../prompts/text.prompt.js";
import { ServicesName } from "./enums/services.enum.js";

// Configuration object to store selected services and other configurations.
const configs = {
	status: true, // Determine whether Docker Compose is requested.
	services: [], // List of selected services
	network: "", // Network configuration (not implemented here)
};

/**
 * Helper function to ask about a service and return the response.
 * @param {string} message - The message to display in the prompt.
 * @param {string[]} options - The options to present to the user.
 * @param {string} service - The service to push if the answer is 'yes'.
 * @param {string} [additionalMessage] - Optional message for a follow-up service.
 * @returns {Promise<void>}
 */
async function askService(
	message,
	options,
	service,
	additionalMessage,
	additionalService
) {
	const serviceStatus = await selectPrompt(message, options);
	cancelPrompt(serviceStatus);

	if (serviceStatus) {
		configs["services"].push(service);

		if (additionalMessage) {
			const followUpStatus = await selectPrompt(additionalMessage, options);
			cancelPrompt(followUpStatus);

			if (followUpStatus) configs["services"].push(additionalService);
		}
	}
}

/**
 * Creates a Docker Compose service list based on the user's selected services.
 * Prompts the user with a series of questions to determine which services
 * should be included in the Docker Compose file (e.g., Node, MongoDB, Redis, etc.).
 * @returns {Promise<Object>} - The configurations for Docker services.
 */
export async function selectDockerServices() {
	const dockerComposeStatus = await selectPrompt(
		"Do you need a docker-compose file?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		]
	);

	cancelPrompt(dockerComposeStatus);

	// If the user doesn't need a docker-compose file, return false status.
	if (!dockerComposeStatus) return { status: false };

	// Ask for custom network
	const network = await selectPrompt("Do you need a custom network?", [
		{ value: true, label: "yes" },
		{ value: false, label: "no" },
	]);

	// Custom Network Handling
	if (network) {
		const customValidator = (input) => {
			const regex = /^[a-zA-Z-]+$/;
			return regex.test(input); // Return `true` if valid, `false` otherwise.
		};

		configs["network"] = await textPrompt(
			"Enter a name for the network:",
			true, // Required
			customValidator,
			"Input must contain only letters (a-z, A-Z) and hyphens (-)."
		);

		cancelPrompt(configs["network"]);
	}

	// Ask for each service one by one and add them to the services array if selected.
	await askService(
		"Do you need Node service?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		],
		ServicesName.node
	);

	await askService(
		"Do you need MongoDB service?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		],
		ServicesName.mongodb,
		"Do you need Mongo Express service?",
		ServicesName.mongoexpress
	);

	await askService(
		"Do you need Redis service?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		],
		ServicesName.redis,
		"Do you need Redis Insight service?",
		ServicesName.redisinsight
	);

	await askService(
		"Do you need MySQL service?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		],
		ServicesName.mysql,
		"Do you need phpMyAdmin service?",
		ServicesName.phpmyadmin
	);

	await askService(
		"Do you need PostgreSQL service?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		],
		ServicesName.postgresql,
		"Do you need pgAdmin service?",
		ServicesName.pgadmin
	);

	await askService(
		"Do you need RabbitMQ service?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		],
		ServicesName.rabbitmq
	);

	await askService(
		"Do you need Elasticsearch service?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		],
		ServicesName.elasticsearch,
		"Do you need Kibana service?",
		ServicesName.kibana
	);

	await askService(
		"Do you need Kafka service?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		],
		ServicesName.kafka
	);

	await askService(
		"Do you need Nginx service?",
		[
			{ value: true, label: "yes" },
			{ value: false, label: "no" },
		],
		ServicesName.nginx
	);

	return configs;
}
