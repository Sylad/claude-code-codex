# Carte du site claude-code-codex

## Écrans

- `/case-studies/pourquoi-cadence/` (L73, D-2) — « Pourquoi cadence » : les cinq besoins de Sylvain (8 nov. 2026),
  la définition en une phrase (`data-definition`), un schéma besoin → pièce (`data-schema="besoins-mecanismes"`,
  viewBox 340 de large, plafonné à 26rem au bureau), les preuves chiffrées (`data-chiffre`, chacune avec date et
  source `docs/…` du dépôt cadence, lien GitHub), « Ce que les mesures ne prouvent pas » (`data-limites`), puis
  l'installation npm et les liens dépôt / paquet. Lien depuis « Pour aller plus loin » de `/case-studies/cadence/`.

- Bloc de revue (L21, `components/site/RevueContenu.astro`, `data-revue`) sous le PageHero de `/ecosystem/`,
  `/theory/`, `/learning/`, `/videos/`, et avant la liste des outils de `/case-studies/` : dernière revue, rythme
  (30 jours), prochaine revue ; `<details>` « Ce que cette revue a vérifié » (mis à jour, signalé périmé, pas
  revérifié). « Revue en retard » rendu au build et révélé par un script si la date passe sans nouveau build.
- `/ecosystem/` : section « Actualités de l'écosystème » (`VeilleEcosysteme.astro`, `data-veille`) APRÈS le catalogue
  officiel (le catalogue reste au-dessus du pli, test L6/t2), avant la section community.

## Workflow de revue du contenu (L21)

- Source unique : `src/lib/revue-contenu.mjs` (`PAGES_REVUES` : `derniereRevue`, `corrige`, `perimes` avec source et
  date de relevé, `nonVerifie`) et `src/data/veille-ecosysteme.mjs` (actualités datées `publie`/`releve`, sourcées,
  plus récente en tête, rattachées à une page). Le build échoue sur une date invalide ou future.
- À chaque revue : partir des résumés `veille/AAAA-Sww.md` du dossier parent, vérifier chaque fait sur sa source en
  ligne (notes de version GitHub, doc Anthropic, API GitHub pour étoiles/licences/push, contrôle des liens), mettre à
  jour la page puis sa fiche de revue ; un commit par page.

## Décisions

- Un chiffre de cadence n'entre sur le site qu'avec sa date et le fichier du dépôt cadence qui le porte ; les chiffres
  défavorables sont dits sur la même page (L73).
- Revue L73 (19-11) : de la publication 2.0.0, seule la séquence AetherWX est citée (1990 s contre 2470 s, 18 contre
  12 tests, 0 contre 2 régressions, mais 2 contre 1 défauts et juge aveugle pour Claude seul) ; le cumul n'est plus
  présenté (demandes isolées = deux bras identiques) ; la garde rouge de la 2.0.0 est dans les limites. Aucune
  citation de Sylvain qui ne soit dans le dépôt cadence ; la liste des besoins renvoie à 2026-11-08-banc-sequence-design.md.
- D-2 reste « ouverte » tant que la page n'est pas en ligne : c'est le lead qui la passe à « livrée » (URL + sha).
- Index `/case-studies/` : la page a sa carte « Pourquoi cadence » dans « Récits transverses », juste après la carte
  cadence (revue UX r3, Nielsen 4 et 6) ; le compte « 8 apps » ne bouge pas (R10 de cadence-case-study). Texte de la
  carte sans chiffre : seule la page porte les chiffres sourcés.
- Schéma : boîtes 8-150 et 178-332 (bords extérieurs de 8 unités), chaque libellé a 10 unités de marge à gauche et
  au moins autant à droite (« Revue code et écran » touchait le bord à 320 px).
- Où publier hors du codex : proposition dans le rapport du run L73 seulement, rien publié sans accord de Sylvain.
- Revue r2 (19-11) : la Nouveauté du 19-11 dit la même chose que la page (séquence 2.0.0 chiffrée, défauts et juge
  défavorables, « demande différée », les cinq limites avec leurs chiffres) ; `docs/verite-site.md` relève chaque
  affirmation actuelle de la page, sourcée (le cumul 2.0.0 n'y est plus). Le contexte d'origine de la demande (champ
  `origine` de D-2) ne s'écrit nulle part dans le code : R8 le lit au moment du test.
- Les données Nouveautés (`public/nouveautes-data/`) : toute session qui ajoute ou modifie une entrée lance
  `cd frontend && npm run news` et commite le JSON et les captures copiées (L21, 22-11 : la porte était rouge, le run
  ne les avait pas régénérées — `tests/nouveautes.test.mjs` compare au build frais).

- L74 (contraste de l'accent, revue r1 du 20-11) : le voile du fond fixe reste celui de L74 (décision de Sylvain) ;
  c'est le texte qui change. Plus aucun texte accent semi-transparent (`text-claude/60|70|80`) : intertitres du
  tableau de l'encyclopédie AetherWX, en-têtes du tableau SuperClaude, liens « Case study » / « Deep dive » et
  numéros des cartes, badge RSS, invite `$` passent en `text-claude` plein ; les liens de cartes de
  `/case-studies/` gardent un retour au survol par `hover:underline`.

- L21 (22-11) : rythme de revue 30 jours pour les cinq pages (la veille est hebdomadaire). Seul le résumé S47 existait
  dans `veille/` (S45, S46 absents). Le renommage Task → Agent (v2.1.63) n'a pas été revérifié : dit sur la page.
  Une actualité sans date de publication porte la date du relevé, marquée « Relevé le ».
- `tests/lib/e2e-dist.mjs` `worstPixelContrast` amène l'élément dans la vue avant de le capturer (L21 : le bloc de
  revue pousse le premier bouton « copier » de `/ecosystem/` sous le pli de 900 px).

- L88 (24-11, WCAG 1.4.10, passe 2 après la revue r1) — aucun mot coupé sans trait d'union à 320, 390 et 768 px,
  texte de 100 à 200 % :
  - `src/lib/cesure.mjs` (chargé par BaseLayout, servi en fichier `_astro/BaseLayout…js` via `assetsInlineLimit`)
    repère les seuls mots coupés de force par `overflow-wrap: anywhere` (ailleurs qu'après un trait d'union ou une
    barre oblique écrits, ou qu'à une césure dessinée). Un mot est enveloppé dans `<span data-cesure>` (seul en
    `hyphens: auto`, `hyphenate-limit-chars: 6 3 3`, global.css) ; après une élision (« d'implémentation ») seul le
    mot qui suit l'apostrophe ; un nom ou identifiant reçoit des `<wbr>` à ses bornes (après un signe, avant « ( »
    ou « < », camelCase, lettres/chiffres) ; un nombre soudé par une insécable (« 149 888 ») passe entier à la
    ligne ; dans un conteneur flex/grid le texte est d'abord mis dans un `<span>` (sinon chaque span devient une
    colonne). Repli pour un nom que rien ne coupe : double `<span data-cesure-vu aria-hidden>` (U+00AD, non
    sélectionnable) + `<span data-cesure-copie>` hors écran (nom accessible et texte copié sans U+00AD).
    Dans un îlot Vue, rien n'est posé dans le DOM : l'élément reçoit `data-cesure` (un nom y reste coupé par
    overflow-wrap, compté à part par le test). Tout est défait avant chaque calcul (recalcul à chaque changement
    de taille du <body> et après navigation) ; `<html data-cesure-mesure>` = taille du <body> au dernier calcul.
  - Le dictionnaire français de Chromium ne coupe pas « changé », « confiance » : les gouttières et cartes ne
    grandissent plus avec le texte. Une seule source : jetons `--spacing-borne-{3,4,5,6,10}` (`min(n × 0,25 rem,
    n × 4 px)`, `@theme static` de global.css) → utilités `p-borne-5`, `px-borne-4`, `-mx-borne-5`, `left-borne-3`… ;
    BookSchema lit `var(--spacing-borne-5/6)`. Aucune valeur `min(…rem,…px)` recopiée (test).
  - Les h1 (/, /nouveautes, /livre-de-bord, /plan-de-travail) et les chiffres de RtkStats sont revenus en rem
    (WCAG 1.4.4, F94 : ils doublent à 200 %) ; PageHero (/learning, /start…) reste borné en vw comme en prod.
  - Rendu au réglage normal : aucune césure posée de 390 à 1440 px à 100 % ; seuls des <wbr> là où la page
    servie coupait déjà un nom sans trait (5 pages, vérifié sur la page sans script).

## Tests

- `frontend/tests/l73-pourquoi-cadence.e2e.test.mjs` (lit `dist`) : besoins, définition, chiffres datés et sourcés,
  limites, liens, rien de privé, R12 : chaque nombre (`data-nombres`) cherché dans le fichier `data-source` du dépôt
  cadence quand il est à côté (CADENCE_REPO, ../cadence, ../../cadence ; sinon ignoré), pas de défilement latéral, texte du schéma ≥ 11 px et dans ses cadres à 390 et 1440 px. R8 : aucun morceau ni mot
  long du champ `origine` de `.cadence/demandes/D-2.json` sur la page. R16 : la Nouveauté du 19-11 suit la page.
- R17 : l'index lie la page par le titre d'une carte voisine de la carte cadence ; R18 : marge droite ≥ marge gauche
  de chaque libellé du schéma à 320, 390 et 1440 px.
- `frontend/tests/verite-site.test.mjs` R-L73 : section `/case-studies/pourquoi-cadence` sans cumul, chaque affirmation relevée.
- `frontend/tests/l74-contraste-accent.e2e.test.mjs` (lit `dist`, ~2 min) : `worstPixelContrast` compose la couleur du
  texte avec son alpha (et l'opacité des ancêtres) sur le pixel du fond ; un texte orangé marqué sans aucun pixel de
  glyphe reconnu fait échouer le test. Second test : liens « Case study » de `/case-studies/` (surface opaque) ≥ 4,5:1.
- `frontend/tests/l74-accent-opaque.test.mjs` : garde statique, aucune classe `text-claude/NN` (hors `hover:`/`focus:`).
- `frontend/tests/l21-revue-contenu.test.mjs` (module pur : rythme, retard, dates futures refusées, actualités
  datées et sourcées) et `l21-revue-contenu.e2e.test.mjs` (lit `dist` : bloc de revue de chaque page, actualités,
  contenus mis à jour, pas de débordement à 320/390, avertissement de retard dans le navigateur avec date simulée).
- L56/L58/L59 suivent le relevé du 22-11 (étoiles, minimums de cache, Fable 5.2).
- `frontend/tests/l88-cesure.e2e.test.mjs` (lit `dist`, ~5 min) : oracle `tests/lib/coupures.mjs`, indépendant du
  script — chaque coupure dans un mot est relevée sur le rendu et le trait vérifié sur l'image (capture texte
  visible / texte transparent) ; permises sans trait : après un signe, avant ( _ . ~ / <, camelCase,
  lettres/chiffres. Fautes : sans trait, moins de 3 lettres d'un côté, césure d'un mot qui tient sur sa ligne,
  3 lignes à trait de suite. Toutes les pages à 320/390/768 px × texte 100 à 200 %, `<details>` ouverts, images
  chargées ; aucun U+00AD lisible, pas de défilement latéral ; aucune césure posée à 100 % de 390 à 1440 px (des <wbr> seulement là où la prod coupait sans trait) ; page
  rendue à son DOM servi au retour à 100 % ; h1 « alexgreensh/|token-optimizer » ; copie et arbre
  d'accessibilité sans U+00AD ; h1 ×2 à 200 % ; navigation interne (clic, ClientRouter).

## Analyse statique (L94, D-31)

- `analyse:` de `cadence.yaml` : deux outils, lancés dans `frontend/` via `scripts/avec-node.sh` — `eslint`
  (`eslint-json`, config `frontend/eslint.config.mjs` : typescript-eslint recommended, vue flat/essential, sonarjs
  recommended, plus les seuils de cadence) et `tsc` (`--noEmit`, config `frontend/tsconfig.json`). Pas de ruff : aucun
  Python. Les `.astro` ne sont pas lus par ESLint ; tsc a besoin de `.astro/` (build ou `npx astro sync`).
- Base figée par le lead (`cadence analyse --init`, `.cadence/analyse/*.json`) ; aucune correction de l'existant. Mesure
  du 25-11 : eslint 187 violations dans 70 des 135 fichiers lus (~7 s), tsc 0 erreur après build (~3 s).
- Changer un seuil ou une exclusion = lot `config: true` du plan.

- L107 (27-11) : catalogue Tools tested de `/case-studies/` (`src/data/tools-tested.ts`, fiches récentes dans `tools-tested-recents.ts`, ajoutées en fin de liste : `tools-tested.ts` a une taille gelée par l'analyse) — fiches impeccable
  (reject + watchlist), hallmark (skillify : inventaire avant/après d'une refonte) et agent-browser (reject + watchlist,
  mesure contre le MCP Playwright), placées avant Omnara (radar). Un outil testé après le relevé commun
  (`TOOLS_SURVEYED_AT`) n'a ni `stars` ni `lastPush` : ses étoiles sont citées dans la description, pour que l'en-tête
  « relevées le … » reste vrai. Aucune fiche publique ne nomme une machine, un chemin, un lot ou une demande interne, ni
  le compte pro (`tests/l107-outils-27-11.test.mjs`).
