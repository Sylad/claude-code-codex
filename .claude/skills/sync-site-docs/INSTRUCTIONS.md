# Installing the `/sync-site-docs` skill

This skill keeps the docs of the 6 personal sites coherent across :

- the project-local files (`CLAUDE.md`, `README.md`, memory notes)
- the cross-site case study on claude-code-codex
  (`frontend/src/pages/case-studies/<slug>.astro`)

## Three install paths

### 1. Project-local (already in place)

Lives at `claude-code-codex/.claude/skills/sync-site-docs/SKILL.md`.
Auto-loaded when Claude Code is invoked **inside this repo**. Useful
because most cross-site updates end up touching this repo's case-study
files anyway.

### 2. User-global (recommended for cross-repo use)

Available across all 6 sites :

```bash
cp -r ~/projects/developpeur/claude-code-codex/.claude/skills/sync-site-docs ~/.claude/skills/
```

Now you can invoke `/sync-site-docs` from inside warhammer40k,
finance-tracker, etc., and it will know how to update both the local
files and the matching case-study page on claude-code-codex.

### 3. Symlink for live edits

If you tweak the skill while using it, symlinking lets the changes
propagate immediately without re-copying :

```bash
ln -s "$(realpath ~/projects/developpeur/claude-code-codex/.claude/skills/sync-site-docs)" \
      ~/.claude/skills/sync-site-docs
```

## Usage

```
/sync-site-docs
```

Optional argument : a one-line hint of what changed.

```
/sync-site-docs added a new /start page
/sync-site-docs swapped React for Solid
/sync-site-docs removed the Sectors page
```

## Prerequisite

Run on a **clean working tree** — the skill inspects `git log` and
`git diff` to detect what shipped. Stage / commit your work first,
then sync the docs.

## Companions in the trio

- `/sparc` — structured implementation workflow (5 phases).
- `/skillify` — meta-skill that turns external concepts into skills.
- `/save` — captures session learnings in the right artifact home.
- `/sync-site-docs` — *this one* — keeps cross-repo docs aligned.
