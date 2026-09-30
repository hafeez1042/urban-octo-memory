#!/usr/bin/env node
// Runs the `build` agent headless in a loop until .pm/state.json says "done".
// Survives usage limits (sleeps until the reset time) and crashes (retries with backoff).
// Every session resumes from .pm/, so rerunning this command after any failure continues.
//
//   pnpm autobuild                                    # uses .pm/config.json, asks if missing
//   pnpm autobuild --plan <p> --schema <p> --ui <p>   # first run
//   pnpm autobuild --once                             # a single session, no loop
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";

const ROOT = path.resolve(import.meta.dirname, "..");
const PM = path.join(ROOT, ".pm");
const LOGS = path.join(PM, "logs");
const CONFIG = path.join(PM, "config.json");
const STATE = path.join(PM, "state.json");
const TASKS = path.join(PM, "tasks.json");
const BLOCKED = path.join(PM, "BLOCKED.md");
const LOCK = path.join(PM, "autobuild.lock");

const MAX_FAILURES = 5;
const MAX_STALLS = 3;
const DEFAULT_LIMIT_SLEEP_MS = 30 * 60_000;
const OVERLOADED_SLEEP_MS = 3 * 60_000;

const log = (msg) => console.log(`[autobuild ${new Date().toLocaleTimeString()}] ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (file) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

function parseArgs(argv) {
  const args = { once: false, inputs: {} };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") continue;
    if (a === "--once") args.once = true;
    else if (["--plan", "--schema", "--ui"].includes(a)) args.inputs[a.slice(2)] = argv[++i];
    else positional.push(a);
  }
  ["plan", "schema", "ui"].forEach((k, i) => {
    if (!args.inputs[k] && positional[i]) args.inputs[k] = positional[i];
  });
  return args;
}

async function resolveInputs(given) {
  const config = readJson(CONFIG) ?? {};
  const inputs = { ...(config.inputs ?? {}), ...given };
  const missing = ["plan", "schema", "ui"].filter((k) => !inputs[k]);
  if (missing.length && process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const labels = { plan: "Implementation plan", schema: "DB schema", ui: "UI reference HTML" };
    for (const k of missing) inputs[k] = (await rl.question(`${labels[k]} path: `)).trim().replace(/^"|"$/g, "");
    rl.close();
  }
  const stillMissing = ["plan", "schema", "ui"].filter((k) => !inputs[k]);
  if (stillMissing.length) throw new Error(`Missing inputs: ${stillMissing.join(", ")}. Pass --plan --schema --ui.`);
  for (const [k, p] of Object.entries(inputs)) {
    if (!fs.existsSync(path.resolve(ROOT, p))) throw new Error(`${k} file not found: ${p}`);
  }
  // The agent copies these into docs/ and rewrites config.json with repo paths.
  fs.writeFileSync(CONFIG, JSON.stringify({ ...config, inputs }, null, 2));
  return inputs;
}

function acquireLock() {
  const existing = readJson(LOCK);
  if (existing?.pid) {
    try {
      process.kill(existing.pid, 0);
      throw new Error(`Another autobuild is running (pid ${existing.pid}). Delete ${LOCK} if it is stale.`);
    } catch (e) {
      if (e.code !== "ESRCH") throw e;
    }
  }
  fs.writeFileSync(LOCK, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
}

const releaseLock = () => fs.rmSync(LOCK, { force: true });

// Progress = new commits or task-state changes. Used to tell a stall from real work.
function progressMarker() {
  const head = fs.existsSync(path.join(ROOT, ".git/HEAD"))
    ? fs.readFileSync(path.join(ROOT, ".git/HEAD"), "utf8").trim()
    : "";
  const ref = head.startsWith("ref: ") ? path.join(ROOT, ".git", head.slice(5)) : null;
  const sha = ref && fs.existsSync(ref) ? fs.readFileSync(ref, "utf8").trim() : head;
  const tasks = fs.existsSync(TASKS) ? fs.readFileSync(TASKS, "utf8") : "";
  return `${sha}:${tasks.length}:${tasks.split('"done"').length}`;
}

function nextClockTime(hour, minute, meridiem) {
  let h = hour % 12;
  if (meridiem?.toLowerCase() === "pm") h += 12;
  const t = new Date();
  t.setHours(h, minute, 0, 0);
  if (t <= new Date()) t.setDate(t.getDate() + 1);
  return t;
}

// Only called on a failed run, so feature code that mentions "rate limit" can't trigger it.
function detectLimit(text) {
  const epoch = text.match(/limit reached\|(\d{10})/i);
  if (epoch) return new Date(Number(epoch[1]) * 1000);
  const clock = text.match(/resets?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (clock && /limit/i.test(text)) return nextClockTime(Number(clock[1]), Number(clock[2] ?? 0), clock[3]);
  if (/overloaded|529/i.test(text)) return new Date(Date.now() + OVERLOADED_SLEEP_MS);
  if (/usage limit|hit your limit|rate.?limit|429|quota/i.test(text)) return new Date(Date.now() + DEFAULT_LIMIT_SLEEP_MS);
  return null;
}

function printEvent(evt) {
  if (evt.type === "assistant") {
    for (const c of evt.message?.content ?? []) {
      if (c.type === "text" && c.text.trim()) console.log(c.text.trim());
      if (c.type === "tool_use") {
        const hint = c.input?.description ?? c.input?.command ?? c.input?.file_path ?? "";
        console.log(`  → ${c.name}${hint ? `: ${String(hint).slice(0, 120)}` : ""}`);
      }
    }
  }
  if (evt.type === "result") log(`session ended: ${evt.subtype}${evt.is_error ? " (error)" : ""}`);
}

function runSession(runNo, inputs) {
  const prompt =
    `HEADLESS autobuild run #${runNo}. Continue the build per your instructions, resuming from .pm/. ` +
    `Inputs: --plan "${inputs.plan}" --schema "${inputs.schema}" --ui "${inputs.ui}".`;
  const logFile = path.join(LOGS, `run-${String(runNo).padStart(3, "0")}-${Date.now()}.jsonl`);
  const out = fs.createWriteStream(logFile);
  const args = ["-p", "--agent", "build", "--dangerously-skip-permissions", "--output-format", "stream-json", "--verbose"];

  return new Promise((resolve) => {
    // Prompt goes via stdin so no argument needs shell quoting on Windows.
    const child = spawn("claude", args, { cwd: ROOT, shell: process.platform === "win32", env: process.env });
    let buffer = "";
    let stderr = "";
    let result = null;
    let lastText = "";

    child.stdin.end(prompt);
    child.stdout.on("data", (chunk) => {
      out.write(chunk);
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line);
          printEvent(evt);
          if (evt.type === "result") result = evt;
          if (evt.type === "assistant") {
            const t = (evt.message?.content ?? []).filter((c) => c.type === "text").map((c) => c.text).join("\n");
            if (t.trim()) lastText = t;
          }
        } catch {
          console.log(line);
        }
      }
    });
    child.stderr.on("data", (chunk) => {
      out.write(chunk);
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("error", (err) => {
      stderr += String(err);
    });
    child.on("close", (code) => {
      out.end();
      const failed = code !== 0 || !result || result.is_error;
      const errorText = [stderr, result?.result ?? "", result?.subtype ?? "", failed ? lastText : ""].join("\n");
      const marker = (result?.result ?? lastText).match(/AUTOBUILD_(CONTINUE|BLOCKED|COMPLETE)/)?.[1] ?? null;
      resolve({ code, failed, errorText, marker });
    });
  });
}

async function main() {
  fs.mkdirSync(LOGS, { recursive: true });
  const args = parseArgs(process.argv.slice(2));
  const inputs = await resolveInputs(args.inputs);
  acquireLock();
  process.on("exit", releaseLock);
  process.on("SIGINT", () => {
    log("interrupted — rerun `pnpm autobuild` to continue");
    process.exit(130);
  });

  let failures = 0;
  let stalls = 0;
  let runNo = (readJson(STATE)?.runCount ?? 0) + 1;

  while (true) {
    if (readJson(STATE)?.phase === "done") return log("build complete — see .pm/FINAL_REPORT.md");
    if (fs.existsSync(BLOCKED)) {
      console.log(fs.readFileSync(BLOCKED, "utf8"));
      log("blocked — fix the above, delete .pm/BLOCKED.md, rerun `pnpm autobuild`");
      process.exitCode = 2;
      return;
    }

    const before = progressMarker();
    log(`starting session #${runNo}`);
    const { failed, errorText, marker } = await runSession(runNo++, inputs);
    const progressed = progressMarker() !== before;

    if (marker === "COMPLETE" && readJson(STATE)?.phase === "done") continue;
    if (marker === "BLOCKED") continue; // loop top prints BLOCKED.md

    if (failed) {
      const resetAt = detectLimit(errorText);
      if (resetAt) {
        const wait = Math.max(resetAt.getTime() - Date.now(), 0) + 60_000;
        log(`usage limit — sleeping until ${new Date(Date.now() + wait).toLocaleString()}`);
        await sleep(wait);
        continue;
      }
      failures = progressed ? 1 : failures + 1;
      if (failures >= MAX_FAILURES) throw new Error(`${failures} failed sessions in a row without progress. See .pm/logs/.`);
      const backoff = Math.min(60_000 * 2 ** (failures - 1), 15 * 60_000);
      log(`session failed (${failures}/${MAX_FAILURES}) — retrying in ${Math.round(backoff / 1000)}s`);
      await sleep(backoff);
      continue;
    }

    failures = 0;
    stalls = progressed ? 0 : stalls + 1;
    if (stalls >= MAX_STALLS) throw new Error(`${stalls} sessions ended without progress. Check .pm/STATUS.md and .pm/logs/.`);
    if (args.once) return log("--once: stopping after one session");
  }
}

main().catch((err) => {
  console.error(`[autobuild] ${err.message}`);
  process.exitCode = 1;
});
