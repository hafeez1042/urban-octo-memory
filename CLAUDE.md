# AI Development Guide

## Purpose

Reusable TypeScript monorepo with an Express API, React/Vite web app, PostgreSQL-ready persistence, shared contracts, and Turborepo tasks. Add product behavior deliberately; this repository has no product domain, authentication, billing, provider, or tenant assumptions.

## Structure

- `packages/types`: shared TypeScript contracts and Zod schemas.
- `packages/backend`: framework-agnostic API base classes, errors, middleware, and Sequelize helpers.
- `services/core`: Express API, Sequelize migrations, and backend tests.
- `frontend/web`: Vite React application and frontend tests.
- `scripts/scaffold.mjs`: generates a backend entity starting point.

## Required Boundaries

- Define shared API contracts and entity interfaces in `packages/types/src`.
- Keep HTTP handlers thin: routes -> controllers -> services -> repositories -> models.
- Controllers and routes never query Sequelize models directly.
- Put pure business decisions in `services/core/src/policies`; keep I/O in services or repositories.
- Add database changes only through timestamped migrations with a working `down` operation. Do not use `sequelize.sync()`.
- In the web app, components call query/mutation hooks; hooks call services; only services access HTTP clients.
- Do not import server-only code into the frontend or frontend code into the API.
- Use named exports for application modules. Keep files focused and avoid product-specific code in shared packages.

## Adding A Feature

1. Define request/response contracts in `packages/types/src/contracts`.
2. For persisted data, run `pnpm scaffold <EntityName>`, then complete the generated schema, migration, model, repository, service, controller, and route registration.
3. Add API tests beside the affected backend slice.
4. Add a frontend feature under `frontend/web/src/features/<domain>` with services and query/mutation hooks.
5. Validate the smallest relevant test, then run the repository checks.

## Reference Slice

`ExampleTask` is a minimal backend reference across `packages/types/src/schema`, `contracts`,
`services/core/migrations`, and the model -> repository -> service -> controller -> route layers.
It is intentionally not registered in `src/routes/index.ts`, so the health-only starter does not
require a database connection. Copy or rename the slice, register its router, and add focused
tests before exposing it in a product.

## Environment

- Copy `services/core/.env.example` for local API configuration.
- `DATABASE_URL` is required only when running migrations or initializing Sequelize models.
- Read runtime variables through `services/core/src/config/env.ts`; do not scatter `process.env` reads through application code.
- Never commit secrets, real production URLs, customer data, or generated logs.

## Commands

```sh
pnpm install
pnpm dev
pnpm lint
pnpm check-types
pnpm test
pnpm build
pnpm scaffold Product
pnpm test:db:up
pnpm db:migrate
pnpm test:db:down
```

## Completion Standard

For every change, run the affected test or check first. Before handing off a feature, run `pnpm lint`, `pnpm check-types`, `pnpm test`, and `pnpm build`. Update this file only for stable, repository-wide conventions.
