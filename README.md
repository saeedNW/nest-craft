# Nest Craft

Nest Craft is a new way of scaffolding custom NestJS projects. It provides various options and configurations to help you quickly set up your project, including Docker integration, custom utilities, and more.

**Note:** The [`@nestjs/cli`](https://www.npmjs.com/package/@nestjs/cli) package is a must for this package to work because Nest Craft depends on it for its core logic. Make sure to install it before using Nest Craft.

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
- Ability to add features to existing projects
- Git repository initialization (optional)
- ESLint configuration setup
- Jest configuration setup
- Version flag to check the current version
- Help command for usage guidance
- List of available features for implementation in a project

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

Follow the on-screen instructions to set up your project.

### Commands and Flags

#### Initialize a New Project

```bash
nest-craft init
```

- **Project Name or Path:**
  - If you provide a simple name (e.g., `my-app`), the NestJS project will be created in a new directory named `my-app` within the current working directory.
  - If you provide a full path (e.g., `/path/to/my-app`), the tool will:
    1. Use the last segment of the path (`my-app`) as the project name.
    2. Use the rest of the path (`/path/to`) as the parent directory.
    3. Create any missing directories along the specified path and scaffold the NestJS project.

#### Add Features to an Existing Project

```bash
nest-craft --add-feature
```

- Adds selected features to an existing NestJS project. Follow the interactive prompts to configure the desired features.

#### List Available Features

```bash
nest-craft --list-features
```

or

```bash
nest-craft -l
```

- Displays a list of all available features and options that can be added to a new or existing project.

#### Check Version

```bash
nest-craft --version
```

or

```bash
nest-craft -v
```

- Displays the current version of Nest Craft.

#### Display Help

```bash
nest-craft --help
```

or

```bash
nest-craft -h
```

- Displays a list of available commands and their descriptions.

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

- **TypeORM**: Installs `@nestjs/typeorm` and `typeorm` and adds a pagination utility file to the project.
- **Mongoose**: Installs `@nestjs/mongoose` and `mongoose` and adds a pagination utility file to the project.

### Swagger Integration

Automatically configures Swagger for your API documentation.

### Custom Utilities

Optionally include:

- Exception Filters
- Unprocessable Entity Pipes
- Response Interceptors

### File Upload (Multer)

Adds Multer integration for file uploads.

### ESLint Configuration

Optionally determine whether ESLint uses tabs for indentation or not.

### Jest Configuration

Updated Jest configuration to support absolute imports.

---

## Contributing

Contributions are welcome! Please submit an issue or pull request on the [GitHub repository](https://github.com/saeedNW/nest-craft).

---

## License

Nest Craft is licensed under the [MIT License](LICENSE).
