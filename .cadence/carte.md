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
- Les données Nouveautés (`public/nouveautes-data/`) sont régénérées par `cadence run` avant la porte (L781 de
  cadence) : une session de run ne lance pas `npm run news`.

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
