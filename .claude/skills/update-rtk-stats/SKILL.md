---
name: update-rtk-stats
description: Use when the user wants to refresh the RTK savings stats displayed on the claude-code-codex homepage. Triggers on "/update-rtk-stats", "refresh rtk stats", "maj stats rtk", or after a long session where rtk usage might have meaningfully changed the numbers. Reads `rtk gain --format json`, writes to frontend/src/data/rtk-stats.json, and proposes a commit.
argument-hint: <optional commit message suffix>
allowed-tools: Read, Bash, Edit, Write
---

# Update RTK Stats

Refreshes the live RTK savings counters shown on the claude-code-codex homepage. Single-purpose skill : read fresh stats from the local `rtk` binary, persist them in the repo, and propose a commit.

## When to use

- ✅ User says "/update-rtk-stats", "refresh rtk", "maj rtk stats"
- ✅ Periodic refresh (e.g. monthly cadence), especially after a long pair-programming session
- ✅ Right after changing how RTK is configured (new filters, scope changes)

## When not to use

- ❌ The `rtk` binary isn't installed or in PATH (the skill will fail — RTK is required, not optional)
- ❌ The user wants to *display* stats elsewhere (this skill only writes to the canonical JSON, the display is in `RtkStats.astro`)
- ❌ The user wants per-command breakdown (this skill only stores the summary — extend the JSON shape if needed)

## Procedure

### Step 1 — Verify rtk + repo path

```bash
which rtk
rtk --version
```

If `rtk` isn't found, stop and tell the user how to install it (https://github.com/rtk-ai/rtk).

The target file is `frontend/src/data/rtk-stats.json` **inside the claude-code-codex repo**. Confirm we're in or under that repo with `git rev-parse --show-toplevel` and that `package.json` mentions `claude-code-codex` somewhere. If not, ask the user to `cd` there first.

### Step 2 — Capture stats

```bash
rtk gain --format json
```

Sample shape (keep this stable — `RtkStats.astro` reads these exact keys) :

```json
{
  "summary": {
    "total_commands": 1546,
    "total_input": 1889477,
    "total_output": 1459761,
    "total_saved": 433733,
    "avg_savings_pct": 22.955,
    "total_time_ms": 616294,
    "avg_time_ms": 398
  }
}
```

### Step 3 — Write the JSON with timestamp

Pipe through `node` (or `jq` if available) to add a `lastUpdated` ISO timestamp. Don't use `jq` blindly — the user's machine may not have it (verified case 2026-05-08).

Safe one-liner :

```bash
rtk gain --format json | node -e '
const fs = require("fs");
let data = "";
process.stdin.on("data", c => data += c);
process.stdin.on("end", () => {
  const j = JSON.parse(data);
  j.lastUpdated = new Date().toISOString();
  fs.writeFileSync(process.argv[1], JSON.stringify(j, null, 2) + "\n");
  console.log("wrote", process.argv[1]);
});
' frontend/src/data/rtk-stats.json
```

### Step 4 — Verify the build still passes

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"
cd frontend && npm run build 2>&1 | tail -5
```

The `RtkStats.astro` component is server-rendered and reads the JSON at build time. If the JSON shape drifted, the build will fail clearly.

### Step 5 — Show the diff and propose a commit

```bash
git diff frontend/src/data/rtk-stats.json
```

Then propose to the user :

```bash
git add frontend/src/data/rtk-stats.json
git commit -m "chore: refresh RTK stats (<short summary like 'now 1.5M saved'>)"
git push
```

Do NOT auto-push without confirmation — RTK stats refresh is a routine but visible commit on a public repo. Wait for the user's "go" before pushing.

## Anti-patterns

- ❌ Hard-coding stats in the SKILL.md or another file. The single source of truth is `frontend/src/data/rtk-stats.json`.
- ❌ Using `jq` blindly — verified that Sylvain's machine doesn't have it. Always have a `node`-based fallback ready.
- ❌ Modifying the JSON shape without updating `RtkStats.astro`. They're coupled — change both.
- ❌ Running this skill when `rtk` itself is broken. Sanity check first.

## Companion

- `/save` — captures *meta* learnings; `/update-rtk-stats` captures the *quantitative* trace of the collab.
- `/skillify` — was used to extract concepts from Ruflo; this skill captures concepts from Sylvain's own daily-driver tooling.
