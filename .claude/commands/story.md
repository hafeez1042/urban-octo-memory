# /story — Story Writer

Creates, fetches, and manages Jira stories. Works standalone or when called
by the /implement orchestrator.

---

## Parse input ($ARGUMENTS)

| Input | Action |
|-------|--------|
| Issue key (`PROJ-123`) | Fetch from Jira, display, sync replica |
| Plain description | Draft new story, review cycle, create in Jira |
| Empty | Show .ai/stories.md table |

---

## MODE 1 — Issue key given

1. Call `getJiraIssue` with the key.
2. Read `.ai/stories.md`. Upsert the row for this issue (add if missing,
   update status + synced date if present). Write the file.
3. Display the issue cleanly:

```
## {ISSUE-KEY}: {Title}
**Type**: {type} | **Status**: {status} | **Priority**: {priority}

### Description
{description}

### Acceptance Criteria
{acceptance criteria from Jira}
```

4. If called standalone → stop here.
   If called by /implement → return the issue details for the orchestrator to use.

---

## MODE 2 — Plain description given

### S1 — Draft the story

Read `.ai/helpers/user-story-strcuture.md` for the template structure.

Draft a complete user story from the description:
- User Story statement (As a / I want / So that)
- Acceptance Criteria (Given/When/Then, minimum 3 scenarios)
- Edge Cases (5–8)
- Business Rules
- UI/UX Notes

Include at the top:
```
**Draft Title**: {concise title}
**Type**: Story
**Priority**: Medium
```

Print the draft and ask:

> **Review this story.**
> - `approve` → create in Jira
> - `change: [what]` → revise
> - `cancel` → stop

### S2 — Review cycle

**On `change:`** → revise. If the change has scope or risk implications, flag:
> ⚠ This change affects scope: [explain]. Still want it?

Show revision, return to S2.

**On `approve`** → go to S3.

### S3 — Create in Jira and sync

1. Call `createJiraIssue` with the approved story content.
   Use project key from existing rows in `.ai/stories.md`, or ask the user
   if stories.md is empty.
2. On success, get the new issue key (e.g. `PROJ-124`).
3. Append a row to `.ai/stories.md`.
4. Print:
   ```
   ✅ Created: {ISSUE-KEY} — {Title}
   📋 Added to .ai/stories.md
   ```
5. If called standalone → stop here.
   If called by /implement → return the issue key and details.

---

## MODE 3 — No input (show replica)

Read and print `.ai/stories.md` as a formatted table.
Print: "Use `/story PROJ-123` to fetch details, or `/story "description"` to create a new story."
