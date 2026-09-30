---
name: repo-risk-analysis
description: Repo-specific risk checklist for this app-template monorepo (Express API + Sequelize migrations + shared Zod contracts + React/Vite web). Use together with the general risk-analysis skill whenever assessing whether a change in this repo is safe to merge, ship, or deploy — "risk analysis", "what could break", "safe to merge?", "impact of this change", "pre-merge check" — so findings reflect this repo's layer rules, migration policy, and shared-package blast radius.
---

# Repo Risk Checklist (app-template)

Run the general `risk-analysis` workflow (target → blast radius → categories → score → report). Add these repo-specific checks; they encode where this monorepo actually breaks.

## Blast radius by location

| Changed path | Radius | Why |
|---|---|---|
| `packages/types/src/**` | Large | Consumed by both `services/core` and `frontend/web`. A schema/contract change can break API validation and the web client at once. Grep both consumers. |
| `packages/backend/src/**` | Large | Base controller/service/repository, errors, middleware used by every backend slice. |
| `packages/eslint-config`, `packages/typescript-config`, `turbo.json`, `pnpm-workspace.yaml` | Large | Affects every package's build/lint. |
| `services/core/src/config/env.ts`, `packages/types/src/env.ts` | Large | `env.ts` throws on boot if schema fails — a new required var without default crashes the API in any environment that lacks it. Check `.env.example` updated. |
| `services/core/migrations/**` | Data | See migration checks. |
| `services/core/src/**` slice files | Medium | One entity's route → controller → service → repository → model chain. |
| `frontend/web/src/features/<domain>` | Small | Leaf, unless it edits shared hooks/services. |
| `Dockerfile`, `docker/`, `docker-compose*.yml`, `.github/workflows/ci.yml` | Deploy | Can break build or deploy without failing tests. |

## Repo-specific checks

- **Migrations**: new file is timestamped, has a working `down` that truly reverses `up`, no destructive op without a data plan. Flag any `sequelize.sync()` as 🔴 — forbidden here.
- **Layer boundaries**: routes/controllers must not import models or query Sequelize directly; business decisions belong in `services/core/src/policies`; frontend components call hooks → hooks call services → only services touch HTTP clients. Violations are 🟡 unless they bypass validation/auth (then higher).
- **Cross-boundary imports**: frontend importing server-only code, or API importing frontend code → 🟠 (bundle leaks, build breaks).
- **Contracts**: request/response changes in `packages/types/src/contracts` must be mirrored in the `validate` middleware usage and the web service layer. Removing/renaming a field or tightening a Zod schema is a breaking change for existing clients.
- **Route registration**: a router newly added to `services/core/src/routes/index.ts` makes the API require a DB connection (the starter is health-only). Check `DATABASE_URL` handling and deploy config. `ExampleTask` is intentionally unregistered — registering it unmodified is a risk.
- **Env access**: any `process.env` read outside `services/core/src/config/env.ts` → 🟡.
- **Secrets/data**: committed `.env`, real URLs, customer data, logs → 🔴.
- **Tests**: changed backend slice without a spec beside it; changed feature without a frontend test.
- **Auth**: repo has no auth by default (`authorization.middleware.ts` exists but is opt-in). A new endpoint that mutates data with no authorization is worth flagging in the report as a deploy-context risk.

## Verification commands

Run the narrowest relevant check first, then the CI set if risk warrants it:

```sh
pnpm --filter <pkg> test
pnpm check-types
pnpm lint
pnpm test
pnpm build
```

For migration changes, if Docker is available: `pnpm test:db:up && pnpm db:migrate`, then undo-migrate to confirm `down` works, then `pnpm test:db:down`. Report which checks ran and their result in the report; say explicitly if a check was skipped.
