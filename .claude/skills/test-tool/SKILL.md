---
name: test-tool
description: Use when the user wants to evaluate a third-party Claude Code tool (npm package, GitHub repo, plugin marketplace) before adopting it. Triggers on phrases like "/test-tool", "on teste X", "let's evaluate X", "is X any good?", or when the user shares a GitHub URL of a tool to assess. Runs the systematic test bench protocol (snapshot → install in sandbox → verify pollution → minimal usage → verdict → cleanup) and ships the verdict to the claude-code-codex Tools tested catalog.
argument-hint: <repo URL or npm package name>
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, TodoWrite, Agent, AskUserQuestion, WebFetch
---

# Test Tool

Evaluates a third-party tool from the Claude Code ecosystem with a reproducible, low-risk protocol. Captures the verdict where it counts (memory + watchlist + Tools tested catalog on the site + case study if the tool taught us something significant).

## When to use

- ✅ User says "on teste X", "let's try X", "/test-tool", or shares a GitHub repo / npm package URL with intent to evaluate.
- ✅ A tool already in `claude-code-codex/frontend/src/data/tools-tested.ts` with status `to-test` or `browsed` needs a real verdict.
- ✅ Periodic re-test of a watchlisted tool (cf `watchlist_tools_to_revisit.md`) that hit a maturity milestone.

## When NOT to use

- ❌ The user is asking *about* a tool but hasn't decided to test it yet — answer the question without spinning up the protocol.
- ❌ The tool requires deep integration (auth, API keys, paid tier, multi-day setup) — the 8-step protocol assumes a quick evaluation, not a full migration.
- ❌ The tool doesn't target Claude Code / the Anthropic ecosystem — out of scope.

## The 8-step protocol

Track each step with TodoWrite from the start.

### Step 1 — Snapshot global state

Capture md5 + listings BEFORE touching anything. This is the "control" we'll diff against post-install :

```bash
echo "=== md5 baseline ==="
md5sum ~/.claude/CLAUDE.md ~/.claude/settings.json
echo "=== plugins/ baseline ==="
ls ~/.claude/plugins/marketplaces/ ~/.claude/plugins/cache/
cat ~/.claude/plugins/installed_plugins.json | head -3
cat ~/.claude/plugins/known_marketplaces.json | head -3
echo "=== ~/.claude/ root files ==="
ls ~/.claude/ | sort
```

Save these outputs as the "before" reference.

### Step 2 — Inspect npm package + repo

Cheap surface assessment — should the tool even be tested ?

```bash
# npm
npm view <pkg> version description main bin license repository.url
npm dist-tag ls <pkg>
npm view <pkg> versions --json | tail -20  # detect alpha-as-latest anti-pattern

# GitHub
gh repo view <org>/<repo> --json description,stargazerCount,licenseInfo,homepageUrl,pushedAt
gh api repos/<org>/<repo>/readme --jq .content | base64 -d | head -200
```

Red flags to surface immediately to user :
- `npm latest` tag points to alpha / prerelease
- License is non-OSS or absent
- Last push > 6 months ago (unless ≥1k stars)
- README install command is `npx <tool>` with no `--dry-run` flag mentioned
- README claims "auto-detect everything" → likely invasive

### Step 3 — Read install instructions VERY carefully

Look for :
- A `--dry-run` or `--scope local` flag (good sign)
- A `uninstall` command (good sign)
- Phrases like "automatically configures your environment" (warning)
- Bun / Deno / Python / Rust runtime requirements (potential bootstrap pain)
- Marketplace registration vs project-local install (the latter is safer)

**Do NOT run `<tool> --help` blindly.** Learned 2026-05-10 with `claude-mem` : its `--help` triggered the full install (marketplace registered, plugin enabled, settings.json modified). Always read the README first; if `--help` is the only doc, run it in a sandbox or after explicit user confirmation.

**Do NOT trust `--dry-run` on word.** Learned 2026-05-10 with `claude-code-templates` : the flag is documented (\"show what would be copied without actually copying\") but `--dry-run --agent X --yes` actually downloaded and wrote the file. Test the flag's truthfulness by running it in a sandbox and checking the post-state diff before relying on it. Apply the same skepticism to `--scope local`, `--no-global`, `--preview`.

### Step 4 — Sandbox install (if possible)

For tools that genuinely support project-local mode :

```bash
SANDBOX=~/projects/developpeur/<tool>-sandbox
mkdir -p $SANDBOX && cd $SANDBOX
git init -b main
# Then run the project-local install command
```

For tools that ONLY install globally (~/.claude/), warn the user and ask for explicit OK before proceeding. Don't auto-run a global install.

### Step 5 — Verify post-install diff

```bash
echo "=== md5 NOW ==="
md5sum ~/.claude/CLAUDE.md ~/.claude/settings.json
echo "=== plugins/ NOW ==="
ls ~/.claude/plugins/marketplaces/ ~/.claude/plugins/cache/
echo "=== new files in ~/.claude/ ==="
find ~/.claude -newer /tmp/.test-tool-marker -type f 2>/dev/null | head -20
```

Compare against Step 1 baseline. List concretely what was added/modified.

If the global pollution is unacceptable, abort here and go to Step 8 (cleanup) immediately.

### Step 6 — Minimal usage test

Run 3-5 commands that exercise the tool's main value proposition. Aim for :
- Smallest example from README
- A "does it actually work" smoke test
- An "edge case" check (empty input, missing arg, etc.)
- **A `--dry-run` truthfulness check** : if the tool advertises `--dry-run` (or `--no-global`, `--scope local`, `--preview`), run it then immediately re-snapshot. If `~/.claude/`, `./.claude/`, or any state was actually written, the flag is a lie — record this as a major caveat in the verdict.

Capture stdout + exit codes.

### Step 7 — Verdict

Categorize the outcome :

| Verdict | Criteria |
|---|---|
| **adopt** | Useful, clean install/uninstall, no global pollution surprises, mature, license OK |
| **skillify** | Useful concept but install too invasive / overkill — extract the idea into a Claude Code skill instead (see `/skillify`) |
| **reject + watchlist** | Not adoptable today, but interesting enough to re-evaluate when [specific conditions]. Add to `watchlist_tools_to_revisit.md`. |
| **reject hard** | Too invasive / abandoned / wrong target audience / license issue. Don't watchlist — drop. |

### Step 8 — Cleanup

Always provide cleanup commands, even if the user adopts (so they can roll back later).

For tools with a working `uninstall` command, prefer that.

For tools that polluted `~/.claude/plugins/` (no uninstall, or incomplete one), use the cleanup helper script :

```bash
~/projects/developpeur/claude-code-codex/scripts/cleanup-test-tool.sh \
  <plugin-id> <marketplace-id>

# Example for claude-mem :
./scripts/cleanup-test-tool.sh claude-mem@thedotmack thedotmack

# Example for ruflo :
./scripts/cleanup-test-tool.sh ruflo-core@ruflo ruflo
```

The script handles all 5 layers of pollution :
1. Remove from `installed_plugins.json`
2. Remove from `known_marketplaces.json`
3. Remove from `settings.json` `enabledPlugins` (with timestamped `.bak` backup)
4. `rm -rf ~/.claude/plugins/marketplaces/<marketplace>/`
5. `rm -rf ~/.claude/plugins/cache/<marketplace>/`

**Important** : the user must run the script themselves — Claude is blocked by the Self-Modification hook on `~/.claude/settings.json`. Give them the one-liner above with the right `<plugin-id>` and `<marketplace-id>` for the tool tested.

### Output — Where the verdict lands

Always update **all** of these :

1. **Memory note** at `~/.claude/projects/<project>/memory/<tool>_test_<YYYY-MM-DD>.md` :
   - Frontmatter `type: project`
   - Sections : Setup, Snapshot diff, What works, Pitfalls, Verdict, Cleanup commands, Conditions for re-evaluation
2. **Watchlist** at `~/.claude/projects/<project>/memory/watchlist_tools_to_revisit.md` :
   - Append entry with verdict + re-test conditions (only if status `reject + watchlist`)
3. **Tools tested catalog** at `claude-code-codex/frontend/src/data/tools-tested.ts` :
   - Set `status` correctly (`tested`, `to-test`, or `browsed`)
   - If verdict is `reject + watchlist` with significant lessons → set `caseStudyHref: "/case-studies/<tool>"`
4. **Case study (only if rich lessons)** at `claude-code-codex/frontend/src/pages/case-studies/<tool>.astro` :
   - Use the existing `case-studies/ruflo.astro` as template
   - Sections : Pourquoi tester / Ce qu'on a testé / Verdict (panneau vert + panneau rouge) / Leçons à reprendre / Watchlist conditions
5. **MEMORY.md index** updated with the new memory line.

Skip the case study when the verdict is trivial (`adopt` with no surprises, or `reject hard` with no transferable lessons). Only invest in a case study when the test taught us something durable about the ecosystem.

---

## Examples

**Example A — `ruvnet/ruflo` (2026-05-08)** :
- Snapshot OK, package alpha → flagged
- Sandbox install with `--no-global` ➜ flag broken, modified `~/.claude/CLAUDE.md` anyway
- Cleanup `--force` incomplete (left `.mcp.json`, `CLAUDE.md`, `ruvector.db`)
- **Verdict** : reject + watchlist (re-test conditions in memory)
- **Case study** : `/case-studies/ruflo` with 8 lessons reprised (skill SPARC, skillify pattern, etc.)

**Example B — `thedotmack/claude-mem` (2026-05-10)** :
- Stable v13.0.1, 74k stars, recent push ✓
- BUT `--help` triggered full install (marketplace registered, plugin enabled, settings.json modified)
- Bun runtime required, install failed mid-way without rollback
- **Verdict** : reject + watchlist (re-test if `--help` becomes safe + uninstall command appears)

---

## Anti-patterns

- ❌ Skipping the snapshot (Step 1). Without baseline, you can't prove what got polluted.
- ❌ Running `<tool> --help` before reading the README. Some installers misuse `--help`.
- ❌ Auto-modifying `~/.claude/settings.json` to undo damage — the Self-Modification hook will (rightly) block, and the user owns this file.
- ❌ Adopting a tool without writing the cleanup script first. If you can't undo the install, don't install.
- ❌ Skipping the case study when the test produced a transferable insight ("the user agreed not to adopt but learned 3 things") — those lessons evaporate without the case study.
- ❌ Updating only the catalog without writing the memory note. The catalog is for visitors; the memory is for future sessions.

## Companion skills

- `/skillify` — when verdict is "skillify" (extract the idea into a custom skill)
- `/save` — captures session-level meta-learnings; this skill captures tool-level findings
- `/sync-site-docs` — when the case study lands, this skill keeps the cross-doc references aligned
