# Installing the `/test-tool` skill

Systematizes the third-party tool evaluation protocol that emerged from the
Ruflo + claude-mem test benches. Captures the verdict where it counts :
memory note + watchlist + Tools tested catalog + case study when the test
produced lessons.

## Three install paths

### 1. Project-local (already in place)

Lives at `claude-code-codex/.claude/skills/test-tool/SKILL.md`. Auto-loaded
when Claude Code is invoked **inside this repo**. Useful because most tool
tests end up updating files in this repo anyway (the catalog, the case
study, the watchlist).

### 2. User-global (recommended — the test-tool protocol applies anywhere)

```bash
ln -s "$(realpath ~/projects/developpeur/claude-code-codex/.claude/skills/test-tool)" \
      ~/.claude/skills/test-tool
```

Symlink is preferred over `cp -r` so updates to the skill propagate without
re-copying (cf `workflow_single_tab_pilot.md`).

### 3. Plain copy (snapshot-style)

```bash
cp -r ~/projects/developpeur/claude-code-codex/.claude/skills/test-tool \
      ~/.claude/skills/
```

Use only if you want to fork the skill independently of the source repo.

## Usage

```
/test-tool ruvnet/ruflo
/test-tool claude-mem
/test-tool https://github.com/davila7/claude-code-templates
/test-tool ccproxy
```

Argument can be a GitHub `org/repo`, a full URL, or an npm package name —
the skill resolves all three.

## Companions in the quintet

- `/sparc` — structured implementation workflow (5 phases)
- `/skillify` — meta-skill that turns external concepts into skills
- `/save` — captures session learnings in the right artifact home
- `/sync-site-docs` — keeps cross-repo docs aligned
- `/test-tool` — *this one* — evaluates a third-party tool and ships the verdict
