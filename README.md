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
| `/case-studies` | 7 deep-dives d'apps perso construites en pair-programming + récits transverses (K8s migration overnight, AetherWX encyclopedia, **Cadence** — la méthode de travail, ses chiffres mesurés et ses échecs, illustrée par trois schémas SVG (plan relié aux commits, parcours d'un lot, chaîne du livreur) lisibles en thème clair et sombre — composants `Schema`, `StepChain` (description accessible du svg composée des étapes : titre, détail, qui), `Callout` —, `/case-studies/cadence`) + section **Tools tested** (RTK adopté, Ruflo rejeté+8 leçons, code-review-graph adopt-conditional) |
| `/atelier-ia` | L'atelier IA perso — quels outils (Claude Code, Codex…), quels rôles, quelles frontières |
| `/k8s-for-java-developers` | **Guide** — introduction Kubernetes pour dev Java, du jar au pod |
| `/argocd-k8s-pour-les-nuls` | **Guide** — bible ArgoCD + K8s : pourquoi tant de YAML, GitOps, incidents vécus maritime-atlas |
| `/cloudflare-pour-les-nuls` | **Guide** — tunnel, DNS, Zero Trust Access pour homelab, raconté via la panne 1033 vécue (3 semaines) |
| `/learning` | **Preview RSS live** (Simon Willison, Anthropic, Human Coders FR filtré sur Claude/MCP) + catalogue curé de blogs et podcasts |
| `/videos` | Chaînes YouTube EN/FR spécifiques Claude Code, filtrables par langue/officiel |
| `/about` | Genèse du site, stack technique, crédits IA (Claude Code + openart.ai) |
| `/nouveautes` | Journal des évolutions visibles du site, la plus récente en premier (pastille sur le lien quand il y a du neuf) |
| `/plan-de-travail` | Ce qui est en cours, prévu et récemment livré — titres publics du plan `.cadence/raf.yaml`, générés au build |
| `/livre-de-bord` | Livre de bord du développement avec l'IA : une entrée par semaine (appris, fabriqué, testé) et, en plus, des entrées thématiques (champ `theme`, rubriques titrées à part ; la première, du 30-10, commente une vidéo à la lumière de nos dépôts), liens vers cadence, la chaîne de cette vidéo, études de cas et Tools tested. Une entrée peut porter un `schema` et chaque élément une `illustration` (identifiants de `frontend/src/data/livre-de-bord-schemas.ts`, inconnu = build en échec) ; un `texte` se découpe en paragraphes par une ligne vide (l'entrée thématique du 30-10 : schéma de la boucle vérifier plutôt que croire, une illustration par épisode). Contenu dans `frontend/src/data/livre-de-bord.ts`, filtré au build (rien de privé) |

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
| `/update-rtk-stats` | Refresh les stats RTK affichées sur `/case-studies` (depuis `rtk gain --format json`) |
| `/test-tool` | Évalue un outil tiers Claude Code via le protocole 8 étapes (snapshot → install → diff → verdict → cleanup) et publie le verdict dans la catalogue Tools tested + case study si lessons riches |

Voir `.claude/skills/<name>/INSTRUCTIONS.md` pour les détails d'installation.

## Développement local

```bash
nvm use            # Node 22+
cd frontend
npm install
npm run dev        # http://localhost:4321
npm run build
npm run audit      # lisibilité du site construit : pages « mur de texte » à reprendre
```

L'audit de lisibilité (mots, schémas, images, plus long bloc sans intertitre par page) est décrit, avec son dernier résultat, dans [`docs/audit-lisibilite.md`](docs/audit-lisibilite.md).

La relecture de vérité du site (affirmations datées ou chiffrées classées faux / dépassé / non sourcé / ok, page par page, sans réécriture) est dans [`docs/verite-site.md`](docs/verite-site.md).
Les étoiles, licences et dates de push des outils testés (`frontend/src/data/tools-tested.ts`) sont relevées à une date affichée sur `/case-studies` (constante `TOOLS_SURVEYED_AT`) ; la corriger avec les valeurs, test : `frontend/tests/l56-verite-outils.e2e.test.mjs`.

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
