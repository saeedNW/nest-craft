# Nest Craft

Nest Craft is a new way of scaffolding custom NestJS projects. It provides various options and configurations to help you quickly set up your project, including Docker integration, custom utilities, and more.

[![npm version](https://badgen.net/npm/v/nest-craft)](https://www.npmjs.com/package/nest-craft)
![License](https://img.shields.io/npm/l/@nestjs/cli.svg)

---

## Features

- Interactive prompts for project setup
- Supports multiple package managers (npm, yarn, pnpm)
- Docker Compose configuration generator
- Includes options for:
  - Custom Exception Filters
  - Custom Pipes
  - Custom Interceptors
  - Swagger Integration
  - Pagination Utilities for TypeORM or Mongoose
  - Multer File Upload utility
- Git repository initialization (optional)
- ESLint configuration setup
- Jest configuration setup

---

## Installation

You can install Nest Craft globally using npm:

```bash
npm install -g nest-craft
```

---

## Usage

Run the `nest-craft` command to create a new project:

```bash
nest-craft
```

After starting the process you can Follow the on-screen instructions to set up your project.

### Project Name or Path

In the first step of the process you need to chose a name or path for your project

- **Project Name:**

  - If you provide a simple name (e.g., `my-app`), the NestJS project will be created in a new directory named `my-app` within the current working directory.

- **Project Path:**
  - If you provide a full path (e.g., `/path/to/my-app`), the tool will:
    1. Use the last segment of the path (`my-app`) as the project name.
    2. Use the rest of the path (`/path/to`) as the parent directory.
    3. Create any missing directories along the specified path and scaffold the NestJS project.

---

## Options and Features

### Docker Compose Integration

Nest Craft allows you to include a Docker Compose configuration. Select from predefined services like:

- Node (Dockerfile included)
- MongoDB
- Mongo-Express
- Redis
- redisInsight
- MySQL
- PhpMyAdmin
- PostgreSQL
- pgAdmin
- RabbitMQ
- Elasticsearch
- Kibana
- Kafka
- Nginx (Nginx basic config file included)

### Pagination Utilities

Select pagination utilities based on your ORM/ODM:

- **TypeORM**: Installs `@nestjs/typeorm` and `typeorm` and add pagination utility file to the project.
- **Mongoose**: Installs `@nestjs/mongoose` and `mongoose` and add pagination utility file to the project.

### Swagger Integration

Automatically configures Swagger for your API documentation.

### Custom Utilities

Optionally include:

- Exception Filters
- Unprocessable Entity Pipes
- Response Interceptors

### File Upload (Multer)

Adds Multer integration for file uploads.

### Eslint Configuration

Optionally determine whether Eslint uses tabs for indentation or not

### Jest Configuration

Updated Jest configuration to support absolute imports

---

## Contributing

Contributions are welcome! Please submit an issue or pull request on the [GitHub repository](https://github.com/saeedNW/nest-craft).

---

## License

Nest Craft is licensed under the [MIT License](LICENSE).
