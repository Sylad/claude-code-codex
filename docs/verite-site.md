# Relecture de vérité du site (L52)

Demande de Sylvain du 30-10 : chaque affirmation datée ou chiffrée (versions, prix, modèles, fonctionnalités de
Claude Code, verdicts d'outils, état des apps) doit être vraie, sourcée et à jour. Cette relecture **ne modifie
aucune page** : elle classe, page par page, ce qui a été vérifié. Les corrections sont à planifier en un lot par page.

Relecture du 30-10-2026. Test : `frontend/tests/verite-site.test.mjs` (chaque page a sa section, chaque ligne une
classe et une source, décomptes exacts).

## Classes

- **faux** : l'affirmation est contredite par la source à la date du relevé.
- **dépassé** : vraie au moment où elle a été écrite, plus vraie aujourd'hui.
- **non sourcé** : ni source consultable sur le site ni vérification possible dans cette passe.
- **ok** : vérifiée contre une source citée.

| classe | lignes |
|---|---|
| faux | 7 |
| dépassé | 30 |
| non sourcé | 23 |
| ok | 36 |

## Ce qui a été vérifié, et ce qui ne l'a pas été

- Vérifié par l'API GitHub : étoiles, licence, archivage, dernier push et dernière version des 21 outils de
  `tools-tested.ts` et des 10 dépôts de `ecosystem.ts`; versions npm de `claude-code-templates`, `claude-mem`,
  `@bifrost_inc/superclaude` et du SDK Agent.
- Vérifié par la documentation Anthropic (30-10) : minimums de cache, coefficients de lecture et d'écriture, gamme de
  modèles et tarifs.
- Les 22 pages relues dans un second temps l'ont été contre le dépôt (manifestes `package.json`, `wc -l`, `ls`, `rtk gain`,
  workflow GitHub Actions, `CLAUDE.md` du dossier developpeur) et contre les dépôts frères en lecture seule. Chaque page a
  maintenant au moins une ligne classée avec sa source.
- **Non vérifié** : l'état du cluster en direct (aucun contexte `kubectl` sur la session : les lignes cluster s'appuient
  sur le `CLAUDE.md` du dossier developpeur), l'interface Cloudflare, les ordres de grandeur d'expérience (durées, pourcentages
  de récit : classés « non sourcé »), les verdicts d'outils refaits en bac
  à sable (affaire du lot L53, veille mensuelle).
- Les étoiles et dates de push dérivent chaque jour : leur classement « dépassé » dit surtout qu'aucune date de relevé
  n'est affichée.

## Par page

## `/`

- **ok** — le nombre d'applications vient de `APP_COUNT` (8, lu dans `apps.ts`), jamais écrit en dur dans la page (source : `frontend/src/data/apps.ts`)
- **faux** — « {APP_COUNT} applications construites avec Claude Code, déployées sur Kubernetes + GitOps » (`index.astro` l. 106-107) : sur les 8 applications, 4 seulement tournent sur le k3s de dark-blue ; 2 sont sur Cloudflare Pages, jobmail-assistant est en local sur Big-Blue, et ce site est lui aussi sur Pages (source : `CLAUDE.md` du dossier developpeur, tableau « Architecture générale »)

## `/about`

- **faux** — « J'utilise Claude Code depuis fin 2026 » : la page est écrite en 2026 et la même page dit six mois de pratique en mai 2026 ; on ne peut pas utiliser un outil « depuis fin 2026 » en octobre 2026 (la date juste serait fin 2025) (source : `about.astro` (deux paragraphes « L'histoire courte »))
- **dépassé** — « cinq apps perso en prod » au lancement : le site en présente 8 aujourd'hui (`APP_COUNT`) ; la page ne dit pas que le chiffre date de mai (source : `frontend/src/data/apps.ts`)
- **ok** — résumés hebdomadaires par `claude-haiku-4-5` : le script de batch utilise `claude-haiku-4-5-20251001` (source : `scripts/lib/claude.ts` ligne 14)
- **ok** — Astro 6, Vue 3, Tailwind 4, batch GitHub Actions hebdomadaire (cron du lundi 6 h) (source : `frontend/package.json`, `.github/workflows/batch-update.yml`)
- **faux** — « les {APP_COUNT} applications … déployées sur Kubernetes + GitOps » (`about.astro` l. 26-32) : même erreur que l'accueil, 4 applications sur 8 sont sur Kubernetes (source : `CLAUDE.md` du dossier developpeur, tableau « Architecture générale »)
- **non sourcé** — « 0 ligne de code écrite par l'humain » : affirmation invérifiable (le dépôt ne distingue pas l'auteur de la frappe) (source : aucune)

## `/argocd-k8s-pour-les-nuls`

- **ok** — polling ArgoCD de 3 minutes par défaut et sync immédiat par webhook : comportement documenté d'ArgoCD, repris tel quel dans la bible (source : documentation ArgoCD (`timeout.reconciliation` 180 s))
- **non sourcé** — « ~3 min de build + 15 s de sync », « l'UI bat la CLI pour 90 % des usages » : ordres de grandeur d'expérience, non mesurés ni datés (source : aucune)
- **dépassé** — cas d'école sur un tag `v1.4.2` : les images réelles sont taguées `sha-<shortsha>` depuis le pipeline actuel ; l'exemple est pédagogique mais la page ne le dit pas (source : `CLAUDE.md` du dossier developpeur, section pipeline gitops)

## `/atelier-ia`

- **dépassé** — schéma « Cloudflare / NAS / K8s » : le NAS n'héberge plus d'app (migration sur dark-blue le 2026-09-03), il ne garde que médias et sauvegardes (source : `CLAUDE.md` du dossier developpeur, topologie machines)
- **non sourcé** — liste d'outils (Codex, Ollama, ChatGPT, OpenArt/DALL-E, Kombai) : usages déclarés, aucun chiffre ni date à confronter (source : aucune)

## `/case-studies`

- **faux** — archify : licence « MIT » dans `tools-tested.ts` ; le dépôt tt-a1i/archify porte une licence Apache 2.0 (texte du fichier LICENSE) (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026, endpoint `/license`)
- **dépassé** — étoiles figées au relevé de mai–septembre sans date affichée : rtk 44 736 → 85 077, ruflo 46 787 → 80 279, claude-mem 74 236 → 106 054, hermes-agent 196 852 → 258 860, archify 65 708 → 91 806, code-review-graph 16 940 → 32 516, tanstack-start 14 360 → 15 267 (monorepo TanStack/router), claude-code-templates 27 113 → 33 000, token-savior 891 → 1 199, fable-mode 539 → 880, ccusage 15 096 → 19 268 (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)
- **dépassé** — Convex (hors des 21 dépôts ci-dessus : sa fiche pointe vers convex.dev) : 12 570 → 12 770 étoiles et dernier push 2026-09-18 → 2026-10-31 sur get-convex/convex-backend ; la licence FSL-1.1-Apache-2.0 n'est pas vérifiable par l'API (SPDX « NOASSERTION »), elle reste non confrontée (source : API GitHub `repos/get-convex/convex-backend` relevée le 31-10-2026)
- **dépassé** — TanStack Start : « v1.167 stable » dans `tools-tested.ts`, `@tanstack/react-start` est en 1.169.4 sur npm ; dernier push 2026-05-11 → 2026-10-30 (source : `npm view @tanstack/react-start version` + API GitHub `repos/TanStack/router` relevée le 31-10-2026)
- **dépassé** — dates « dernier push » (colonne `lastPush`) : 18 des 21 outils ont un push plus récent (ex. rtk 2026-05-08 → 2026-10-30, vibe-kanban 2026-04-24 → 2026-10-29, superclaude-framework 2026-04-27 → 2026-09-27) ; seuls opcode, claude-context et claude-token-efficient sont à jour (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)
- **dépassé** — ccproxy : 400 étoiles affichées, 356 aujourd'hui (le chiffre a baissé) et dernier push 2026-05-10 → 2026-08-10 (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)
- **non sourcé** — aucune date de relevé n'accompagne les étoiles ni la licence sur la page ; le lecteur ne peut pas juger leur fraîcheur (source : `case-studies.astro` lignes 311-351)
- **ok** — licences des 20 autres outils (MIT, Apache-2.0, AGPL-3.0, PolyForm Noncommercial pour alexgreensh, « unlicensed » pour fable-mode, MIT pour ccusage) conformes aux fichiers LICENSE ou aux métadonnées PyPI (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026 + `/license`)
- **ok** — aucun des 21 dépôts n'est archivé ni supprimé (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)

## `/case-studies/aetherwx-encyclopedia`

- **ok** — dark-blue : Ubuntu 26.04, k3s v1.36.4, Ryzen 9 9900X, 64 Go, RTX 4080, prod depuis septembre 2026 (source : `CLAUDE.md` du dossier developpeur, topologie machines (état du cluster non relu en direct : aucun contexte `kubectl` sur cette session))
- **dépassé** — « ~20 pods maritime + 3 apps NestJS » et « Mini-Blue, un mini-PC always-on » : mini-blue est devenu le PC Windows d'outillage le 2026-10-14 et n'héberge rien ; le nombre de pods n'a pas été recompté (source : `CLAUDE.md` du dossier developpeur ; recomptage impossible sans `kubectl`)
- **non sourcé** — « une vingtaine de services », « 6 tokens », « 5 leçons », webhook « ~2 sec » : décomptes de la page non recoupés avec le dépôt GitOps (source : aucune)

## `/case-studies/aetherwx-qa-harness`

- **non sourcé** — « cause racine identifiée en 10 minutes » et opacité 100 % → 30 % : récit d'un incident daté non rattaché à un commit ou à un rapport (source : aucune)
- **ok** — aucune version, prix ni modèle cité : rien d'autre de chiffré à périmer sur la page (source : `aetherwx-qa-harness.astro`)

## `/case-studies/alexgreensh-polyform`

- **ok** — licence PolyForm Noncommercial confirmée par le fichier LICENSE du dépôt (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026 + `/license`)

## `/case-studies/avatar-pandora`

- **ok** — Astro 6 (dépôt avatar-pandora : `astro ^6.2.1`), hébergé sur Cloudflare Pages (source : `avatar-pandora/frontend/package.json`, `CLAUDE.md` du dossier developpeur)
- **non sourcé** — « ~2 min de pipeline Cloudflare » et « 100 % codé avec Claude Code » : durée non mesurée, part de Claude non vérifiable (source : aucune)

## `/case-studies/cadence`

- **dépassé** — « Depuis la 1.26… » : cadence est en 1.29.0 dans le dépôt ; la formule reste vraie mais la page ne nomme pas la version courante (source : `cadence/package.json` (version 1.29.0))
- **ok** — chiffres des mesures (61 % · 29 %, 1 h 53 min, accord 17 sur 24) : chacun renvoie à un fichier `docs/mesures/…` du dépôt cadence, relevés au 30 octobre 2026 (source : bloc « Chiffres relevés dans le dépôt cadence au 30 octobre 2026 » de la page)
- **ok** — quatre tags partis sans atteindre npm (1.5.0, 1.14.0, 1.16.0, 1.25.0) : récit daté du CHANGELOG de cadence (source : CHANGELOG de cadence)

## `/case-studies/ccproxy`

- **ok** — AGPL-3.0 : l'API GitHub répond « NOASSERTION » mais la page l'explique elle-même (métadonnées PyPI) ; npm `ccproxy` v0.1.0 « projet distinct » non revérifié (source : texte de la page + API GitHub)

## `/case-studies/claude-code-codex`

- **dépassé** — mémoire « ~70 fichiers .md » dans `~/.claude/projects/<cwd>/memory/` : chiffre écrit le 2026-05-08 (commit 2f58cd2), juste alors (67 fichiers modifiés au plus tard ce jour-là) ; le dossier en compte 614 aujourd'hui et la page ne date pas le chiffre (source : `ls` du dossier mémoire du projet developpeur, relevé le 30-10-2026, filtré sur les dates de modification)
- **dépassé** — « 6e app perso » et « 6 sites perso » : vrai en mai 2026 (la page le dit), le site en présente 8 aujourd'hui (source : `frontend/src/data/apps.ts`)
- **non sourcé** — « six mois de pair-programming intensif » à la date de lancement : durée déclarée, sans trace datée dans le dépôt (source : aucune)

## `/case-studies/claude-code-templates`

- **dépassé** — « v1.28.16 stable, 27k★ » : dernière version v1.29.7 sur GitHub (2026-10-09), 1.30.0 sur npm, 33 000 étoiles (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026 + `npm view`)

## `/case-studies/claude-mem`

- **dépassé** — « v13.0.1 stable, 74k★ » : la dernière version publiée est v15.7.0 (2026-10-30) et le dépôt compte 106 054 étoiles. Le texte est daté du test du 2026-05-10, donc vrai à cette date (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026 + `releases/latest`)

## `/case-studies/code-review-graph`

- **dépassé** — test du 2026-05-20, version 2.3.3, 929 nodes / 7 939 edges sur maritime-atlas : le graphe a grossi depuis ; la page est datée, donc ces chiffres ne sont pas faux mais plus représentatifs (source : date affichée sur la page ; verdict dans `tools-tested.ts`)
- **dépassé** — « 16.9k★, MIT » (`code-review-graph.astro` lignes 48 et 109) : 32 516 étoiles aujourd'hui, licence MIT conforme (source : API GitHub `repos/tirth8205/code-review-graph` relevée le 31-10-2026)
- **ok** — version et date du test affichées sur la page (« Test mené 2026-05-20 · version 2.3.3 ») (source : `code-review-graph.astro`)

## `/case-studies/drona23-token-efficient`

- **dépassé** — « 5.4k stars, MIT » : 6 136 étoiles aujourd'hui, licence MIT conforme (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)

## `/case-studies/evatosorus`

- **dépassé** — « V1 livrée, 1527 pages, dist ~27 MB » (2026-05-06) : le dossier `dist` actuel compte 1 532 pages HTML (source : `find evatosorus/frontend/dist -name '*.html'`, relevé le 30-10-2026)
- **ok** — versions épinglées `astro@6.2.1` et `vite@7.3.2` (source : `evatosorus/frontend/package.json`)

## `/case-studies/finance-tracker`

- **ok** — stack React + NestJS et « démo » à données fictives conformes au CLAUDE.md du projet (k3s dark-blue, namespace `preprod`, données de démo seulement) (source : CLAUDE.md du projet)

## `/case-studies/hermes-agent`

- **dépassé** — Sonnet 4.6 présenté comme le modèle de pilotage : la gamme courante est Sonnet 5.5 ($2/$10 par MTok) ; le texte est daté du test de juin, donc vrai à cette date (source : platform.claude.com/docs/en/models/overview)
- **non sourcé** — « 59 s pour ~$0.10 (cache 99 %) » et « budget alarmé à $10 / mois » : mesures de la session de test, aucune trace consultable sur le site (source : aucune)

## `/case-studies/jobmail-assistant`

- **ok** — API locale sur `127.0.0.1:8765`, Python 3.12 (source : `jobmail-assistant/README.md` ligne 238, `pyproject.toml` (`requires-python >=3.12`))
- **non sourcé** — chantier Codex de juin 2026 et état de l'outil : date déclarée, non recoupée avec les commits de jobmail-assistant (source : aucune)

## `/case-studies/k8s-migration-overnight`

- **dépassé** — récit du 13-14 mai 2026 : cluster k3s sur Big-Blue (i9-14900KF, 31 GiB), 5 apps ; depuis le 2026-09-03 la prod est sur dark-blue et le cluster de Big-Blue n'existe plus. La page l'annonce en tête (« depuis le 03/09/2026 »), les chiffres du récit restent ceux de mai (source : `CLAUDE.md` du dossier developpeur, topologie machines)
- **ok** — k3s v1.36.4 sur Ubuntu 26.04 pour dark-blue (source : `CLAUDE.md` du dossier developpeur (non relu en direct : pas de contexte `kubectl`))
- **non sourcé** — « 6 h de bootstrap cloud + €40/mo économisés », « 15 min de grâce » du démarrage GeoServer : estimations du récit, non mesurées (source : aucune)

## `/case-studies/maritime-atlas`

- **non sourcé** — « GeoServer 3 replicas sur k3s », « k3s v1.36.4 » (5 occurrences sur le site), « ~15 sources externes » : cohérents avec le CLAUDE.md du projet, mais `kubectl` n'avait aucun contexte sur cette session, l'état réel du cluster n'a donc pas été vérifié (source : CLAUDE.md du projet ; `kubectl` indisponible)

## `/case-studies/ol-companion`

- **non sourcé** — `apps.ts` annonce « 365scores API » pour ol-companion alors que le CLAUDE.md du projet et `.env` parlent de football-data.org ; les deux sources existent dans le code (`scores365-squads.ts`, `football-data.schema.ts`) : l'un n'est pas faux mais la fiche est incomplète (source : sources de `ol-companion/backend/src/config`)

## `/case-studies/ruflo`

- **ok** — test du 2026-05-08, versions 3.7.0-alpha.17 + 3.6.30 stable, 8 leçons : date et versions affichées, verdict « testé puis rejeté » cohérent avec le catalogue (source : `tools-tested.ts` (entrée ruflo), `ruflo.astro`)
- **dépassé** — étoiles et dernier push de Ruflo : relevés du rapport `/case-studies` (46 787 → 80 279 étoiles) (source : ligne `/case-studies` de ce rapport, API GitHub du 30-10-2026)

## `/case-studies/superclaude`

- **ok** — « v4.3.0 stable » : c'est toujours la dernière version publiée (2026-03-22) ; `@bifrost_inc/superclaude` v4.0.7 est aussi la version npm actuelle (source : `releases/latest` + `npm view`)
- **dépassé** — « 22.7k★ » : 23 915 aujourd'hui ; « v5.0 TypeScript plugin system » encore présenté comme attendu, non revérifié (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)

## `/case-studies/token-optimizers-2026`

- **dépassé** — « 15k⭐ » (ccusage) : 19 268 aujourd'hui ; « v20 » non revérifiée (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)
- **ok** — PolyForm Noncommercial pour alexgreensh/token-optimizer : le fichier LICENSE porte bien une notice PolyForm (l'API GitHub répond « NOASSERTION ») (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026 + `/license`)

## `/case-studies/token-savior`

- **dépassé** — « v4.3.2 » : la dernière version publiée est v4.24.0 (2026-10-15) (source : `releases/latest`)
- **non sourcé** — « 188/192 tâches à -80 % tokens sur Claude Opus 4.7 » : chiffre du README de l'outil, non reproduit ; Opus 4.7 n'est plus le modèle courant (source : aucune)

## `/case-studies/warhammer40k`

- **ok** — Angular 19, NestJS 11, Anthropic SDK 0.91 (source : `warhammer40k/backend/package.json` (`@anthropic-ai/sdk ^0.91.1`, `@nestjs/core ^11`))
- **dépassé** — « CLAUDE.md de 130 lignes au root du repo » : chiffre écrit le 2026-05-08 (commit 2f58cd2), alors à 134 lignes (`git show 7c5a515:CLAUDE.md | wc -l`) ; le fichier en compte 309 aujourd'hui et la page ne date pas le chiffre (source : `wc -l warhammer40k/CLAUDE.md`, relevé le 30-10-2026)
- **non sourcé** — « cinq polygones tracés en ~10 minutes », seuils de détection (0,65, 0,55) : chiffres de récit non rattachés à un commit (source : aucune)

## `/cloudflare-pour-les-nuls`

- **ok** — tunnel Cloudflare pour l'accès externe `*.sladoire.dev` et Pages pour les sites statiques (source : `CLAUDE.md` du dossier developpeur)
- **non sourcé** — « Piège d'interface (2026) » : « Public Hostnames » renommé « Published applications » dans « Cloudflare One » ; l'interface Cloudflare n'a pas été rouverte dans cette passe (source : aucune)

## `/ecosystem`

- **ok** — les 10 dépôts GitHub cités (anthropics/*, modelcontextprotocol/servers, mrtooher/fable-mode) existent, ne sont pas archivés et ont un push de moins de 7 jours (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)
- **non sourcé** — commandes d'installation (`npm install -g @anthropic-ai/claude-code`, `pip install claude-agent-sdk`…) et descriptions des 42 entrées non rejouées ; les entrées sans dépôt GitHub (docs, services) ne sont pas vérifiées (source : `ecosystem.ts`)

## `/k8s-for-java-developers`

- **non sourcé** — « ~30 min par service complexe », « GHCR ~2-5 min », « -Xmx = 80 % du limit » : ordres de grandeur d'expérience, non mesurés (source : aucune)
- **dépassé** — « K8s en 2026 … je recommande » : k3s est en v1.36.4 sur la prod, la page ne cite aucune version de Kubernetes (source : `CLAUDE.md` du dossier developpeur)

## `/learning`

- **faux** — « le batch hebdo retirera les sources qui n'ont pas publié depuis 6+ mois » : aucun code du batch n'applique cette règle (`scripts/` ne contient aucun test d'ancienneté) ; la phrase est au futur et reste fausse (source : `grep -rniE '6 mois|stale|months' scripts/`, relevé le 30-10-2026)
- **ok** — batch hebdomadaire (cron du lundi 6 h) qui nourrit la page (source : `.github/workflows/batch-update.yml`)

## `/livre-de-bord`

- **ok** — entrée 2026-W44 datée du 2026-10-30, dans la semaine ISO ; filtre de contenu appliqué au build qui fait échouer l'entrée fautive (source : `frontend/src/data/livre-de-bord.ts`, `src/lib/livre-de-bord.ts`)
- **non sourcé** — les chiffres cités dans les entrées reprennent les notes de clôture et les verdicts d'outils ; ils n'ont pas été recoupés un à un avec le CHANGELOG de cadence (source : aucune)

## `/nouveautes`

- **ok** — les 14 entrées viennent de `docs/nouveautes/*.md`, avec date propre ; le JSON versionné est vérifié à jour par les tests (`npm run news`) (source : `docs/nouveautes/`, `tests/` (e2e Nouveautés))
- **non sourcé** — le contenu chiffré de chaque entrée (dates de livraison, durées) n'a pas été recoupé avec le plan (source : aucune)

## `/plan-de-travail`

- **ok** — page rendue au build depuis `.cadence/raf.yaml` : aucun chiffre écrit à la main, titres publics bornés par le build (source : `frontend/src/lib/plan-public.ts`, `tests/plan-page.e2e.test.mjs`)

## `/start`

- **dépassé** — bloc RTK : statistiques figées au 2026-05-08 (1 546 commandes, 23 % d'économie) alors que `rtk gain` en compte aujourd'hui 148 104 (47 % d'économie) (source : `frontend/src/data/rtk-stats.json` (`lastUpdated` 2026-05-08) contre `rtk gain --format json`, 30-10-2026)
- **ok** — « 3 flux RSS (Simon Willison, Anthropic, Human Coders) » : trois flux présents dans le dossier des flux, plus deux flux GitHub (source : `frontend/src/data/feeds/`)
- **ok** — « Ruflo testé puis rejeté avec 8 leçons » : cohérent avec le catalogue et la page Ruflo (source : `tools-tested.ts`, `ruflo.astro`)
- **ok** — tableau Claude Code / Copilot, ligne « Mémoire » : Claude Code relit `CLAUDE.md` à chaque ouverture de session (source : code.claude.com/docs/en/memory, 31-10-2026)
- **non sourcé** — tableau Claude Code / Copilot (`start.astro` l. 85), colonne Copilot : « oublie après chaque session », « GPT-* par défaut », « sidebar étroite » ; le comportement de Copilot n'a pas été vérifié dans cette passe et change avec ses versions (source : aucune)
- **non sourcé** — « Tu verras déjà 80 % de ce… » et « 10 fichiers de 1000 lignes par prompt va coûter cher » : ordres de grandeur pédagogiques non mesurés (source : aucune)

## `/theory`

- **faux** — longueurs minimales cacheables : la page donne 4096 tokens pour Opus 4.7 et 2048 pour Sonnet 4.6. La documentation donne 2048 pour Opus 4.7 et 1024 pour Sonnet 4.6 ; 4096 ne vaut que pour Opus 4.6, Opus 4.5 et Haiku 4.5 (source : platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **dépassé** — « les lectures coûtent 0.1× — le fameux discount de 90 % » : 0.1× reste vrai pour la plupart des modèles, mais 0.05× pour Opus 5.5 et Sonnet 5.5 et 0.025× pour Fable 5.1 et Mythos 5.1 (source : prompt-caching, section tarifs)
- **dépassé** — modèles cités : Opus 4.7 (`claude-opus-4-7`, exemple de requête), Opus 4.6/4.5, Sonnet 4.6, Haiku 3.5/4.5. Gamme courante : Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5 (Opus 4.x et Sonnet 4.6 sont « legacy »). Aucun 5.x n'est mentionné (source : platform.claude.com/docs/en/models/overview)
- **dépassé** — « Opus 4.7 requiert SDK ≥ v0.2.111 » : le SDK TypeScript est en 0.3.314 (npm), la contrainte n'a plus d'intérêt pratique (source : `npm view @anthropic-ai/claude-agent-sdk version`)
- **ok** — écritures de cache à 1.25× (5 min) et 2× (1 h), 4 points d'arrêt par requête, fenêtre de recul de 20 blocs (source : prompt-caching)
- **ok** — « Task renommé Agent en v2.1.63 » (`Task(...)` reste un alias) : la page des sous-agents dit « In version 2.1.63, the Task tool was renamed to Agent » et garde les références `Task(...)` comme alias (source : code.claude.com/docs/en/sub-agents, 31-10-2026)
- **ok** — MEMORY.md « 200 lignes / 25 KB » : la documentation de la mémoire donne « first 200 lines or 25KB » (source : code.claude.com/docs/en/memory, 31-10-2026)
- **ok** — liste d'événements de hooks (sous-ensemble des 33 événements, la page termine par « … ») et les 5 types de handler (command, http, mcp_tool, prompt, agent) (source : code.claude.com/docs/en/hooks, 31-10-2026)
- **faux** — « Les sous-agents ne peuvent pas spawner d'autres sous-agents (pas de nesting infini) » (`theory.ts` l. 35) : un sous-agent peut en lancer d'autres jusqu'à trois niveaux sous la conversation principale, réglable par `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (1 désactive l'imbrication) (source : code.claude.com/docs/en/sub-agents, 31-10-2026)
- **non sourcé** — « system prompt ~4.2K tokens » : aucune page de documentation ne donne ce chiffre, qui change à chaque version ; le CLI local est en 2.1.293 (source : `claude --version`)

## `/videos`

- **ok** — la page liste 15 vidéos issues de `videos.ts`, sans chiffre écrit en dur (source : `frontend/src/data/videos.ts`)
