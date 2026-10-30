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
| faux | 2 |
| dépassé | 13 |
| non sourcé | 29 |
| ok | 10 |

## Ce qui a été vérifié, et ce qui ne l'a pas été

- Vérifié par l'API GitHub : étoiles, licence, archivage, dernier push et dernière version des 21 outils de
  `tools-tested.ts` et des 10 dépôts de `ecosystem.ts`; versions npm de `claude-code-templates`, `claude-mem`,
  `@bifrost_inc/superclaude` et du SDK Agent.
- Vérifié par la documentation Anthropic (30-10) : minimums de cache, coefficients de lecture et d'écriture, gamme de
  modèles et tarifs.
- **Non vérifié** : l'état du cluster (pas de contexte `kubectl` sur la session), le contenu détaillé des pages
  longues (`maritime-atlas`, `aetherwx-encyclopedia`, `k8s-migration-overnight`, guides « pour les nuls »,
  `/start`, `/nouveautes`, `/livre-de-bord`), les fonctionnalités de Claude Code hors `/theory`, les verdicts
  d'outils refaits en bac à sable (affaire du lot L53). Ces pages portent la ligne « non relue ».
- Les étoiles et dates de push dérivent chaque jour : leur classement « dépassé » dit surtout qu'aucune date de relevé
  n'est affichée.

## Par page

## `/`

- **ok** — le nombre d'applications vient de `APP_COUNT` (8, lu dans `apps.ts`), jamais écrit en dur dans la page (source : `frontend/src/data/apps.ts`)

## `/about`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/argocd-k8s-pour-les-nuls`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/atelier-ia`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies`

- **faux** — archify : licence « MIT » dans `tools-tested.ts` ; le dépôt tt-a1i/archify porte une licence Apache 2.0 (texte du fichier LICENSE) (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026, endpoint `/license`)
- **dépassé** — étoiles figées au relevé de mai–septembre sans date affichée : rtk 44 736 → 85 077, ruflo 46 787 → 80 279, claude-mem 74 236 → 106 054, hermes-agent 196 852 → 258 860, archify 65 708 → 91 806, tanstack-start 16 940 → 32 510, claude-code-templates 27 113 → 33 000, token-savior 891 → 1 199, fable-mode 539 → 880, ccusage 15 096 → 19 268 (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)
- **dépassé** — dates « dernier push » (colonne `lastPush`) : 18 des 21 outils ont un push plus récent (ex. rtk 2026-05-08 → 2026-10-30, vibe-kanban 2026-04-24 → 2026-10-29, superclaude-framework 2026-04-27 → 2026-09-27) ; seuls opcode, claude-context et claude-token-efficient sont à jour (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)
- **dépassé** — ccproxy : 400 étoiles affichées, 356 aujourd'hui (le chiffre a baissé) et dernier push 2026-05-10 → 2026-08-10 (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)
- **non sourcé** — aucune date de relevé n'accompagne les étoiles ni la licence sur la page ; le lecteur ne peut pas juger leur fraîcheur (source : `case-studies.astro` lignes 311-351)
- **ok** — licences des 20 autres outils (MIT, Apache-2.0, AGPL-3.0, PolyForm Noncommercial pour alexgreensh, « unlicensed » pour fable-mode, MIT pour ccusage) conformes aux fichiers LICENSE ou aux métadonnées PyPI (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026 + `/license`)
- **ok** — aucun des 21 dépôts n'est archivé ni supprimé (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)

## `/case-studies/aetherwx-encyclopedia`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies/aetherwx-qa-harness`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies/alexgreensh-polyform`

- **ok** — licence PolyForm Noncommercial confirmée par le fichier LICENSE du dépôt (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026 + `/license`)

## `/case-studies/avatar-pandora`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies/cadence`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies/ccproxy`

- **ok** — AGPL-3.0 : l'API GitHub répond « NOASSERTION » mais la page l'explique elle-même (métadonnées PyPI) ; npm `ccproxy` v0.1.0 « projet distinct » non revérifié (source : texte de la page + API GitHub)

## `/case-studies/claude-code-codex`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies/claude-code-templates`

- **dépassé** — « v1.28.16 stable, 27k★ » : dernière version v1.29.7 sur GitHub (2026-10-09), 1.30.0 sur npm, 33 000 étoiles (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026 + `npm view`)

## `/case-studies/claude-mem`

- **dépassé** — « v13.0.1 stable, 74k★ » : la dernière version publiée est v15.7.0 (2026-10-30) et le dépôt compte 106 054 étoiles. Le texte est daté du test du 2026-05-10, donc vrai à cette date (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026 + `releases/latest`)

## `/case-studies/code-review-graph`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies/drona23-token-efficient`

- **dépassé** — « 5.4k stars, MIT » : 6 136 étoiles aujourd'hui, licence MIT conforme (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)

## `/case-studies/evatosorus`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies/finance-tracker`

- **ok** — stack React + NestJS et « démo » à données fictives conformes au CLAUDE.md du projet (k3s dark-blue, namespace `preprod`, données de démo seulement) (source : CLAUDE.md du projet)

## `/case-studies/hermes-agent`

- **dépassé** — Sonnet 4.6 présenté comme le modèle de pilotage : la gamme courante est Sonnet 5.5 ($2/$10 par MTok) ; le texte est daté du test de juin, donc vrai à cette date (source : platform.claude.com/docs/en/models/overview)
- **non sourcé** — « 59 s pour ~$0.10 (cache 99 %) » et « budget alarmé à $10 / mois » : mesures de la session de test, aucune trace consultable sur le site (source : aucune)

## `/case-studies/jobmail-assistant`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies/k8s-migration-overnight`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/case-studies/maritime-atlas`

- **non sourcé** — « GeoServer 3 replicas sur k3s », « k3s v1.36.4 » (5 occurrences sur le site), « ~15 sources externes » : cohérents avec le CLAUDE.md du projet, mais `kubectl` n'avait aucun contexte sur cette session, l'état réel du cluster n'a donc pas été vérifié (source : CLAUDE.md du projet ; `kubectl` indisponible)

## `/case-studies/ol-companion`

- **non sourcé** — `apps.ts` annonce « 365scores API » pour ol-companion alors que le CLAUDE.md du projet et `.env` parlent de football-data.org ; les deux sources existent dans le code (`scores365-squads.ts`, `football-data.schema.ts`) : l'un n'est pas faux mais la fiche est incomplète (source : sources de `ol-companion/backend/src/config`)

## `/case-studies/ruflo`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

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

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/cloudflare-pour-les-nuls`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/ecosystem`

- **ok** — les 10 dépôts GitHub cités (anthropics/*, modelcontextprotocol/servers, mrtooher/fable-mode) existent, ne sont pas archivés et ont un push de moins de 7 jours (source : API GitHub `repos/<dépôt>` relevée le 30-10-2026)
- **non sourcé** — commandes d'installation (`npm install -g @anthropic-ai/claude-code`, `pip install claude-agent-sdk`…) et descriptions des 42 entrées non rejouées ; les entrées sans dépôt GitHub (docs, services) ne sont pas vérifiées (source : `ecosystem.ts`)

## `/k8s-for-java-developers`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/learning`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/livre-de-bord`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/nouveautes`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/plan-de-travail`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/start`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)

## `/theory`

- **faux** — longueurs minimales cacheables : la page donne 4096 tokens pour Opus 4.7 et 2048 pour Sonnet 4.6. La documentation donne 2048 pour Opus 4.7 et 1024 pour Sonnet 4.6 ; 4096 ne vaut que pour Opus 4.6, Opus 4.5 et Haiku 4.5 (source : platform.claude.com/docs/en/build-with-claude/prompt-caching)
- **dépassé** — « les lectures coûtent 0.1× — le fameux discount de 90 % » : 0.1× reste vrai pour la plupart des modèles, mais 0.05× pour Opus 5.5 et Sonnet 5.5 et 0.025× pour Fable 5.1 et Mythos 5.1 (source : prompt-caching, section tarifs)
- **dépassé** — modèles cités : Opus 4.7 (`claude-opus-4-7`, exemple de requête), Opus 4.6/4.5, Sonnet 4.6, Haiku 3.5/4.5. Gamme courante : Fable 5.1, Opus 5.5, Sonnet 5.5, Haiku 5.5 (Opus 4.x et Sonnet 4.6 sont « legacy »). Aucun 5.x n'est mentionné (source : platform.claude.com/docs/en/models/overview)
- **dépassé** — « Opus 4.7 requiert SDK ≥ v0.2.111 » : le SDK TypeScript est en 0.3.314 (npm), la contrainte n'a plus d'intérêt pratique (source : `npm view @anthropic-ai/claude-agent-sdk version`)
- **ok** — écritures de cache à 1.25× (5 min) et 2× (1 h), 4 points d'arrêt par requête, fenêtre de recul de 20 blocs (source : prompt-caching)
- **non sourcé** — « Task renommé Agent en v2.1.63 », « system prompt ~4.2K tokens », MEMORY.md « 200 lignes / 25 KB », liste des événements de hooks et des 5 types de handler : liens vers code.claude.com présents en fin de section mais non comparés ligne à ligne ; le CLI local est en 2.1.293, donc la page décrit une version ancienne de l'outil sans le dire (source : sections `sources` de `theory.ts`, `claude --version`)

## `/videos`

- **non sourcé** — aucune affirmation datée ou chiffrée vérifiée : la page n'a pas été relue dans cette passe (source : aucune, page non relue dans cette passe)
