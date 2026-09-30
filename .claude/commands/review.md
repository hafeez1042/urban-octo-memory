Review the changed code in this project against the coding standards defined in CLAUDE.md and the rules/ directory. Produce a structured, actionable review.

## What to review

Determine scope in this order:
1. If $ARGUMENTS is a file path or glob — review only those files
2. If there are **staged changes** (`git diff --cached --name-only`) — review those
3. If there are **unstaged changes** (`git diff --name-only`) — review those
4. Otherwise — review all commits on this branch vs main (`git diff main...HEAD --name-only`)

If no changes are found, report: "Nothing to review — working tree is clean and branch is up to date with main."

## How to gather the code

1. Run `git diff --cached --name-only` and `git diff --name-only` to list changed files.
2. For each changed `.ts` / `.tsx` file:
   - Run `git diff HEAD -- <file>` (or `git diff --cached -- <file>` for staged) to see what changed
   - Read the **full file** with the Read tool — diff alone is not enough context to review correctly
3. Skip: `*.md`, `*.json`, `*.css`, lock files, `dist/`
4. For TEST-1/2/3, also list what tests exist for the changed code — the changed-file list
   alone cannot show a *missing* test:
   ```bash
   ls services/core/tests/api services/core/tests/services services/core/tests/security
   ls frontend/web/e2e
   ```
   Read the test files that cover the changed resource, or record that none exist.

## Checks to perform

For every changed file, check ALL of the following that apply. Be precise — reference the exact line number and the exact code.

---

### ARCH-1 — Layer violations (backend: `services/core/src/`)

| If file is in… | Must NOT import from… |
|---|---|
| `controllers/` | `../models/*` · `../repositories/*` · `sequelize` · `config/database` |
| `services/` | `../models/*` · `sequelize` · `config/database` |
| `routes/` | `../models/*` · `../repositories/*` · `../services/*` · `sequelize` |
| `validators/` | models · repositories · services · `sequelize` |
| `models/` | repositories · services · controllers |

Severity: **error**

---

### ARCH-2 — Missing base class extension

| File type | Must extend |
|---|---|
| `*.controller.ts` | `BaseController<T>` from `@repo/backend` |
| `*.service.ts` (backend) | `BaseServices<T>` from `@repo/backend` |
| `*.repository.ts` | `BaseRepository<T>` or `BaseVersionedRepository<T>` from `@repo/backend` |
| `*.service.ts` (frontend `src/services/`) | `AbstractServices<T>` from local `src/lib/AbstractService` |

Severity: **error**

---

### ARCH-3 — Types defined in the wrong package

Any `interface I*` or `enum *Enum` declared inside `services/core/` or `frontend/web/` (outside `packages/types/src/schema/`) is a violation. Types belong exclusively in `@repo/types`.

Severity: **error**

---

### ARCH-4 — Frontend data access violations

- `@tanstack/react-query` imported directly in `src/App.tsx`, `src/components/**`, or `src/features/**` → must use local `src/hooks/useQuery`
- `axios` imported directly in `src/App.tsx`, `src/components/**`, `src/features/**`, `src/queries/**`, or `src/mutations/**`
- A service (e.g. `userService.getAll()`) called directly inside a component body → must go through a hook in `src/queries/` or `src/mutations/`

Severity: **error**

---

### ARCH-5 — Wrong export style

- `export default` anywhere → must be a named export
- A backend `*.service.ts` / `*.repository.ts` / `*.controller.ts` that exports the class
  but no named singleton (`export const orderService = new OrderService()`)
- A class/component file with no export at all

Severity: **error**

---

### ARCH-8 — Schema changes without a migration

- A column added to or removed from a `*.model.ts` with no matching change in
  `services/core/src/database/migrations/`
- `sequelize.sync()` called anywhere
- A migration edited rather than superseded by a new one (check the diff: an applied
  migration is history)
- A migration with no working `down`, or a `createTable` whose `down` leaves the Postgres
  enum type behind
- An association declared in a model file instead of `models/index.ts`

Severity: **error**

---

### ARCH-9 — Transaction and event handling

- Two or more repository writes in one service method with no `runInTransaction`
- `eventBus.publish` used for a state change that must be announced only after commit
  (`publishAfterCommit`)
- An external call (Graph, SMTP, webhook) made inside a transaction
- A domain event name that is not dotted past tense

Severity: **error**

---

### ARCH-10 — Request handling and context

- A write endpoint with no zod validator on the route, or a write schema without `.strict()`
- A validator accepting `created_by`, `updated_by`, `deleted_by`, `created_at`,
  `updated_at` or another system-owned field
- `process.env` read outside `src/config/env.ts`
- `IAPIV1Response` constructed by hand instead of `v1Response()`
- `try/catch` in a controller that sends an error response
- An actor threaded through function parameters instead of read from `requestContext`
- Backend code importing `@repo/types/src/**` instead of `@repo/types/lib/**`
- A collection endpoint or query with no pagination on a table expected to grow

Severity: **error**

---

### TEST-1 — Missing tests for the change

Rules: `rules/testing/overview.md`, `backend-tests.md`, `playwright-e2e.md`.

- A new or changed endpoint, service rule or repository query with no `*.test.ts` in
  `services/core/tests/`
- A new or changed feature in `frontend/web/src/features/**` with no matching
  `frontend/web/e2e/<feature>.spec.ts`
- A test asserting only the payload instead of the full `IAPIV1Response` envelope
- A collection test that does not assert `meta.total` / `meta.nextCursor`
- A service test that does not assert the event published after commit
- A Playwright spec missing the 422, 403 or 500 path, or selecting by Tailwind class, or
  using `waitForTimeout`

Severity: **error**

---

### TEST-2 — Missing or defeated security tests

Rules: `rules/testing/security-tests.md`. This is the highest-value check in the review —
a scope leak passes build, lint and every happy-path test.

- A new or changed route, validator, capability check or scope filter with no
  `services/core/tests/security/<resource>.security.test.ts` case
- No case for: missing/expired token → 401; missing capability → 403; out-of-scope record
  → 404/403; out-of-scope collection → in-scope rows **and** in-scope `meta.total`
- No case asserting client-supplied `role`, `organisation_id`, `created_by`, `id` or
  timestamps are ignored
- No case for injection payloads in `q`, `filter`, `orderBy`, `expand`
- A security test that mocks the authorisation middleware or the scope filter it verifies
- A refusal asserted by status code only, without asserting the data is absent
- Search, export, report or aggregate endpoints not covered under a restricted actor

Severity: **error**

---

### TEST-3 — Defeated or disabled tests

- `.skip`, `.only`, `test.fixme`, a commented-out test, or a deleted test in the diff
- An assertion loosened (`toBeTruthy` replacing a value check, a removed field assertion,
  a widened type) to make a failing test pass
- A retry, an added timeout or a conditional inside a test that hides a flake
- A previously ungated test moved behind `TEST_DATABASE_URL` so it stops running

Severity: **error** — flag it and state what was removed or weakened.

---

### ARCH-6 — File placement and suffix

- A controller not in `services/core/src/controllers/` or not named `*.controller.ts`
- A service not in the correct `services/` folder or not named `*.service.ts`
- A repository not named `*.repository.ts`
- A model not named `*.model.ts`
- A route file not named `*.routes.ts`
- A validator not in `services/core/src/validators/` or not named `*.validator.ts`
- A middleware not named `*.middleware.ts`
- Swagger annotations in a route file instead of `src/swagger/*.swagger.ts`
- A migration outside `services/core/src/database/migrations/` or not named
  `YYYYMMDDHHMMSS-<verb>-<table>.js`
- A frontend query hook not in `src/queries/` or not named `use*.ts`
- A frontend mutation hook not in `src/mutations/` or not named `use*.ts`

Severity: **warning**

---

### ARCH-7 — Feature structure (frontend `src/features/**`)

- Feature UI is placed directly in `src/features/<feature>/<Feature>Page.tsx`
- Feature-specific components live beside the feature in `components/`
- Query/mutation hooks belong in `src/queries/` or `src/mutations/`, not in `App.tsx`

Severity: **warning**

---

### CONV-1 — Naming conventions

| Symbol | Required convention | Examples |
|---|---|---|
| Variables / functions | `camelCase` | `getUserById`, `isLoading` |
| Classes / components | `PascalCase` | `UserService`, `UserCard` |
| Interfaces | `I` prefix + PascalCase | `IUser`, `IOrder` |
| Enums | PascalCase + `Enum` suffix | `UserStatusEnum` |
| Constants (global) | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `API_BASE_URL` |
| Component files | `PascalCase.tsx` | `UserCard.tsx` |
| Non-component TS files | `camelCase.ts` | `user.service.ts`, `useGetUsers.ts` |
| Feature directories | `kebab-case` | `src/features/user-profile/` |

Flag: wrong prefix/suffix/case on a symbol that is **defined** in the changed code (not just used).

Severity: **warning**

---

### CONV-2 — Import order

Library imports must come before local imports. Flag if local imports appear above library imports.

Severity: **info**

---

### CONV-3 — Comment quality

Flag comments that describe *what* the code does rather than *why*. Examples of bad comments:
- `// increment counter` above `count++`
- `// call userService.getAll` above `userService.getAll()`

Flag commented-out code blocks (`// const old = ...`).

Severity: **info**

---

### CONV-4 — Magic numbers / strings

Inline numeric or string literals used in logic (not in type definitions or Sequelize column definitions) without a named constant.

Severity: **info**

---

### CONV-5 — Function complexity

Functions longer than ~30 lines or with nesting deeper than 3 levels. Suggest extracting to helper functions.

Severity: **info**

---

### CONV-6 — Singleton pattern (backend)

Backend controller, service and repository files must export the class **and** a named
singleton instance:
```ts
export class UserService extends BaseServices<IUser> { /* … */ }
export const userService = new UserService();
```
Flag a file that exports only the class, and flag any `export default`.

Severity: **error**

---

## Output format

Use this exact structure:

```
## Code Review

**Scope**: <staged changes / unstaged changes / branch vs main / specific files>
**Files reviewed**: N

---

### Violations  🔴  (must fix before merge)

> **[ARCH-1]** `services/core/src/controllers/order.controller.ts:14`
> Controller imports Sequelize model directly: `import Order from "../models/order.model"`
> **Fix**: Remove the import. Access data via `orderService` which calls `orderRepository` internally.

> **[ARCH-3]** `services/core/src/services/order.service.ts:3`
> Interface `IOrderItem` defined inside services/core — types must live in `packages/types/src/schema/`
> **Fix**: Move `IOrderItem` to `packages/types/src/schema/order.ts` and import it here.

---

### Warnings  🟡  (should fix)

> **[ARCH-5]** `frontend/web/src/components/UserCard.tsx:1`
> `export default` used on a component
> **Fix**: Change to `export const UserCard = ...`

---

### Info  🔵  (consider fixing)

> **[CONV-2]** `services/core/src/services/order.service.ts:2`
> Local import `../repositories/order.repository` appears before library import `sequelize`
> **Fix**: Move library imports to the top

---

### Passed ✅

List the checks that passed (one line each):
- ARCH-1: No layer violations found
- ARCH-2: All classes extend correct base class
- CONV-1: Naming conventions followed throughout
- ...

---

### Summary

| Severity | Count |
|---|---|
| 🔴 Violations (errors) | N |
| 🟡 Warnings | N |
| 🔵 Info | N |

**Verdict**: PASS / NEEDS WORK / BLOCKED
- PASS — no errors, warnings are minor
- NEEDS WORK — has warnings or info items worth addressing
- BLOCKED — has one or more errors that must be fixed before merging
```

## Important rules for the review

- **Only flag code that is in the diff** — do not report issues in unchanged lines.
  TEST-1 and TEST-2 are the exception: a *missing* test file is never in the diff, so a
  changed endpoint or feature with no covering test is flagged as an error even though
  nothing was written there.
- **Read the full file** before flagging — a violation may be justified by context elsewhere in the file
- **Be specific** — always include file path, line number, the exact offending code, and a concrete fix
- **Do not flag TODO comments** left by the scaffolder (`// TODO: add fields`) — these are intentional stubs
- **Do not invent violations** — if you are not certain something is wrong, do not flag it
- If a file is new (scaffolded), only flag issues in lines the developer actually filled in, not the generated skeleton
