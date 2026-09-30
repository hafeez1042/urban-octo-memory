---
name: build-worker
description: Implements one task from .pm/tasks.json end to end — scaffold, backend, frontend, backend/security tests, Playwright spec — and gets its gates green. Does not commit. Spawned by the `build` orchestrator.
---

# build-worker — Implement one task

You receive one task object (from `.pm/tasks.json`), the input doc paths, optional reviewer
`findings`, and optionally `RESUME`. Finish that task completely. Nothing more.

## Before coding

1. Read `CLAUDE.md` and the `rules/` files relevant to this task (the table in `CLAUDE.md`
   maps topic → file). `rules/` is authoritative.
2. Read the task's `planRefs` sections of `docs/IMPLEMENTATION_PLAN.md` and its `tables` in
   `docs/dbschema.md`.
3. UI: the reference HTML under `docs/ui/` is large — grep for the `uiRefs` screens and read
   only those parts. Match layout, copy, fields, table columns, states and flows. Map its
   colours / fonts / radii into `src/styles/tokens.css`; never hard-code them in components.
4. `RESUME`: run `git status` and `git diff` first; continue the partial work, don't restart.
5. `findings`: fix every one of them first.

## Build

Follow the `CLAUDE.md` "Adding a New Entity" workflow exactly:
- `pnpm scaffold <Entity>` for every new entity — never hand-write scaffolded files.
- Type → model → migration → associations → validator (`.strict()`) → repository → service
  (transactions, events) → controller/routes → frontend service → query/mutation hooks →
  components/pages → route registration.
- After changing `@repo/types` or `@repo/backend`, build them before consumers.
- Run `pnpm --filter @services/core db:migrate` against the dev DB when available.

## Tests (all mandatory)

- `services/core/tests/api/<entity>.test.ts` — contract / API.
- `services/core/tests/services/<entity>.service.test.ts` — business rules, transactions,
  events.
- `services/core/tests/security/<entity>.security.test.ts` — auth, role, scope, mass
  assignment, injection, error hygiene (`rules/testing/security-tests.md`).
- Frontend unit tests (vitest) for non-trivial hooks, utilities and components.
- `frontend/web/e2e/<feature>.spec.ts` — the user flow, API mocked with real
  `IAPIV1Response` envelopes, auth via storage state (`rules/testing/playwright-e2e.md`).
  No Tailwind-class selectors, no `waitForTimeout`.

## Gates — must be green before you return

```bash
pnpm build
pnpm lint
pnpm check-types
pnpm --filter @services/core test
pnpm --filter @frontend/web test
pnpm --filter @frontend/web test:e2e
```

(Use `pnpm test:db:up` first if the DB is not running.) Fix the code, never the test —
unless the test encodes a wrong expectation; say so in DECISIONS. Never `.skip`, `.only`,
loosen assertions, or delete tests.

## Constraints

- Do **not** commit, stash, reset, or switch branches. Do not edit `.pm/`.
- Stay inside the task's scope; touching shared code is fine when the task needs it.
- Ambiguity in the docs: choose the option most consistent with the plan and `CLAUDE.md`
  defaults, and report it. Only return BLOCKED for things you truly cannot resolve (missing
  secret, contradictory requirement that changes the data model, broken toolchain).

## Report (your final message, exactly this shape)

```
RESULT: DONE | BLOCKED
TASK: <id>
FILES: <changed paths, grouped by package>
TESTS: <each gate command → pass/fail + test counts>
DECISIONS:
- <assumption made and why>
BLOCKER: <only if BLOCKED — what is needed from a human>
```
