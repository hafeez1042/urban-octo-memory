# Testing — Definition of Done

Tests are part of a feature, not a follow-up task. A feature or a change to an existing
feature is **not done** until:

1. Backend tests cover the new or changed endpoints, including the security cases in
   `rules/testing/security-tests.md`.
2. A Playwright spec covers the user-visible behaviour — see
   `rules/testing/playwright-e2e.md`.
3. Both suites **pass**, together with `pnpm build`, `pnpm lint` and `pnpm check-types`.

A failing test is a defect in the change, not an inconvenience. Fix the code — or the test
if the test encodes the wrong expectation — and run it again. Never finish by reporting a
failure you did not investigate, never `.skip`, `.only`, comment out or loosen an assertion
to get a green run, and never delete a test because it broke.

## Tooling

| Layer | Runner | Location |
|---|---|---|
| Backend unit + API integration | Vitest + supertest | `services/core/tests/**/*.test.ts` |
| Shared packages | Vitest | `packages/*/tests/**/*.test.ts` |
| Frontend end-to-end | `@playwright/test` | `frontend/web/e2e/**/*.spec.ts` |

`*.test.ts` is always Vitest; `*.spec.ts` is always Playwright. Do not mix the two
suffixes — the runners select files by them.

## Commands

```bash
pnpm test                                   # turbo run test — everything CI runs
pnpm --filter @services/core test           # backend, watch off
pnpm --filter @services/core test -- <name> # single backend file or pattern
pnpm --filter @frontend/web test:e2e        # Playwright, headless
pnpm --filter @frontend/web test:e2e -- --ui         # local debugging only
pnpm --filter @frontend/web test:e2e -- e2e/orders.spec.ts
```

The tooling is already installed: `vitest` + `supertest` in `services/core`,
`@playwright/test` in `frontend/web`, and a `test` task in `turbo.json`. A new workspace
package that needs tests adds `vitest` and a `test` script the same way.

Two configuration decisions are load-bearing; do not undo them:

- `services/core/vitest.config.ts` marks `@repo/*` as **external** deps. Loaded through
  Vite instead, the shared modules exist twice — and the second copy has its own
  `AsyncLocalStorage`, so `requestContext` reads empty inside `@repo/backend` and every
  actor, event and transaction assertion silently fails.
- `frontend/web/playwright.config.ts` serves on its own port with
  `reuseExistingServer: false`. Reusing a developer's `vite preview` would serve a bundle
  built without `VITE_ENABLE_API`, where the app never calls the API at all — every
  mocked-response assertion would pass against in-bundle mock data.

## What each layer owns

- **Backend tests** own contract and rules: status codes, the `IAPIV1Response` envelope,
  validation rejections, authorisation, scope, transactions, events, idempotency.
- **Playwright specs** own what the user does: navigation, forms, optimistic states, error
  surfaces, empty states, and that the page renders what the API returned.
- Do not restate backend authorisation logic in Playwright, and do not assert pixel styling
  in either layer. Assert behaviour.

## Environment constraints

No test may depend on a hand-seeded local database, a live Entra ID tenant, or a network
call to a third party. Every suite must pass on a clean checkout with `pnpm install` and
nothing else running. Suites that genuinely need PostgreSQL are gated as described in
`rules/testing/backend-tests.md`; a gated suite that skips still leaves the ungated
security and contract coverage mandatory.
