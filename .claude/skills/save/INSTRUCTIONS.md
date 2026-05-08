# Installing the `/save` skill

Captures session learnings into the right artifact (memory, sub-agent, skill, hook, CLAUDE.md). Companion to `/skillify`.

## Three install paths

### 1. Project-local (default — what you have now)

Already done. Available in this repo only.

### 2. User-global (recommended)

Most natural fit — you'll want `/save` reachable from any project, since you might want to save learnings happening in any of your apps.

```bash
mkdir -p ~/.claude/skills
cp -r .claude/skills/save ~/.claude/skills/
```

Verify :

```bash
ls ~/.claude/skills/save/
# SKILL.md  INSTRUCTIONS.md
```

In a fresh session, trigger via `/save` or by saying "save what we learned" / "capture this session".

### 3. Symlink for live edits

```bash
ln -s "$(pwd)/.claude/skills/save" ~/.claude/skills/save
```

## Companion skills

- `/skillify` — extract a concept from an external tool into a skill
- `/sparc` — structured methodology for algo-heavy features

All three (`/sparc`, `/skillify`, `/save`) make a tight set : `/sparc` for building, `/skillify` for absorbing external ideas, `/save` for harvesting internal learnings.

Recommended : copy all three globally.

```bash
cp -r .claude/skills/{sparc,skillify,save} ~/.claude/skills/
```
