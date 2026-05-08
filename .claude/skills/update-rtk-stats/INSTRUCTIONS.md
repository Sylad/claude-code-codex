# Installing the `/update-rtk-stats` skill

Refreshes the RTK savings counters on the claude-code-codex homepage. Project-specific (only useful in this repo).

## Install

This skill is **project-local by nature** — the target file `frontend/src/data/rtk-stats.json` only exists in `claude-code-codex/`. Don't copy to `~/.claude/skills/` ; it has no purpose elsewhere.

Already in place at `.claude/skills/update-rtk-stats/SKILL.md` — Claude Code auto-loads it when working in this repo.

## Usage

```
/update-rtk-stats
```

Or in conversation : "refresh the rtk stats", "maj stats rtk".

## Cadence

Manual trigger. Recommended cadence : monthly, or after a substantial pair-programming push that meaningfully moved the numbers.

If you want it auto-scheduled, you could later add it to `.github/workflows/batch-update.yml` — but the GitHub Actions runner doesn't have `rtk` installed (it's your local-only setup). So manual stays the right pattern.
