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
| `/start` | **Démarrer** — Claude Code pour les vrais débutants. Pas de jargon, 7 sections progressives, exemples copy-pastable. La porte d'entrée du site. |
| `/theory` | Comment Claude Code fonctionne sous le capot — architecture agentique, context window, sessions, hooks, slash commands, MCP, skills, agents SDK |
| `/ecosystem` | Catalogue triable des plugins, MCP servers, skills officiels Anthropic et SDKs |
| `/case-studies` | 7 deep-dives d'apps perso construites en pair-programming + récits transverses (K8s migration overnight, AetherWX encyclopedia) + section **Tools tested** (RTK adopté, Ruflo rejeté+8 leçons, code-review-graph adopt-conditional) |
| `/learning` | **Preview RSS live** (Simon Willison, Anthropic, Human Coders FR filtré sur Claude/MCP) + catalogue curé de blogs et podcasts |
| `/videos` | Chaînes YouTube EN/FR spécifiques Claude Code, filtrables par langue/officiel |
| `/about` | Genèse du site, stack technique, crédits IA (Claude Code + openart.ai) |

## Stack

- **Frontend** — Astro 6 (statique pur)
- **UI** — Vue 3 + shadcn-vue + Tailwind 4
- **Hosting** — Cloudflare Pages
- **Batch** — GitHub Actions cron hebdo (`scripts/batch-update.ts`)
- **LLM** — Anthropic SDK (`claude-haiku-4-5` pour les résumés FR 140 chars)

## Skills custom inclus

Le repo contient trois skills réutilisables (copier dans `~/.claude/skills/`
pour les avoir sur tous tes projets) :

| Skill | Usage |
|-------|-------|
| `/sparc` | Workflow structuré 5 phases (Specification → Pseudocode → Architecture → Refinement → Completion) pour features algo lourdes |
| `/skillify` | Méta-skill qui transforme une idée externe (concept Ruflo, blog, paper) en skill Claude Code custom — la procédure inverse de "j'installe l'outil entier" |
| `/save` | Capture les learnings d'une session dans la bonne maison : memory note, sub-agent, skill, hook, ou CLAUDE.md addition |
| `/update-rtk-stats` | Refresh les stats RTK affichées sur la homepage (depuis `rtk gain --format json`) |
| `/test-tool` | Évalue un outil tiers Claude Code via le protocole 8 étapes (snapshot → install → diff → verdict → cleanup) et publie le verdict dans la catalogue Tools tested + case study si lessons riches |

Voir `.claude/skills/<name>/INSTRUCTIONS.md` pour les détails d'installation.

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

1. Scrape les sources définies (`scripts/sources/*.ts`) :
   - `simon-willison` (Atom feed)
   - `humancoders` (RSS, filtré sur `claude code|claude|anthropic|mcp`)
   - `anthropic-news` (RSS avec fallback gracieux)
   - `github-anthropics-skills` (GitHub API)
   - `github-mcp-servers` (GitHub API)
2. Pour chaque entrée nouvelle : appel Anthropic SDK pour résumer/structurer
   en FR (140 chars max, filtre `[off-topic]` automatique)
3. Merge avec les seeds JSON existants dans `frontend/src/data/feeds/`
   (dédup par hash URL, cap 50 par source)
4. Commit auto sur `main` → Cloudflare Pages rebuild

Le composant `LatestNews.astro` lit ces feeds JSON au build time pour
afficher les 10 articles les plus récents sur `/learning`.

Secrets requis dans le repo GitHub : `ANTHROPIC_API_KEY`, `YOUTUBE_API_KEY`
(optionnel, pour `/videos`).

## Crédits IA

- **Code** — pair-programming avec [Claude Code](https://claude.com/claude-code)
  (Anthropic). 0 ligne de code écrite par l'humain.
- **Background visuel** — image cyberpunk générée via
  [openart.ai](https://openart.ai) (clin d'œil Blade Runner).
- **Résumés batch hebdo** — `claude-haiku-4-5` via Anthropic SDK.

## Repos cousins

Cinq autres apps perso construites avec Claude Code :

- [warhammer40k](https://github.com/Sylad/warhammer40k) — Codex W40K (Angular + NestJS)
- [finance-tracker](https://github.com/Sylad/finance-tracker) — Tracker finances perso (React + NestJS)
- [ol-companion](https://github.com/Sylad/ol-companion) — Compagnon OL (React + NestJS + SSE)
- [avatar-pandora](https://github.com/Sylad/avatar-pandora) — Codex Avatar (Astro + R3F)
- [evatosorus](https://github.com/Sylad/evatosorus) — Codex paléonto (Astro + React)

## License

MIT — voir [LICENSE](LICENSE).
