# /implement — Feature Implementation Orchestrator

Orchestrates a review-gated feature implementation by composing focused skills.
This skill owns: sequencing, approval gates, and worktree decisions.
Everything else is delegated to dedicated skills.

```
/story      → fetch / create / sync Jira story
/scaffold   → generate entity boilerplate
/review     → check code against standards
/commit-pr  → pre-commit review + commit + push + PR
```

> Why a skill, not an agent: this workflow has three user approval gates
> requiring multi-turn conversation with persistent state. Agents are
> single-shot and cannot resume between gates. Heavy codebase exploration
> is delegated to a subagent to keep the main context clean.

---

## Step 0 — Parse input ($ARGUMENTS)

| Input | Route |
|-------|-------|
| Issue key `PROJ-123` | Phase 1A — fetch existing story |
| Plain description | Phase 1B — implement directly, no story lookup |
| Empty | Print usage and stop |

Issue key pattern: `^[A-Z][A-Z0-9]+-\d+$`

---

## Phase 1A — Story from Jira

Invoke **/story {issue-key}** from $ARGUMENTS.

This fetches the issue from Jira, syncs `.ai/stories.md`, and returns
the full issue details. Use those details as the input to Phase 2.

---

## Phase 1B — Plain description (no issue key)

Do not search existing stories. Go straight to story creation.

Invoke **/story "{description}"** — this will:
1. Draft a user story using `.ai/helpers/user-story-strcuture.md`
2. Run review cycles with the user until approved
3. Create the story in Jira and return the new issue key
4. Add a row to `.ai/stories.md`

Use the returned issue key and story details as the input to Phase 2.
From this point, Phase 1B and Phase 1A are identical.

---

## Phase 2 — Analyse

Delegate codebase exploration to a subagent to protect main context:

> Subagent task: "Read CLAUDE.md. Search the codebase for files that would
> be created or modified to implement: [{requirements}]. Return specifically:
> new entities needed, files to modify, and any risks (breaking changes,
> missing migrations, etc.)."

Combine the Jira issue (or description) with the subagent findings.
Produce the implementation plan:

```
## Implementation Plan — {ID}: {Title}

### What this delivers
[2–3 sentences]

### Entities / data
| Entity | Action | Key fields |
|--------|--------|------------|
| Order | Create | user_id, status, total |

### Backend
- [ ] /scaffold Order
- [ ] /scaffold OrderItem
- [ ] OrderService.getByUser() custom method

### Frontend
- [ ] frontend/web/src/services/order.service.ts
- [ ] frontend/web/src/queries/useGetOrder.ts
- [ ] frontend/web/src/features/orders/OrdersPage.tsx

### Tests (not optional — `rules/testing/overview.md`)
- [ ] services/core/tests/api/orders.test.ts — contract + envelope
- [ ] services/core/tests/services/order.service.test.ts — rules, events
- [ ] services/core/tests/security/orders.security.test.ts — auth, role, scope,
      mass assignment, injection
- [ ] frontend/web/e2e/orders.spec.ts — happy path, empty, 422, 403, 500, per role

### Existing files to modify
- services/core/src/routes/index.ts (auto-handled by /scaffold)

### Risks
- ⚠ MEDIUM — [specific risk]
- ℹ LOW — [minor note]

### Assumptions
- [anything inferred]
```

---

## Gate 1 — Plan approval ⛔ STOP

> **Approve this plan?**
> `approve` · `change: [what]` · `cancel`

**On `change:`** — revise the plan. Check if the change has cascading impact:
> ⚠ Changing X also affects Y — [reason]. Still want this?
Return to Gate 1.

**On `cancel`** → stop.

---

## Phase 3 — Worktree check

Look for explicit phrases in the conversation: "use worktree", "new branch",
"in a worktree", "separate branch".

**Found** →
```bash
git worktree add ../{slug} -b feat/{slug}
```
All subsequent file writes go into that worktree path.
Print: `🌿 Working in worktree: feat/{slug}`

**Not found** → work in current directory.
Print: `📁 Working in current directory`

---

## Phase 4 — Implement

Execute in this order:

**1. New entities** — for each entity marked `Create` in the plan:
```
invoke /scaffold {EntityName}
```
After each scaffold, immediately fill in all fields — never leave TODO stubs.
Fill the type interface (`packages/types/src/schema/*.ts`) and model columns
(`services/core/src/models/*.model.ts`) based on the story requirements.

**2. Associations** — if entities reference each other, add Sequelize
associations to both model files.

**3. Custom backend logic** — service or repository methods beyond CRUD.

**4. Frontend** — create service files, query/mutation hooks, page + PageContent.

**5. Existing file edits** — modify any files already identified in the plan.

**6. Tests** — backend tests and the Playwright spec for every endpoint and flow
touched, following `rules/testing/backend-tests.md`,
`rules/testing/security-tests.md` and `rules/testing/playwright-e2e.md`. Security
cases are mandatory for any new or changed route, validator, scope filter or
authorisation check. If the test tooling is not installed yet, add it
(`vitest` + `supertest`, `@playwright/test`, a `test` task in `turbo.json`).

While writing, silently apply /review checks to every file. Fix violations
before reporting — do not surface internal correction cycles to the user.

❌ Do not run `git add`, `git commit`, or `git push`.

---

## Phase 5 — Validate ⛔ must be green before Gate 2

```bash
pnpm --filter @services/core test
pnpm --filter @frontend/web test:e2e
pnpm build && pnpm lint && pnpm check-types
```

On a failure: read the actual output, fix the cause, re-run. Loop until every
command passes. Never `.skip`, `.only`, loosen an assertion or delete a test to
get a green run — correct a test only when the test itself encodes the wrong
expectation, and say so in the Gate 2 report.

If something genuinely cannot pass (e.g. a DB-gated suite with no PostgreSQL
available), report it explicitly at Gate 2 with the command and its output. Do
not present a skipped suite as a pass.

---

## Gate 2 — Local review ⛔ STOP

```
## Changes Ready for Your Review

**{ID}**: {Title}

### Created
- [list every new file with path]

### Modified
- [list every modified file with what changed]

### API endpoints added
  GET|POST         /api/v1/{plural}
  GET|PUT|DELETE   /api/v1/{plural}/:id

### Tests
- [list every test file, with what it covers]
- Security cases covered: {auth · role · scope · mass assignment · injection · …}

### Validation
  ✅ pnpm --filter @services/core test      {n} passed, {n} skipped ({why})
  ✅ pnpm --filter @frontend/web test:e2e   {n} passed
  ✅ pnpm build · pnpm lint · pnpm check-types
  [any failure here is reported verbatim, not summarised as "done"]

### Still needed (manual steps)
  ⚠ DB migration for: {table names}

---
Nothing has been committed. Review locally and tell me:
· `approved` → I'll commit and open the PR
· `change: [what]` → I'll make the change and ask you to review again
```

**On `change:`** → make the changes. Reprint the report. Return to Gate 2.
Never commit between cycles.

---

## Gate 3 — Commit approval ⛔ STOP (only if Gate 2 response is `approved`)

Invoke **/commit-pr {issue-key-or-slug}**

This skill handles: pre-commit /review, named git add, commit message,
push, and PR creation.

After /commit-pr completes, print the PR URL.

**Mark the story as Done in both places:**

1. Jira — call `transitionJiraIssue` to move the issue to Done status:
   - First call `getTransitionsForJiraIssue` to find the correct transition ID for "Done"
   - Then call `transitionJiraIssue` with that ID
   - Print: `✅ Jira {ISSUE-KEY} marked as Done`

2. Local replica — update `.ai/stories.md`: change the Status cell for
   this issue's row from its current value to `Done`. Write the file.
   Print: `✅ Local replica updated → Done`

---

## Skill map (what this orchestrator calls)

```
/implement
  ├── /story          (Phase 1A — fetch/sync existing Jira issue)
  ├── /story          (Phase 1B — draft → review → create in Jira)
  ├── subagent        (Phase 2  — codebase exploration)
  ├── /scaffold ×N    (Phase 4  — new entity boilerplate)
  ├── /review         (Phase 4  — silent validation while writing)
  ├── tests + suites  (Phase 5  — vitest, playwright, build/lint/types — must be green)
  └── /commit-pr      (Gate 3   — commit + PR + mark Done in Jira + replica)
```

Each of these skills can also be used independently without /implement.
