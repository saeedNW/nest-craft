import chalk from "chalk";

// Define available features and options
const features = [
	"Docker Compose configuration generator",
	"Custom Exception Filters",
	"Custom Pipes",
	"Custom Interceptors",
	"Swagger Integration",
	"Pagination Utilities for TypeORM or Mongoose",
	"Multer File Upload utility",
	"ESLint configuration setup",
	"Jest configuration setup",
];

const options = [
	"Docker Compose Services:",
	"  - Node (Dockerfile included)",
	"  - MongoDB",
	"  - Mongo-Express",
	"  - Redis",
	"  - redisInsight",
	"  - MySQL",
	"  - PhpMyAdmin",
	"  - PostgreSQL",
	"  - pgAdmin",
	"  - RabbitMQ",
	"  - Elasticsearch",
	"  - Kibana",
	"  - Kafka",
	"  - Nginx (Nginx basic config file included)",
	"",
	"Pagination Utilities:",
	"  - TypeORM: Adds pagination utility for TypeORM",
	"  - Mongoose: Adds pagination utility for Mongoose",
	"",
	"Custom Utilities:",
	"  - Exception Filters",
	"  - Unprocessable Entity Pipes",
	"  - Response Interceptors",
	"",
	"Swagger Integration: Automatically configures Swagger for API documentation",
	"Multer File Upload: Adds Multer integration for file uploads",
	"ESLint Configuration: Configurable ESLint setup to use tabs as indentation",
	"Jest Configuration: Updated Jest configuration for absolute imports",
];

// Function to display features and options
export function displayFeaturesAndOptions() {
	console.log(chalk.blue.bold("Available Features:"));
	features.forEach((feature, index) => {
		console.log(`${chalk.green(index + 1)}. ${feature}`);
	});

	console.log("\n" + chalk.blue.bold("Available Options:"));
	options.forEach((option) => {
		console.log(option);
	});
}
