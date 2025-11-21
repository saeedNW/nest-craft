# Nest Craft

[![npm version](https://badgen.net/npm/v/nest-craft)](https://www.npmjs.com/package/nest-craft)
![License](https://img.shields.io/npm/l/@nestjs/cli.svg)

Nest Craft is a batteries-included CLI that scaffolds real-world ready NestJS projects. It orchestrates `nest new`, applies opinionated defaults (ConfigModule, linting, testing, Docker, Swagger, pagination, Multer, etc.), and can retrofit the same features into an existing codebase.

> **Heads up:** Install [`@nestjs/cli`](https://www.npmjs.com/package/@nestjs/cli) globally before running Nest Craft – the generator shells out to the official CLI for the base project.

---

## Why Nest Craft

- Interactive workflow powered by `@clack/prompts` that keeps cancellation safe and error-aware.
- Multi-package-manager support (npm, yarn, pnpm) with automatic dependency installs for every feature you toggle on.
- Production-first template: ConfigModule + env files, global pipes/filters/interceptors, custom Swagger UI, pagination helpers, Multer utilities, typed request/environment definitions, global API prefixing, versioning, security middleware, and Jest E2E tweaks.
- Docker Compose generator with custom network support, smart `depends_on`, service-specific configs (Node, MongoDB, Redis, RabbitMQ, Kafka, Elasticsearch, Nginx, etc.), and file drops (Dockerfile, nginx.conf).
- Feature injector (`--add-feature`) that can enhance an existing NestJS repo without re-scaffolding it.
- Guard rails: directory permission verification, non-sudo enforcement, automatic cleanup on failure, and a bannered UX so contributors know what is happening.

---

## Installation

```bash
npm install -g @nestjs/cli nest-craft
```

Nest Craft is globally executable via the `nest-craft` binary.

---

## Quick Start

```bash
nest-craft init
```

1. Provide a project name or absolute path. Nest Craft will create missing folders, ensure write access, and optionally initialize Git.
2. Pick your package manager.
3. Toggle Docker services, Swagger, security middleware, ValidationPipe, response interceptors, pagination utils, Multer utilities, user/request typings, Prettier indentation, a custom global API prefix, and URI-based API versioning.
4. Optionally pass extra `nest new` flags (e.g., `--strict`) – conflicting flags such as `--skip-git` or `--package-manager` are sanitized automatically.

To retrofit features into an existing NestJS project:

```bash
nest-craft --add-feature
```

Point to the target folder (default `"."`), select the features you want, and Nest Craft will copy configs/utilities plus regenerate Docker Compose files without touching unrelated code.

---

## CLI Commands

| Command                             | Description                                                        |
| ----------------------------------- | ------------------------------------------------------------------ |
| `nest-craft init`                   | Interactive project scaffolding (default when no args are passed). |
| `nest-craft --add-feature`          | Re-run the feature wizards inside an existing Nest project.        |
| `nest-craft --list-features` / `-l` | Print every feature/option available to the generator.             |
| `nest-craft --version` / `-v`       | Print the CLI version derived from `package.json`.                 |
| `nest-craft --help` / `-h`          | Display contextual help with examples.                             |

---

## Feature Deep Dive

### Project template & conventions

- Creates `src/common`, `src/configs`, and `src/modules` upfront and drops a minimal `AppModule` that wires `ConfigModule.forRoot` with `.env` / `.env.development.local`.
- Generates `.env` files with a default `PORT=3000`, plus global type definitions for both `process.env` (`src/common/definitions/env.d.ts`) and `Express.Request` (`src/common/definitions/request.d.ts`).
- Replaces the default `eslint.config.mjs`, `.prettierrc`, and `.prettierignore` with curated versions and runs `npm run format` after scaffolding.
- Upgrades `test/jest-e2e.json` (unless you are in `--add-feature` mode) to support absolute imports via `jest-module-name-mapper`.
- `src/main.ts` automatically opts into `NestExpressApplication`, registers `app.useStaticAssets('assets')`, wires the features you selected (filters, interceptors, ValidationPipe, Swagger), and wraps `bootstrap()` with `.catch(...)`.

### Docker Compose generator

- Toggle any combination of services: Node (Dockerfile included), MongoDB + Mongo Express, Redis + RedisInsight, MySQL + phpMyAdmin, PostgreSQL + pgAdmin, RabbitMQ, Elasticsearch + Kibana, Kafka, Nginx, and more.
- Optional custom network names (validated to `a-z` and `-`) and dynamic `depends_on` wiring so the Node service waits for the backing stores you selected.
- Drops relevant config files (Dockerfile, nginx.conf) at the project root and writes a single `docker-compose.yml` assembled from templates under `lib/docker/services`.

### Swagger experience

Enabling Swagger installs `@nestjs/swagger` and `swagger-ui-express`, copies `configs/swagger.config.ts`, and an `assets/swagger-ui` folder with a curated UX layer (endpoint search, RBAC badges, collapsible quick navigation, and custom CSS/JS). Your generated `main.ts` automatically imports and calls `swaggerConfiguration(app)`:

```ts
import { swaggerConfiguration } from './configs/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  swaggerConfiguration(app, 'My API'); // available at /api/doc/8888
}
```

### Pagination toolkit

Selecting TypeORM or Mongoose pagination installs the relevant ORM packages and copies a DTO + interface + utility trio into `src/common/utils/pagination`. Example (TypeORM):

```ts
import { PaginationDto } from './common/utils/pagination/pagination.dto';
import {
  typeormPaginate,
  PaginatedResult,
} from './common/utils/pagination/typeorm.pagination.utility';

async function listUsers(dto: PaginationDto): Promise<PaginatedResult<User>> {
  return typeormPaginate(dto, this.userRepository, undefined, '/api/users');
}
```

Each helper returns `{ items, meta, links }`, giving you HATEOAS-friendly pagination with zero boilerplate.

### File upload toolkit

Enable Multer to install the dependency plus copy strongly typed helpers into `src/common/utils/multer`:

- `multerFileUploader()` – ready-to-use Multer config backed by disk storage and a `.temp` directory under `assets`.
- `uploadFinalization()` – move/rename files into `./assets/uploads/**` and get the public-facing path back.
- `removeUploadedFiles()` & `fileRemoval()` – cleanup utilities for both Express adapters and manual workflows.

Example controller snippet:

```ts
@Post('avatar')
@UseInterceptors(FileInterceptor('file', multerFileUploader()))
async upload(@UploadedFile() file: TMulterFile) {
  const path = await uploadFinalization(file, '/avatars');
  return { path };
}
```

### Additional utilities

- **Static assets**: Every project serves the `assets` folder automatically – swagger UI, uploads, and any other static resources can live there.
- **User definition toggle**: Optionally add a `Request.userId` typing to `Express.Request`.
- **Validation pipe**: If you opt in, `main.ts` wires a global `ValidationPipe` configured for `whitelist`, `transform`, and `HttpStatus.UNPROCESSABLE_ENTITY`.
- **Prettier indentation**: Pick tabs or spaces during scaffolding; we mutate `.prettierrc` for you.

### Global API prefix & versioning

- **Global prefix prompt**: Decide whether every route should be wrapped in a custom prefix (defaults to `/api`). The generator updates `main.ts` with `app.setGlobalPrefix('<prefix>')`, so your routes and Swagger UI stay aligned automatically.
- **API versioning toggle**: Opt into URI-based versioning with a single prompt. Nest Craft wires `app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })`, meaning controllers can declare `@Version('1')` (or later `2`, `3`, …) without extra glue.

### Security utilities

- **Prompt-driven multi-select**: Enable any combination of CORS, Helmet, and “fake tech stack” headers. All options live under a single `security` directory for clarity.
- **CORS**: Copies a reusable `getCorsConfig()` helper that expects a `CORS_ORIGIN` env var (auto-appended to your new `.env` files) and wires `app.enableCors(...)` with the right defaults.
- **Helmet**: Installs `helmet`, adds a hardening-focused config (`contentSecurityPolicy`, `hsts`, `noSniff`, etc.), and mounts it globally.
- **Custom headers interceptor**: Spoof the `X-Powered-By` and `Server` headers to disguise your real stack. This interceptor is added to the global interceptor chain alongside any response transformer you selected.

---

## Advanced configuration & tips

- **Extra Nest flags**: Use the final prompt to pass additional `nest new` options (e.g., `--strict --language ts`). Nest Craft strips duplicate `--skip-git` / `--package-manager` flags to avoid conflicts.
- **Fine-tune routing**: You can change the generated global prefix or versioning strategy later by editing `src/main.ts`—the scaffolder only seeds the initial setting.
- **Customize CORS origins**: After scaffolding, edit `CORS_ORIGIN` inside `.env` / `.env.development.local` to a comma-delimited list of front-end origins that should be allowed.
- **Permissions**: The CLI refuses to run as `root` and validates directory write access before doing anything destructive. If something fails, it rolls back the partially created folders.
- **Feature injection caveats**: `--add-feature` skips Jest reconfiguration but still installs dependencies, copies configs (including `.prettierrc/.prettierignore`), and can regenerate Docker Compose files in-place.
- **Static asset path change**: Upload helpers now target `assets/uploads`, so ensure your platform (e.g., reverse proxies) know about the new directory when upgrading from <=1.3.0.

---

## What's New

Changes since `1.4.0` (unreleased work in `main`):

- Overhauled file copier to always scaffold `.prettierrc`, `.prettierignore`, `eslint.config.mjs`, typed env/request definitions, and assets folder registration.
- Brand-new Swagger UX (`configs/swagger.config.ts` + `assets/swagger-ui/**`) with endpoint search, RBAC indicators, a collapsible quick nav sidebar, and a locked `/api/doc/8888` mount.
- Pagination toolkit rewritten around `PaginationDto`, `Pagination/ PaginatedResult` interfaces, and driver-specific utilities that emit metadata and navigation links.
- Multer utilities promoted into their own module set (`multer.config.ts`, `multer.utilities.ts`, `multer.types.ts`) with strongly typed callbacks, temp directories under `assets`, and file cleanup helpers.
- Docker Compose generator now supports validated custom networks, smarter `depends_on` blocks for the Node service, and automatically drops Dockerfile/nginx.conf when relevant services are selected.
- Global API prefix prompt, URI-based versioning toggle, and security utilities (CORS helper, opinionated Helmet config, fake tech stack headers) that wire themselves into `main.ts` and seed the corresponding files/env vars.
- Improved prompts, permission checks, directory creation helpers, and `main.ts` mutations (NestExpressApplication, static assets, bootstrap error handling).

**Suggested release:** `1.4.0` (minor) – new features + template refinements without breaking the CLI surface area, but note the new default `assets/uploads` path for file uploads.

See [LOGS.md](LOGS.md) for the historical changelog.

---

## Contributing

Issues and PRs are welcome at [github.com/saeedNW/nest-craft](https://github.com/saeedNW/nest-craft). If you are adding prompts/utilities, remember to document them here and update `LOGS.md`.

---

## License

Nest Craft is released under the [MIT License](LICENSE).
