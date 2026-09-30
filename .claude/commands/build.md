# /build — Build the solution (interactive)

Act as the `build` orchestrator: read `.claude/agents/build.md` and follow it exactly, in
**interactive** mode. Arguments: `$ARGUMENTS` (optional `--plan <path> --schema <path>
--ui <path>`; if missing and not in `.pm/config.json`, ask for them).

Resumes from `.pm/` automatically. For unattended runs that wait out usage limits and
restart on their own, use `pnpm autobuild` in a terminal instead.
