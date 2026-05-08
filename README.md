[![Live demo](https://img.shields.io/badge/Live-claude--code--codex--25m.pages.dev-D97757)](https://claude-code-codex-25m.pages.dev)
[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-D97757?logo=anthropic&logoColor=white)](https://claude.com/claude-code)
[![Astro](https://img.shields.io/badge/Astro-6-BC52EE?logo=astro&logoColor=white)](https://astro.build)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883?logo=vue.js&logoColor=white)](https://vuejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

# claude-code-codex

> Codex non-officiel sur Claude Code, l'écosystème Anthropic et la collab IA × dev.

Site fan-made, mis à jour chaque semaine via un job GitHub Actions qui scrape
les sources publiques, résume les nouveautés via Claude Sonnet, et commit
sur `main` — Cloudflare Pages rebuild auto.

100% du code écrit en pair-programming avec Claude Code. Aucune affiliation
officielle avec Anthropic.

## Pages

| Page | Sujet |
|------|-------|
| `/theory` | Comment Claude Code fonctionne — architecture, context window, tool use, hooks, MCP, skills, agents SDK |
| `/ecosystem` | Plugins, MCP servers, skills et tools utiles |
| `/case-studies` | Six apps perso construites avec Claude Code |
| `/learning` | Blogs et sites curés pour suivre Claude |
| `/videos` | Chaînes YouTube FR / EN spécifiques Claude Code |
| `/about` | Genèse du site, stack, sources |

## Stack

- **Frontend** — Astro 6 (statique pur)
- **UI** — Vue 3 + shadcn-vue + Tailwind 4
- **Hosting** — Cloudflare Pages
- **Batch** — GitHub Actions cron hebdo (`scripts/batch-update.ts`)
- **LLM** — Anthropic SDK (`claude-sonnet-4-7`)

## Développement local

```bash
nvm use            # Node 22+
cd frontend
npm install
npm run dev        # http://localhost:4321
npm run build
```

## Mise à jour hebdo

Un workflow GitHub Actions (`.github/workflows/batch-update.yml`) tourne chaque
lundi à 06:00 UTC :

1. Scrape les sources définies (`scripts/sources/*.ts`)
2. Pour chaque entrée nouvelle : appel Anthropic SDK pour résumer/structurer
3. Merge avec les seeds JSON existants (dédup par URL hash)
4. Commit auto sur `main` → Cloudflare Pages rebuild

Secrets requis dans le repo GitHub : `ANTHROPIC_API_KEY`, `YOUTUBE_API_KEY` (optionnel).

## Crédits IA

- **Code** — pair-programming avec [Claude Code](https://claude.com/claude-code)
- **Contenu généré** — Claude Sonnet via Anthropic SDK (résumés batch hebdo)

## Repos cousins

Cinq autres apps perso construites avec Claude Code :

- [warhammer40k](https://github.com/Sylad/warhammer40k) — Codex W40K (Angular + NestJS)
- [finance-tracker](https://github.com/Sylad/finance-tracker) — Tracker finances perso (React + NestJS)
- [ol-companion](https://github.com/Sylad/ol-companion) — Compagnon OL (React + NestJS + SSE)
- [avatar-pandora](https://github.com/Sylad/avatar-pandora) — Codex Avatar (Astro + R3F)
- [evatosorus](https://github.com/Sylad/evatosorus) — Codex paléonto (Astro + React)

## License

MIT — voir [LICENSE](LICENSE).
