---
name: sync-site-docs
description: Use after a notable change on one of the 6 personal sites (new nav entry, new page, architecture pivot, removed feature, new third-party tool tested) to keep the project docs and the cross-site case study in sync. Triggers on "/sync-site-docs", "sync docs", "j'ai changé la nav", "j'ai ajouté une feature importante", "update doc projet", or after a substantial commit on warhammer40k / finance-tracker / ol-companion / avatar-pandora / evatosorus / claude-code-codex.
argument-hint: <optional one-line summary of what changed>
allowed-tools: Read, Glob, Grep, Edit, Write, Bash, TodoWrite, Agent, AskUserQuestion
---

# Sync Site Docs

Keeps the documentation of the 6 personal sites coherent across two layers :

1. **Project-local docs** — `CLAUDE.md`, `README.md`, and any pertinent
   memory note (`<app>_state_*.md`, `<app>_imagery.md`, etc.) inside the
   touched repo.
2. **Cross-site case study** — the matching page on
   `claude-code-codex/frontend/src/pages/case-studies/<slug>.astro`
   (architecture Mermaid diagram, Pivots & lessons learned section,
   Tools tested if a new third-party tool was just experimented with).

## When to use

- ✅ The site got a **new top-level page** (e.g. `/start` was added on
  claude-code-codex — README pages table needs an update, the
  case-study page should mention it).
- ✅ A **menu/nav** was reorganized.
- ✅ An **architecture pivot** happened (new backend, new data source,
  removed feature, swapped framework).
- ✅ A **new third-party tool** got tested in sandbox (Ruflo-style) —
  the case-study `/case-studies/ruflo` pattern lives on, plus a
  Watchlist memo update.
- ✅ A **new live feature** went into prod that visitors will see.

## When NOT to use

- ❌ Tiny fixes (typos, copy tweaks, color shift) — no doc impact.
- ❌ Refactors that don't change the user-visible surface — internal
  cleanups don't need cross-doc sync.
- ❌ The change hasn't been committed yet — work on a clean tree, this
  skill reads `git log` to detect what landed.

---

## Procedure

Track each step with TodoWrite from the start.

### Step 1 — Identify the site

```bash
git rev-parse --show-toplevel
```

Map repo root to one of the 6 known sites :

| Repo root | Site |
|-----------|------|
| `~/projects/developpeur/warhammer40k` | warhammer40k |
| `~/projects/developpeur/finance-tracker` | finance-tracker |
| `~/projects/developpeur/ol-companion` | ol-companion |
| `~/projects/developpeur/avatar-pandora` | avatar-pandora |
| `~/projects/developpeur/evatosorus` | evatosorus |
| `~/projects/developpeur/claude-code-codex` | claude-code-codex |

If the cwd isn't a known site, ask the user to `cd` to the right repo.

### Step 2 — Detect what changed

```bash
git log --oneline -15
git diff HEAD~5..HEAD --stat
```

If the user passed an argument-hint, use it as the lead. Otherwise infer
from the diff. Typical signals :

- `frontend/src/pages/<new>.astro` created → new top-level page
- `Navbar.vue` modified → nav restructuring
- `package.json` deps added/removed → stack change
- `frontend/src/data/<new>.ts` → new data source
- `scripts/sources/<new>.ts` → new batch source
- File deletions → feature removed

If nothing significant landed, abort with a friendly note.

### Step 3 — Audit the project-local docs (decide if update needed)

For the touched site, **read** :

1. `CLAUDE.md` (project root) — does any rule need adding/updating ?
2. `README.md` — is the pages table / stack section current ?
3. Memory files at `~/.claude/projects/<project>/memory/<app>_*.md` —
   especially `<app>_state_*.md` files which capture the current snapshot.

For each file, decide :
- **No change** — content still accurate.
- **Append** — new info to add (new page, new tool).
- **Replace section** — old info now wrong (architecture, removed feature).

### Step 4 — Audit the cross-site case study

If the touched site has a case study at
`~/projects/developpeur/claude-code-codex/frontend/src/pages/case-studies/<slug>.astro` :

Read that file. For each change identified in Step 2, decide :

- **Architecture diagram (Mermaid)** — outdated nodes/arrows ?
- **Stack & data flow** — outdated tech mention ?
- **Process avec Claude Code** — new pattern used worth mentioning ?
- **Pivots & lessons learned** — recent abandonment / new direction worth
  capturing ?

Special cases :

- **claude-code-codex itself** has its case study at
  `case-studies/claude-code-codex.astro` (meta). Don't forget it.
- **A third-party tool tested** (Ruflo-style) lives at
  `case-studies/<tool>.astro`. The Tools tested section index on
  `case-studies.astro` and the entries in
  `frontend/src/data/tools-tested.ts` may also need an update.

### Step 5 — Confirm with the user

Present the **diff of what you'd write** via `AskUserQuestion`. Each
proposed change as one option (or grouped if they're tightly coupled).
Let the user :

- ✅ Approve all
- ✏️ Edit specific items (re-word, drop)
- ❌ Reject specific items

**Don't write anything yet.**

### Step 6 — Apply the approved changes

For each approved diff :

- `Edit` for in-file replacements (preserving the rest)
- `Write` only when creating a new memory note
- For the case study page, prefer surgical `Edit` over rewrite — the
  6 sections (Pourquoi / Architecture / Stack / Process / Pivots /
  links) keep their structure.

### Step 7 — Cross-repo coordination

If the change affects **both** the touched site repo AND
claude-code-codex, you may end up with edits in two repos. Don't
auto-commit on the user's behalf — at the end, present :

```
Modified in <site-repo> :
  - CLAUDE.md  (+5 lines)
  - README.md  (pages table updated)

Modified in claude-code-codex :
  - frontend/src/pages/case-studies/<slug>.astro  (Pivots section + diagram)
  - frontend/src/data/tools-tested.ts  (Ruflo entry tweaked)

Suggested commits :
  cd <site-repo> && git add … && git commit -m "docs: …"
  cd ~/projects/developpeur/claude-code-codex && git add … && git commit -m "docs(case-study): …"
```

The user runs the commits and pushes when ready.

---

## Examples

**Example A — claude-code-codex got a new `/start` page**
- Project docs: `README.md` pages table gains the new row + skills section.
- Case study (`/case-studies/claude-code-codex.astro`) — the
  "Sections livrées" section in Pivots can mention the new starter
  page; the Mermaid diagram stays unchanged (no archi shift).
- Memory : `claude_code_codex_kickoff.md` already lists pages — append.

**Example B — warhammer40k removes the Sectors page**
- Project docs : `CLAUDE.md` already lists "Sectors abandonné"
  (cf `warhammer_sectors_abandoned.md`). No change needed there.
- Case study (`/case-studies/warhammer40k.astro`) — remove Sectors
  from the architecture diagram + add a one-liner in Pivots.

**Example C — finance-tracker adds a new bank parser**
- Project docs : `CLAUDE.md` may gain a rule on the new file naming
  convention. `README.md` if the visible scope changes.
- Case study : Stack & data flow gains the new parser; if the heuristic
  is non-obvious, add a Pivots line.

---

## Anti-patterns

- ❌ Updating doc files without checking git history first — you might
  re-add things that were intentionally removed.
- ❌ Forgetting one of the two layers (project-local OR cross-site
  case study). The skill exists precisely to cover both.
- ❌ Auto-committing without showing the user what changed first.
- ❌ Spamming `AskUserQuestion` with 10 micro-edits — group related
  changes into 2-4 questions max.
- ❌ Touching the **global** `~/.claude/CLAUDE.md` — that's user-level,
  outside this skill's scope. Project-local CLAUDE.md only.

## Companion skills

- `/save` — captures *meta* learnings of a session ; this skill captures
  *concrete site-level* changes. Often run together.
- `/skillify` — when the change you want to document is a tool/concept
  that should also become a skill of its own.
