# Configuration, Logging and Lifecycle

## Configuration

- All settings are read and validated once in `src/config/env.ts` with zod, and imported
  from there as `env`. Reading `process.env` anywhere else is a lint error: a missing or
  malformed value must stop startup, not surface as `undefined` inside a request.
- New setting = new field in the schema **and** a line in `.env.example`, with a sensible
  default for local development.
- Values that differ per environment are configuration; values that differ per tenant,
  team or record type are data and belong in the database, editable by an administrator without a
  deploy.
- Secrets are never committed and never logged. In deployed environments they come from
  Azure Key Vault via environment variables.
- `AUTH_MODE=dev` and `CORS_ORIGINS=*` are refused when `NODE_ENV=production`.

## Logging

- Log through `logger` from `src/config/logger.ts`. Shared code in `@repo/backend` logs
  through the same instance via `setLogger`. `console.log` is never used in `src/`.
- Every line carries the correlation id from the request context. Keep it: it is what
  links an inbound request to the job it triggered, the downstream calls it made and the
  events it published.
- Levels: `error` for faults needing attention, `warn` for rejected requests and expected
  failures, `info` for lifecycle and state changes, `debug` for diagnosis. `error` logs a
  stack; a 4xx does not.
- Never log tokens, secrets, full message bodies or attachment contents.

## Lifecycle

- `app.ts` composes the application and returns it. `server.ts` binds the port. Keep it
  that way — an app that listens on import cannot be tested or reused by a worker.
- Startup order: associations, database check, listen. A service that accepts requests
  before its schema is reachable reports failures as application errors.
- `SIGTERM`/`SIGINT` drain in-flight requests, then close the pool, with a timeout as the
  backstop. Planned maintenance must not drop accepted work.
- Health: `/api/v1/health` is liveness (process up), `/api/v1/health/ready` is readiness
  (dependencies reachable, answering 503 when not). An orchestrator restarts on the
  former and de-routes on the latter; conflating them turns a brief database blip into a
  restart loop.
