# /commit-pr — Commit and Create PR

Runs a pre-commit review, stages changed files, commits, pushes, and opens
a PR. Works standalone (after any manual changes) or when called by /implement.

$ARGUMENTS (optional): extra context for the commit message, e.g. an issue key
like `PROJ-123` or a short description override.

---

## Step 1 — Pre-commit review

Invoke the /review skill on all currently changed files (staged + unstaged).

- If /review finds **errors (🔴)** → fix them silently, then report:
  `🔧 Fixed {N} violation(s) before committing.`
- If /review finds only **warnings or info** → report count, proceed.
- If clean → `✅ Review passed.`

Do not proceed to commit if errors remain unfixed after one fix attempt.
In that case, report the remaining errors and stop — ask the user to resolve them.

---

## Step 1b — Test gate ⛔

```bash
pnpm --filter @services/core test
pnpm --filter @frontend/web test:e2e
pnpm build && pnpm lint && pnpm check-types
```

- All green → `✅ Tests passed.` and continue.
- A failure → fix the cause and re-run, once. Still failing → print the command and its
  real output and **stop**. Do not commit a red suite.
- Never `.skip`, `.only`, loosen an assertion or delete a test to reach green.
- A suite skipped for a missing prerequisite (e.g. `TEST_DATABASE_URL`) is reported as
  skipped with the reason, never as passed.

---

## Step 2 — Determine branch

Run `git branch --show-current`.

- If already on a feature branch (not `main` or `master`) → use it.
- If on `main`/`master` → create a branch:
  - If $ARGUMENTS contains an issue key → `feat/{issue-key-slug}`
  - Otherwise → `feat/{short-description-slug}` derived from changed file names
  - Run: `git checkout -b {branch-name}`

---

## Step 3 — Stage files

Run `git status --porcelain` to get the list of changed files.
Stage each changed file **by name** — never use `git add .` or `git add -A`.

```bash
git add path/to/file1 path/to/file2 ...
```

Print the list of staged files.

---

## Step 4 — Commit

Run `git log --oneline -5` to understand the repo's commit message style.

Build the commit message:
- **Scope**: infer from the changed files (e.g. `order`, `auth`, `frontend`)
- **Type**: `feat` for new code, `fix` for bug fixes, `refactor` for restructuring
- **Body**: what was implemented and why (2–4 lines)
- **Issue**: if $ARGUMENTS contains an issue key, add `Implements: {KEY}`

```bash
git commit -m "feat({scope}): {short description}

{body}

{Implements: ISSUE-KEY if provided}
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Step 5 — Push and PR

```bash
git push -u origin {branch}
```

Then create the PR:
```bash
gh pr create \
  --title "feat: {title}" \
  --base main \
  --body "..."
```

PR body must include:
- **Summary**: what was built (3–5 bullet points)
- **Issue**: link to the Jira issue if $ARGUMENTS contains a key
- **Test plan**: checklist of what to verify manually
- Generator credit

---

## Step 6 — Report

Print the PR URL wrapped in `<pr-created>` tags.

If called by /implement → return the PR URL to the orchestrator.
