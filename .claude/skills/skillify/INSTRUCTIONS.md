# Installing the `skillify` skill

This skill helps Claude Code transform a concept observed in an external tool / blog / paper into a reusable skill, without adopting the source tool itself.

## Three install paths

### 1. Project-local (default — what you have now)

Already done. The skill lives at `.claude/skills/skillify/SKILL.md` in this repo and is auto-loaded by Claude Code when working in `claude-code-codex`.

Use case : you only want it when working on this codex.

### 2. User-global (recommended — recommended for skillify specifically)

Copy to `~/.claude/skills/` so the skill is available **across all your projects** :

```bash
mkdir -p ~/.claude/skills
cp -r .claude/skills/skillify ~/.claude/skills/
```

Verify:

```bash
ls ~/.claude/skills/skillify/
# SKILL.md  INSTRUCTIONS.md
```

In a fresh Claude Code session (in any repo), trigger by saying `/skillify <concept>` or simply describing the use case.

Why recommended : skillify is naturally cross-project — you spot ideas everywhere, you want the skill at hand everywhere.

### 3. Symlink for live edits

If you want edits in this repo to immediately apply to the global skill:

```bash
ln -s "$(pwd)/.claude/skills/skillify" ~/.claude/skills/skillify
```

Best for iterating on the skill itself.

## Verify it triggers

In any directory under Claude Code, the description should auto-load when you say something like:
- "Skillify this from <tool>"
- "Make a skill out of this pattern"
- "Extract this as a skill"

If it doesn't trigger, you can invoke it explicitly via `/skillify <concept>` (slash command).

## Companion skill

`/sparc` (also in this repo's `.claude/skills/sparc/`) is the first skill that was skillified using this pattern — from the Ruflo test bench. Worth installing both globally if you find yourself liking the workflow.
