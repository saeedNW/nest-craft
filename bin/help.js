/**
 * Displays help information for the CLI tool.
 */
export function displayHelp() {
  console.log(`Usage: nest-craft [command]

Commands:
  init                 Initialize a new NestJS project
  --version, -v        Display the current version of NestCraft
  --help, -h           Show this help message
  --add-feature        Add features such as Docker config, Swagger, custom filters, pagination modules, etc to an existing project.
  --list-features, -l  Display a list of available features for use with the "init" and "--add-feature" commands

Examples:
  nest-craft init             Initialize a new project
  nest-craft --version        Display the tool version
  nest-craft --help           Show this help message
  nest-craft --add-feature    Add additional features to the project
  nest-craft --list-features  Display available features and options
`);
}
