---
name: save
description: Use when the user wants to capture the learnings from the current session into persistent artifacts — auto-memory notes, sub-agent definitions, custom skills, hooks, or project-level CLAUDE.md additions. Triggers on phrases like "/save", "save what we learned", "memorize this session", "capture the learnings", or after a substantial back-and-forth that produced reusable patterns.
argument-hint: <optional scope hint, e.g. "this session" or "the Ruflo work">
allowed-tools: Read, Glob, Grep, Edit, Write, TodoWrite, Bash, Agent, AskUserQuestion
---

# Save

Reviews the current session and proposes which learnings to persist as which artifact type. Companion to `/skillify` (which transforms external concepts into skills) — this one captures the **internal** learnings of a session into the right durable form.

## When to use this skill

**Use save when**:
- The user explicitly says `/save`, "memorize this", "capture what we learned"
- A long session has produced multiple reusable patterns and the user wants to harvest them before context is lost
- After a productive back-and-forth that surfaced a new convention, anti-pattern, or tool usage worth keeping

**Don't use save when**:
- The session was a single one-off task with no transferable learning
- Auto memory will already capture it implicitly (the system writes some memories automatically — don't duplicate)
- The user is asking to save a specific *file* (that's just `Write`, not this skill)

---

## The 5 categories of artifact

Each captured learning belongs in exactly one home. Pick the right home — wrong home = lost or duplicated.

| Artifact | Path | Use for |
|----------|------|---------|
| **Memory note** | `~/.claude/projects/<project>/memory/<name>.md` | User profile, feedback (do/don't), project state, references to external systems. Cross-session. |
| **Sub-agent** | `.claude/agents/<name>.md` (project) or `~/.claude/agents/<name>.md` (user) | A reusable role with its own context window — code-reviewer, security-auditor, lore-curator. |
| **Custom skill** | `.claude/skills/<name>/SKILL.md` (project) or `~/.claude/skills/<name>/SKILL.md` (user) | A reusable workflow or methodology, slash-commandable. Use `/skillify` if extracting from an external tool. |
| **Hook** | `.claude/settings.json` `hooks:` block + script in `.claude/hooks/<name>.sh` | An *automatic* enforcement at a lifecycle event (PreToolUse, SessionStart, etc.). Not user-callable. |
| **CLAUDE.md addition** | `<project>/CLAUDE.md` or `~/.claude/CLAUDE.md` | A durable project-level rule that should always be in context. Not a one-shot hint. |

If the learning fits **none** of the above — drop it. Not everything is worth persisting.

---

## The procedure

Track each step with TodoWrite from the start.

### Step 1 — Review the session

Re-read the conversation context (the user's recent messages + your own actions). Identify the **non-obvious** things — patterns the user explicitly validated, mistakes you made + corrections, recurring conventions, tools/URLs the user shared, decisions with rationale.

Skip everything that:
- Is already in `MEMORY.md` (run `Read ~/.claude/projects/<project>/memory/MEMORY.md` first to know what's already there)
- Is in CLAUDE.md (`Read CLAUDE.md`)
- Is trivial / one-off / "what to do next" task state

### Step 2 — Categorize each candidate

For each learning, propose its home with the table above. Use this template :

```
1. <one-sentence description of the learning>
   → <Memory | Agent | Skill | Hook | CLAUDE.md>
   → Path: <proposed path>
   → Why this home: <one sentence>
```

If you're hesitating between two homes, default to **Memory** (it's the most reversible).

If two learnings are about the same topic, **merge them**. Don't fragment.

### Step 3 — Confirm with user

Present the categorized list via `AskUserQuestion`. Let the user :
- ✅ Approve all
- ✏️ Edit specific items (re-categorize, rename, drop)
- ❌ Drop some

Don't write anything yet. Wait for explicit OK.

### Step 4 — Write artifacts

For each approved learning, create the file with proper structure :

**Memory note** : YAML frontmatter (`name`, `description`, `type` ∈ user/feedback/project/reference) + body. For feedback/project types, include **Why:** and **How to apply:** lines.

**Sub-agent** : YAML frontmatter (`name`, `description` ≤ 200 chars, `tools`, optional `model`/`permissionMode`) + body system prompt.

**Skill** : YAML frontmatter (`name`, `description` includes trigger phrases, `argument-hint`, `allowed-tools`) + body with When-to-use / Procedure / Examples / Anti-patterns. Cap at ~250 lines. If extracting from external source, prefer `/skillify` instead.

**Hook** : add to `.claude/settings.json` `hooks:` array with proper matcher + handler. Script in `.claude/hooks/<name>.sh` made executable.

**CLAUDE.md addition** : append a clearly-scoped section. Don't dump huge blocks. Project-specific only — don't duplicate the global file.

### Step 5 — Update indices & finalize

- For memories: append a line to `MEMORY.md` index in the format `- [Title](file.md) — one-line hook`
- Verify nothing leaked into the wrong scope (user-global vs project-local).
- Propose a single commit if applicable: `chore: capture session learnings (memories + skills + ...)`.

---

## Examples

**Mid-session save (recommended cadence)**: after a productive 1h+ session that introduced a new convention. Run `/save` to harvest before context closes.

**Post-test save**: after testing a third-party tool (like Ruflo), `/save` is the natural follow-up to `/skillify` — `/skillify` extracts the *idea*, `/save` captures the *meta-learnings* (what we learned about the testing process itself, the verdict pattern, the watchlist).

**End-of-day save**: at the end of a long working day, `/save` to consolidate before tomorrow.

---

## Anti-patterns

- ❌ Saving everything. Apply quality bar — if a future session won't gain from this, drop it.
- ❌ Putting a workflow into Memory instead of a Skill. Workflows belong to Skills (or Agents).
- ❌ Putting a one-off project decision into the user-global `~/.claude/CLAUDE.md`. Project-specific stays project-local.
- ❌ Skipping confirmation. Always present the categorized list before writing.
- ❌ Re-saving things already covered. Read `MEMORY.md` and existing skills/CLAUDE.md first to avoid duplication.
- ❌ Modifying the user-global `~/.claude/CLAUDE.md` without **explicit text** confirmation. Some hooks block self-modification — fall back to printing the suggested change.

---

## Companion skills

- `/skillify` — when the learning is a concept observed in an external tool, transform it into a skill (Step 4 then becomes "write a skill file via the skillify procedure").
- (future) — `/load` could be its mirror : load relevant memory/skills at session start based on the current task.
