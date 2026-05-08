---
name: skillify
description: Use when the user wants to take a concept observed in an external tool, library, methodology or article (e.g. Ruflo, LangGraph, BMAD, a blog post, a paper) and turn it into a reusable Claude Code skill — keeping the idea, dropping the rest. Triggers on phrases like "skillify this", "make a skill out of X", "extract this pattern as a skill", or after the user identifies a useful concept while testing a tool.
argument-hint: <concept name or short description>
allowed-tools: Read, Glob, Grep, Edit, Write, TodoWrite, Bash, Agent, AskUserQuestion, WebFetch
---

# Skillify

Transforms a useful concept observed in an external tool / framework / methodology / article into a self-contained Claude Code skill — without adopting the source tool itself.

## When to use this skill

**Use skillify when**:
- A tool has a great idea but its full install is too invasive (Ruflo's SPARC, plugin systems, hook patterns, memory architectures…)
- A blog post / paper describes a workflow worth keeping (Hamel's eval rubric, an Anthropic engineering pattern, a SPARC-like methodology…)
- The user says "I want to keep this idea but not the whole tool"

**Don't use skillify when**:
- The concept is already trivially covered by an existing skill (check first)
- The concept needs runtime/daemon/database (it's a service, not a skill)
- The user wants to actually adopt the tool itself (just install it then)

## Heuristic: skillify vs adopt-as-tool

| Skillify | Adopt as tool |
|----------|---------------|
| Concept fits in 100-300 lines of SKILL.md | Needs runtime/daemon |
| Source tool has friction you want to skip | Source tool is mature & cohesive |
| You want reversibility | You want fail-fast on the whole thing |
| 1-2 users (you) | Team adoption |

If the user is unsure, ask via AskUserQuestion before proceeding.

---

## The 5-step procedure

Track each step with TodoWrite from the start. Don't skip — each step de-risks the next.

### Step 1 — Spot

Confirm what concept the user wants to skillify. If `<argument-hint>` is vague, ask:
- What's the **idea** (1 sentence)?
- Where did you see it (URL, repo, doc, conversation)?
- Why does it resonate (what problem does it solve for you)?

If the source is online, WebFetch the relevant page(s) to anchor on facts. If it's from a tool you tested, read the existing memory note (`memory/<tool>_learnings*.md` if present).

### Step 2 — Isolate

Separate the **idea** (keep) from the **packaging** (drop).

For each concept, list explicitly:
- ✅ What we keep: the core mechanic, decision rule, mental model, sequence
- ❌ What we drop: deps, runtime, lock-in, naming/branding, sidecar features

Output: a 5-10 bullet "spec" of what the skill must do. If you can't articulate it in bullets, you don't understand it well enough yet — go back to Step 1.

### Step 3 — Re-implement

Write a fresh `SKILL.md` at `.claude/skills/<kebab-name>/SKILL.md`. **Don't copy-paste** from the source — write it from understanding.

Required frontmatter:
```yaml
---
name: <kebab-name>
description: <when-to-use sentence ≤200 chars, includes trigger phrases>
argument-hint: <if it takes args>
allowed-tools: <minimal set needed>
---
```

Body structure (adapt as fits):
- **When to use** / **When not to use** (mirror this very SKILL.md)
- **The procedure** (numbered steps, with TodoWrite tracking if multi-phase)
- **Examples** (1-2 short, concrete)
- **Anti-patterns** (what to avoid)

Cap target: under 250 lines. If it exceeds, split into companion files (e.g. `examples.md`, `references.md`) referenced from SKILL.md.

### Step 4 — Document install paths

Create `.claude/skills/<kebab-name>/INSTRUCTIONS.md` next to SKILL.md with three install paths:

1. **Project-local** (default): the skill lives in this repo, available only when Claude Code is invoked here.
2. **User-global**: `cp -r .claude/skills/<kebab-name> ~/.claude/skills/` to make it available across all projects.
3. **Symlink for live edits**: `ln -s "$(pwd)/.claude/skills/<kebab-name>" ~/.claude/skills/<kebab-name>` so iterating in the project also updates the global version.

### Step 5 — Save the learning

Update or create a memory note under `~/.claude/projects/<project>/memory/` :
- If a `<tool>_learnings_to_apply.md` exists (e.g. `ruflo_learnings_to_apply.md`), mark this learning as ✅ done with a link to the skill path.
- If the source is new (a blog post, a fresh tool), create a new memory note with the source URL, the kept/dropped breakdown, and the skill path.
- Update `MEMORY.md` index with the new memory.

Then propose a quick commit: `feat(skill): add <kebab-name> skill (skillified from <source>)`.

---

## Examples

**SPARC** (skillified from Ruflo, 2026-05-08): the SPARC methodology was bundled inside Ruflo's invasive install. We kept the methodology (Specification → Pseudocode → Architecture → Refinement → Completion) and dropped Ruflo. Result: `.claude/skills/sparc/SKILL.md`. Usage: `/sparc add user authentication`.

**Two install paths** (skillified from Ruflo's docs, hypothetical): Ruflo offers a "lite" plugin install vs a "full" `npx ruflo init`. The pattern of offering both modes is itself worth keeping. Could be skillified as `/install-paths` that audits a tool you're shipping and ensures it offers a lite mode.

---

## Anti-patterns

- ❌ Skillifying things that should be a script, a config file, or a memory note instead. If there's no decision logic the skill would guide Claude through, it's not a skill.
- ❌ Copy-pasting the source's SKILL.md text wholesale. Re-implement from understanding — that's what de-risks lock-in.
- ❌ Skipping Step 5 (memory). Without it, the skillify origin is lost; in 6 months no one remembers where the idea came from.
- ❌ Creating skills with overlapping descriptions. Before you write, `Glob ~/.claude/skills/**/SKILL.md` and read existing descriptions to avoid trigger collisions.
- ❌ Skills > 500 lines. Split or simplify.
