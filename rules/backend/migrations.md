# Migrations (Sequelize CLI + PostgreSQL)

The schema is owned by migrations. `sequelize.sync()` is never called: an inferred
schema cannot be reviewed, replayed on another environment, or rolled back, and
production data cannot be recreated if it drifts.

## Layout

```
services/core/
  .sequelizerc                     # points the CLI at the paths below
  src/database/
    config.js                      # CLI connection config (reads the same env vars as runtime)
    helpers/baseColumns.js         # shared column sets — id, audit, soft delete, version
    migrations/                    # YYYYMMDDHHMMSS-<verb>-<table>.js
    seeders/                       # reference data, idempotent
```

## Commands

```bash
pnpm --filter @services/core db:migrate           # apply pending
pnpm --filter @services/core db:migrate:status    # what is applied / pending
pnpm --filter @services/core db:migrate:undo      # roll back the last one
pnpm --filter @services/core db:seed              # run seeders
pnpm --filter @services/core migration:create add-status-to-orders
```

## Rules

- **One migration per change, never edited after it is merged.** An applied migration is
  history; a correction is a new migration.
- **Every migration has a working `down`.** A release with no rollback path is not
  releasable. `down` on a create is `dropTable` plus dropping any Postgres enum type the
  table created (`DROP TYPE IF EXISTS "enum_<table>_<column>"`), which the table drop
  leaves behind.
- **Use `helpers/baseColumns.js`** for `id`, `created_by`/`updated_by`/`created_at`/
  `updated_at`, `deleted_at`/`deleted_by` and version columns. Audit columns must be
  identical across tables — cross-entity reporting joins on them.
- **Model and migration are one change.** Adding a field means: type in `@repo/types`,
  column in the model, column in a migration. A model field with no column fails at
  runtime; a column with no model field is invisible.
- **Actor foreign keys** reference `users.id` with `ON DELETE SET NULL`. Never cascade:
  a purged user must not take record history with them.
- **Index what you filter and sort by**, plus `deleted_at` on every paranoid table —
  every read carries `deleted_at IS NULL`.
- **Unique constraints on soft-deleted tables are partial:** `WHERE deleted_at IS NULL`,
  so a deleted row does not reserve the value forever.
- **Backfills are separate from schema changes.** Add the column nullable, backfill in
  its own migration, then tighten to `NOT NULL` — a long backfill inside a DDL migration
  holds locks on a table the service is still serving.
- Migrations are plain CommonJS, run by the CLI outside TypeScript. They are excluded
  from `tsconfig` and from the layer lint rules.
