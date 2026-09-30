# CLAUDE.md — Agent Development Guide

This is a full-stack project template. When the project has a requirements/spec document
under `docs/`, read the relevant section before implementing a feature.

## Response Style
- Always respond in simple and short, dont over explain, consider me as lazy person and dont like to read too much

## Stack
- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: Express 5, Sequelize 6 (PostgreSQL), zod, TypeScript — `services/core`
- **Migrations**: sequelize-cli — `services/core/src/database/migrations`
- **Auth**: Microsoft Entra ID (OIDC / OAuth 2.0 bearer tokens), validated per request
- **Frontend**: Vite 8, React 19, Tailwind CSS 4, shadcn/ui — `frontend/web`
- **Shared packages**: `@repo/types` (schemas), `@repo/backend` (base classes, middleware)

Detailed rules live in `rules/`. This file is the summary; `rules/` is authoritative:

| Topic | File |
|---|---|
| Layering, folders | `rules/backend/folder-structure.md` |
| Models | `rules/backend/model.md` |
| Repositories | `rules/backend/repository.md` |
| Services | `rules/backend/services.md` |
| Controllers, routes, middleware | `rules/backend/express.md` |
| Migrations | `rules/backend/migrations.md` |
| Transactions and domain events | `rules/backend/transactions-and-events.md` |
| Request validation | `rules/backend/validation.md` |
| Auth, context, scope | `rules/backend/auth-and-context.md` |
| Response envelope, status codes, query params | `rules/backend/api-contract.md` |
| Config, logging, lifecycle | `rules/backend/configuration.md` |
| Naming and style | `rules/general.md` |
| Frontend structure | `rules/frontend/vite-folder-structure.md` |
| Frontend styling, tokens, fonts | `rules/frontend/styling.md` |
| Components, data fetching, services | `rules/frontend/react-component.md`, `fetch-data-useQuery.md`, `services.md` |
| Testing — definition of done | `rules/testing/overview.md` |
| Playwright end-to-end specs | `rules/testing/playwright-e2e.md` |
| Backend tests | `rules/testing/backend-tests.md` |
| Security tests (mandatory) | `rules/testing/security-tests.md` |

---

## Monorepo Layout

```
packages/
  types/        # @repo/types   — all TypeScript interfaces & enums
  backend/      # @repo/backend — base classes, middleware, errors, context, events
services/
  core/         # Express API
    src/
      app.ts          # composition root (no listen)
      server.ts       # bootstrap: associations, DB check, listen, graceful shutdown
      config/         # env (zod), database, logger, swagger
      controllers/    # *.controller.ts
      services/       # *.service.ts
      repositories/   # *.repository.ts
      models/         # *.model.ts + index.ts (associations)
      routes/         # *.routes.ts
      validators/     # *.validator.ts (zod)
      middlewares/    # *.middleware.ts
      swagger/        # *.swagger.ts (annotations only)
      database/       # sequelize-cli config, migrations, seeders, column helpers
    tests/            # vitest: api/, services/, security/ — *.test.ts
frontend/
  web/          # Vite app
    e2e/             # playwright specs — *.spec.ts, one file per feature
    src/
      App.tsx        # providers + router
      routes/        # router.tsx — the route table
      features/      # <feature>/<Feature>Page.tsx + components/
      components/    # layout/, common/ (cross-feature), ui/ (shadcn), shared pieces
      providers/     # app scope and auth context
      hooks/         # shared frontend hooks, including useQuery
      lib/           # AbstractServices, HTTP, and utilities
      errors/        # Frontend API errors
      types/         # Frontend implementation types
      services/      # *.service.ts (extends AbstractServices)
      queries/       # useGet*.ts hooks (read operations)
      mutations/     # use*.ts hooks (write operations)
      mocks/         # placeholder data used as useQuery defaultValue
      styles/        # tokens.css, fonts.css, app.css, auth.css
    public/fonts/    # self-hosted woff2 font subsets, served at /fonts/…
```

When the project has an approved UI reference (e.g. under `docs/ui/`), the interface follows
it. Colours, fonts, radii and shadows come from `src/styles/tokens.css`; see
`rules/frontend/styling.md`. Fonts are self-hosted, never loaded from a CDN.

---

## Commands

```bash
pnpm dev                                          # all apps
pnpm build && pnpm lint && pnpm check-types && pnpm test   # what CI runs
pnpm scaffold <EntityName>                        # generate an entity across the stack

pnpm --filter @services/core test                 # vitest: contract, service, security
pnpm --filter @frontend/web test:e2e              # playwright, headless

pnpm --filter @services/core db:migrate           # apply migrations
pnpm --filter @services/core db:migrate:status
pnpm --filter @services/core db:migrate:undo
pnpm --filter @services/core migration:create <name>
```

`@repo/types` and `@repo/backend` compile to `lib/`. After changing a shared type, build
it (`pnpm build`) before the consumer sees it — backend code imports
`@repo/types/lib/**`, never `src/**`.

---

## Adding a New Entity — Canonical Workflow

**Always scaffold first:**
```bash
pnpm scaffold Order
pnpm scaffold OrderItem
pnpm scaffold price-list
```

That generates, and registers the route for: shared type, model, **migration**,
repository, service, controller, validator, routes, swagger annotations, frontend service
and query hook. Then fill in the fields — do not write these files from scratch.

Order of work after scaffolding:

1. **Type** — `packages/types/src/schema/<entity>.ts`: fields and enums.
2. **Model** — mirror the fields as columns.
3. **Migration** — mirror the same columns, plus indexes and foreign keys. A field with
   no column fails at runtime.
4. **Associations** — in `models/index.ts` inside `initAssociations()`.
5. **Validator** — the writable subset of the fields, `.strict()`.
6. **Repository** — `getSearchQuery`, plus any eager-load lists.
7. **Service** — business rules and events.
8. **Migrate** — `pnpm --filter @services/core db:migrate`.
9. **Backend tests** — `services/core/tests/api/<entity>.test.ts`,
   `tests/services/<entity>.service.test.ts`, and
   `tests/security/<entity>.security.test.ts` (mandatory — see
   `rules/testing/security-tests.md`).
10. **Playwright spec** — `frontend/web/e2e/<feature>.spec.ts` for the user-facing flow.
11. **Run and fix** — `pnpm test`, `pnpm build`, `pnpm lint`, `pnpm check-types`. Green
    before the change is done; fix the code, never weaken the test.

`user` → `IUser` is the reference implementation across all layers.

---

## Layer Diagram

```
routes → controllers → services → repositories → models
                                                    ↑
                                               (Sequelize)

components → query/mutation hooks → services (AbstractServices) → API
```

Cross-cutting, available to every layer through `@repo/backend`:

```
requestContext   correlation id · actor · channel · ambient transaction
eventBus         domain events, published after commit
errorHandler     the single place that turns a thrown error into a response
```

---

## Invariants — Never Break These

- **Always extend base classes**: controllers → `BaseController<T>`, services →
  `BaseServices<T>`, repositories → `BaseRepository<T>` (or
  `BaseVersionedRepository<T>`), frontend services → local `AbstractServices<T>`
- **Types live only in `@repo/types`** — never define an entity interface or enum in
  `services/core` or `frontend/web`
- **Named exports only** — `export default` is a lint error. Export the class plus a named
  singleton
- **Backend imports `@repo/types/lib/**`**, frontend imports `@repo/types/src/**`
- **Never query the DB from a controller or route** — routes → controllers → services →
  repositories
- **Sequelize, the connection and raw SQL appear only in the repository layer**
- **The schema comes from migrations** — `sequelize.sync()` is never called; every model
  column has a migration column
- **`paranoid: true` everywhere** — soft delete, never hard delete
- **Never accept `created_by`, `updated_by`, `deleted_by` or timestamps from a client** —
  they are stamped from the request context
- **Multi-write operations run in `runInTransaction`**; events publish after commit
- **Never call fetch/axios directly in a component** — always via a service + query hook
- **Use local `hooks/useQuery`** — never `@tanstack/react-query`'s `useQuery` directly
- **Components never import `mocks/` or a service** — mock data enters as a query hook's
  `defaultValue`
- **Frontend styling comes from `styles/tokens.css`** — no literal colours, and no
  webfont loaded from a CDN
- **`process.env` is read only in `src/config/env.ts`**
- **File suffixes are mandatory**: `*.controller.ts`, `*.service.ts`, `*.repository.ts`,
  `*.model.ts`, `*.routes.ts`, `*.validator.ts`, `*.middleware.ts`, `*.swagger.ts`,
  `*.test.ts` (vitest), `*.spec.ts` (playwright)
- **A feature is not done without tests** — every feature and every change to one ships
  backend tests plus a Playwright spec in the same commit, and both suites pass
- **Every new or changed endpoint has security tests** — auth, role, scope, mass
  assignment, injection, error hygiene (`rules/testing/security-tests.md`). Security cases
  must pass with no exceptions
- **Never `.skip`, `.only`, weaken an assertion or delete a test to get a green run** — fix
  the code; correct a test only when the test itself encodes the wrong expectation, and say
  so

---

## Custom Methods (extending base CRUD)

Add methods to the class; override a base method only when its behaviour genuinely
differs.

```typescript
// Backend service
class OrderService extends BaseServices<IOrder> {
  constructor() { super(orderRepository, { eventPrefix: "order" }); }

  getByOwner = async (ownerId: number) =>
    this.repository.getAll({ filter: { owner_id: { eq: ownerId } } });

  complete = async (id: number, note: string) =>
    this.runInTransaction(async () => {
      const order = await this.update(id, { status: OrderStatusEnum.COMPLETED, completion_note: note });
      eventBus.publishAfterCommit("order.completed", { order });
      return order;
    });
}

// Frontend service
export class OrderService extends AbstractServices<IOrder> {
  constructor() { super(`${API_BASE_URL}/orders`); }

  getByOwner = async (ownerId: string) =>
    this.http.get(`?owner=${ownerId}`).then(r => r.data.data);
}
```

---

## Architectural Enforcement (ESLint)

Violations are **hard lint errors** — CI fails. Run `pnpm lint`.

| File location | Forbidden | Reason |
|---|---|---|
| `src/controllers/**` | `../models/*`, `../repositories/*`, `sequelize`, `config/database` | Skip-layer violation |
| `src/services/**` | `../models/*`, `sequelize`, `config/database` | Skip-layer violation |
| `src/routes/**` | `../models/*`, `../repositories/*`, `../services/*`, `sequelize` | Routes → controllers only |
| `src/validators/**` | models, repositories, services, `sequelize` | Validators describe requests only |
| `src/models/**` | repositories, services, controllers | Models never call up the stack |
| all backend `src/**` | `export default`, `process.env`, `@repo/types/src/*` | Conventions above |
| `src/App.tsx`, `src/components/**`, `src/features/**` | `@tanstack/react-query`, `axios`, `../services/*.service` | Must use hooks |
| `src/queries/**`, `src/mutations/**` | `@tanstack/react-query`, `axios` | Must use local `hooks/useQuery` |

---

## Stop — Red Flags

If you are about to do any of the following, **stop and reconsider**:

- Defining a TypeScript interface or enum outside `packages/types/src/schema/`
- Writing a controller, service or repository without extending its base class
- Adding a model field without a migration
- Calling `sequelize.sync()`, or creating a table outside `src/database/migrations/`
- Importing a Sequelize model, `sequelize`, or `sequelize` itself outside a repository
- Writing `export default`
- Reading `process.env` outside `src/config/env.ts`
- Writing a `try/catch` in a controller to send an error response
- Constructing an `IAPIV1Response` by hand
- Publishing a domain event before the transaction commits
- Writing several rows without a transaction
- Hard-deleting a row, or hiding data by deleting rather than soft-deleting it
- Filtering scope in application code after the query instead of in the query
- Using `import { useQuery } from "@tanstack/react-query"` in a component or hook
- Calling `fetch()` or importing `axios` directly in a component
- Writing more than the standard registrations in a route file
- Returning an unpaginated collection
- Reporting a feature complete without running its tests, or with a failing one
- Adding a route, scope filter or validator without a security test
- Skipping, `.only`-ing, loosening or deleting a test so a run goes green
- Mocking the authorisation middleware or the scope filter that a security test verifies
- Writing a Playwright spec that selects by Tailwind class, or waits with
  `waitForTimeout`

---

## Conventions

| Thing | Convention |
|---|---|
| Variables / functions | `camelCase` |
| Classes / components / interfaces | `PascalCase` |
| Enums | `PascalCase` + `Enum` suffix (e.g. `OrderStatusEnum`) |
| Interfaces | `I` prefix (e.g. `IOrder`) |
| Constants | `UPPER_SNAKE_CASE` |
| Tables | plural `snake_case` (e.g. `order_items`) |
| Columns | `snake_case`; foreign keys `<entity>_id` |
| Routes | `kebab-case` plural (e.g. `/order-items`) |
| Migrations | `YYYYMMDDHHMMSS-<verb>-<table>.js` |
| Backend tests | `<resource>.test.ts`, security ones `<resource>.security.test.ts` |
| Playwright specs | `<feature>.spec.ts`, named after the `features/` folder |
| Domain events | dotted, past tense (e.g. `order.status.changed`) |
| Component files | `PascalCase.tsx` |
| Non-component TS files | `camelCase.ts` |

- Imports: library imports first, then local imports
- 2-space indentation, semicolons, trailing commas
- Comments explain *why*, not *what* — omit obvious comments
- Early returns to reduce nesting
- UTC in storage and transport; time zone is a rendering concern

---

## Response Contract

All API responses follow `IAPIV1Response<T>` from `@repo/types`:

```typescript
{
  version: "v1",
  success: boolean,
  data?: T,
  message?: string,
  errors?: string[],
  code?: string,                  // machine-readable reason on failures
  validationErrors?: Record<string, string[]>,
  meta?: { total?, limit?, skip?, nextCursor? },
  requestId?: string,
}
```

`BaseController` wraps via `v1Response()`; `errorHandler` builds the failure form. Never
construct either by hand. Status codes and `code` values: `rules/backend/api-contract.md`.

---

## Query Params

Collections take one JSON-encoded `query` parameter shaped as `IQueryStringParams`:
`q`, `filter`, `orderBy`, `order`, `limit`, `skip`, `cursor`, `expand`, `deleted`,
`updatedSince`. `jsonParseQueryParamsMiddleware` parses it into `req.query.query`;
`useQuery` serialises it on the frontend.

- `limit` → response carries `meta.total` (offset pagination)
- `cursor` → response carries `meta.nextCursor` (keyset pagination; what integrations use)
- `updatedSince` → delta retrieval for reconciling after downtime

---

## Design Defaults That Shape Code

Template defaults — keep them unless the project's requirements say otherwise:

- **Human-readable reference numbers** (e.g. `ORD-2026-000412`) are immutable, never
  reused, and collision-free under concurrency. Generate them in the database (sequence),
  not by reading a max value.
- **Audit / activity logs are append-only.** No role, including Admin, may edit or delete
  an entry. Never model one as a mutable row.
- **Ingestion from external sources is idempotent** — a retried delivery cannot create a
  second record. De-duplicate on the source's idempotency key.
- **Visibility is role ∩ scope** (e.g. organisation, team, owned resources). Enforce it in
  the query, on every path including search, exports, reports and aggregate counts.
- **Every state change is published as an event** so notifications, integrations and
  webhooks stay decoupled from the write path.
- **Configuration is data** where practical — statuses, templates, custom fields editable
  by an administrator without a deployment.
- **Assume long retention and large tables** — index and paginate accordingly.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
