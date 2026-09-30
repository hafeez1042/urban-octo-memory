# Backend Tests

Every endpoint, service rule and repository query added or changed ships with tests in the
same commit. Security cases are mandatory and specified in
`rules/testing/security-tests.md`.

## Layout

```
services/core/
  vitest.config.ts
  tests/
    setup.ts                  # env defaults, requestContext helpers, fake reset
    helpers/
      app.ts                  # supertest client over the app from src/app.ts
      actor.ts                # signed-in actor per role/scope, via AUTH_MODE=dev
      fakes.ts                # in-memory repository fakes
    api/
      orders.test.ts          # one file per resource — the HTTP contract
    services/
      order.service.test.ts   # business rules, transactions, events
    security/
      orders.security.test.ts
```

## Tiers

**Contract tests (always run).** Drive `app` with supertest, with the repository layer
replaced by an in-memory fake. They need no PostgreSQL, so they run everywhere and are the
tier that must never be skipped. They assert:

- status code and the full `IAPIV1Response` shape — `success`, `data`, `meta`, `code`,
  `requestId` — never just the payload;
- `validationErrors` for each rejected field, and that an unknown field is rejected because
  the validator is `.strict()`;
- collections are paginated: `meta.total` with `limit`, `meta.nextCursor` with `cursor`,
  and that an unpaginated collection is never returned;
- `created_by`, `updated_by`, `deleted_by` and timestamps sent by a client are ignored, and
  the stamped values come from the request context;
- delete is soft — the row is still readable with `deleted: true` and absent without it.

**Service tests (always run).** Call the service directly with a fake repository inside a
`requestContext.run(...)`. They assert the rules, not the wiring: state transitions,
multi-write work happening in one `runInTransaction`, events published **after** commit and
not at all on rollback, and that a domain rule violation throws the typed error the
`errorHandler` maps.

**Database tests (gated).** Anything that only a real engine can prove — a unique
constraint, the reference-number generator under concurrency, a raw query, a migration's
`up`/`down`. Guard the file with `describe.skipIf(!process.env.TEST_DATABASE_URL)` and read
that variable in the test setup, not in `src/`. There is no local PostgreSQL in the usual
dev environment, so these skip by default; never move contract or security coverage into
this tier to avoid writing it.

## Rules

- Test through the public surface: routes for a controller, the service method for a rule.
  Do not reach into a private method.
- Install the fake with `installFakeRepository(<entity>Repository, fake)` from
  `tests/helpers/fakes.ts` and restore it in `afterEach`. It assigns over the singleton's
  prototype methods, which is what a module mock cannot do from a shared helper. Spy on
  the **repository singleton**, not on the fake object: the installed methods are bound at
  install time, so a spy added to the fake afterwards is never called.
- Seed the acting user's row (`ACTOR_ROWS`) before asserting on a collection. Otherwise
  just-in-time provisioning creates it mid-request and the row count moves under the test.
- No `sequelize.sync()`, no test that creates a table. The schema comes from migrations.
- Fake at the repository boundary, not at `sequelize`. A test that mocks Sequelize asserts
  the ORM, not the feature.
- Reset all fakes and the event bus between tests; no ordering dependency between files.
- Assert on the emitted event name and payload for every state change — events are the
  integration point for notifications, background jobs and webhooks.
- Deterministic time: inject or freeze the clock. Never assert against `new Date()` taken
  inside the test, and never let a due-time assertion depend on wall-clock arithmetic.
- Every test that touches a scoped resource declares which actor and scope it runs as. An
  unscoped test proves nothing about visibility.

## Fixing failures

Run the failing file alone, read the actual assertion diff, then fix the cause. Do not
weaken an assertion, widen a type, or add a conditional to a test to make it pass. If the
test is wrong, say so explicitly in the commit message and correct it.
