# Change Logs for NestCraft CLI Tool

## [1.3.0] - 2025-01-15

### Features

- **[AddFeature]**: Added support for adding features to an existing project using the `--add-feature` flag. This includes Docker configuration, Swagger integration, file uploader, and more. The process is guided by interactive prompts.
- **[FeaturesList]**: Introduced a new flag `--list-features` to display a list of available features for implementation in projects.
- **[Help]**: Added support for `--help` and `-h` commands to display detailed usage instructions for the CLI tool.
- **[Version]**: Added support for `--version` and `-v` commands to display the current version of the installed package.

### Refactoring & Improvements

- **[General Refactor]**: Refactored initialization and command handling logic to improve scalability and maintainability. Moved initialization logic from `index.js` to a dedicated `init.js` file.
- **[ArgvManager]**: Improved argument handling for `--list-features` and `--add-feature` flags. Enhanced help documentation to include usage for these new flags.
- **[ProjectInitializer]**: Modularized utility functions and moved them to the `functions` directory for reusability.
- **[ShellCommands]**: Updated project creator function and replaced the package installation shell command with a new `packageInstallation` function.

### Documentation

- **[README]**: Updated the README file to reflect the new flags and functionality. Added descriptions for the new `--list-features` and `--add-feature` flags.

---

## [1.2.0] - 2025-01-12

### Features

- **[EslintConfig]**: Added a new prompt to allow users to choose their preferred indentation style when configuring the ESLint configuration file.

### Fix

- **[DockerServices]**: Added a cancellation handler to Docker custom network prompt.

---

## [1.1.0] - 2025-01-11

### Features

- **[JestConfig]**: Updated Jest configuration to support absolute imports, ensuring compatibility with the project's import style and preventing test failures.

---

## [1.0.2] - 2025-01-11

### Refactoring

- **[ShellCommands]**: Updated the project creation function and replaced the package installation shell command with a new `packageInstallation` function.

---

## [1.0.1] - 2025-01-08

### Fixes

- Fixed npm version flag in the README file.

---

## [1.0.0] - 2025-01-08

- Initial release of the NestCraft CLI tool.

---
