# Installing the `/sparc` skill

This folder ships a project-local SPARC skill at `.claude/skills/sparc/SKILL.md`. It works as-is for any session where the `cwd` is `claude-code-codex/` (or any descendant), because Claude Code auto-discovers `.claude/skills/<name>/SKILL.md`.

## Make it global (recommended)

If you want `/sparc` everywhere on your machine — finance, warhammer, ol-companion, eywa, evato, plus any new project — copy it to your user-level skills directory:

```bash
mkdir -p ~/.claude/skills/sparc
cp /home/sylvain_ladoire/projects/developpeur/claude-code-codex/.claude/skills/sparc/SKILL.md \
   ~/.claude/skills/sparc/SKILL.md
```

Restart any open Claude Code session (or the global skill list refreshes on next session start). After that, `/sparc <description>` is callable from any cwd.

## Verify install

In a fresh session, type `/sparc` — Claude Code should offer it as a slash command and invoke the skill. Inside the skill's first response you should see a 5-item TodoWrite list with the SPARC phases.

## Update later

When you tweak the skill in this repo, re-copy it:

```bash
cp /home/sylvain_ladoire/projects/developpeur/claude-code-codex/.claude/skills/sparc/SKILL.md \
   ~/.claude/skills/sparc/SKILL.md
```

Or symlink it once and forget about it:

```bash
rm -f ~/.claude/skills/sparc/SKILL.md
ln -s /home/sylvain_ladoire/projects/developpeur/claude-code-codex/.claude/skills/sparc/SKILL.md \
      ~/.claude/skills/sparc/SKILL.md
```

The symlink approach means edits to the repo file are picked up everywhere immediately.

## Where it sits next to APEX

You already have `~/.claude/skills/apex/`. Once `/sparc` is installed user-level, both are available — pick the right one per task using the rule of thumb in `SKILL.md` (`<when_to_use>` block): if you'd benefit from writing the algorithm in comments first, use SPARC; if you'd benefit from a checklist of files to touch first, use APEX.
