# TypeScript Application Boilerplate

A reusable Turborepo starter with an Express API, a React/Vite web app, shared TypeScript contracts, Sequelize-ready PostgreSQL support, and automated quality checks.

## Requirements

- Node.js 22+
- pnpm 9+
- Docker, when using the included PostgreSQL service

## Start

```sh
pnpm install
cp services/core/.env.example services/core/.env
pnpm dev
```

The API starts on `http://localhost:3000`; the web app starts on `http://localhost:3021`.

## Quality Checks

```sh
pnpm lint
pnpm check-types
pnpm test
pnpm build
```

## Data Model

Start a new persisted entity with:

```sh
pnpm scaffold Product
```

Complete the generated fields, migration, model, repository, service, controller, and route registration before using it. Start PostgreSQL and run migrations with:

```sh
pnpm test:db:up
pnpm db:migrate
```

## Backend Reference

`ExampleTask` provides a minimal schema, request contracts, migration, Sequelize model,
repository, service, controller, router, and request-ID middleware example. It is deliberately
unmounted; copy or rename it, register its router in `services/core/src/routes/index.ts`, and add
feature tests before using it in an application.

Repository-wide AI development rules live in `CLAUDE.md`.
