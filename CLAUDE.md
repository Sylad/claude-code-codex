# claude-code-codex

## Plan, sessions et revue UX (cadence)

Le reste à faire vit dans `.cadence/raf.yaml`, tenu par `raf`
([cadence](https://github.com/Sylad/cadence)) : chaque commit cite son lot dans le
message (`fix(L4): …`, `L2/t1`), `raf now` dit la suite, `raf check` repère les
écarts. Début et fin de session : skills `/cadence:session-start` et
`/cadence:session-close`.

**Revue UX obligatoire** (règle de Sylvain du 2026-09-28, tous les projets perso) : toute nouvelle
page ou modification d'écran est un lot `--visible`, revu par l'agent `cadence:ux-reviewer` (captures
1440 et 390 px, écarts fondés sur une règle nommée ou une mesure) avant `raf done`. Le verdict
s'enregistre avec `raf ux <lot> "…"`, sinon `raf done` refuse. Les lots « Revue UX — … » planifient
la revue de chaque écran existant ; les écarts trouvés deviennent des sous-tâches du lot.

**Nouveautés** (page `/nouveautes/`, L13) : les entrées vivent dans `docs/nouveautes/*.md` (captures
dans `docs/nouveautes/captures/`). Après tout ajout ou modification d'une entrée, lancer
`cd frontend && npm run news` (= `cadence news build` vers `frontend/public/nouveautes-data/`) et
**commiter le résultat** : Cloudflare Pages construit sans cadence, la page lit ce JSON au build.
Tests : `cd frontend && npx astro build && npm test` (node --test ; les tests e2e lisent `dist`) —
ils échouent si le JSON versionné n'est plus à jour. Node ≥ 22.23.4 obligatoire pour Astro 7 (`.nvmrc`).

**Plan de travail** (page `/plan-de-travail/`, L15) : rendue AU BUILD depuis `.cadence/raf.yaml`
(`frontend/src/lib/plan-public.ts`, dépendance `yaml`). N'est publié qu'un lot `visible: true`, non
abandonné, avec un **titre public** : son champ `public:` (une chaîne sur une ligne), sinon — lot livré
seulement — le titre de sa Nouveauté la plus récente ; les lots « Revue … », « Audit … »,
« Campagne … » exigent un `public:`. Jamais le titre brut, les notes, verdicts, raisons ni sous-tâches
(seulement leur décompte). Un titre public non conforme (> 80 caractères, « / », fichier, technique,
identifiant de lot, sécurité) ou un plan illisible fait **échouer le build**. Pour publier un lot
visible, lui donner un `public:` en français pour le visiteur. `tests/plan-page.e2e.test.mjs` cherche
tout texte privé du plan dans tout `dist/`. Le titre de Nouveauté d'un lot visible sans `public:` est vérifié dès la vague (`newsTitleProblems`, `tests/l62-titres-publics.test.mjs`, tous états de lot), pas seulement au build. Dates : un seul formateur, `src/lib/format-date.mjs`
(« 1er octobre 2026 », « 20 h 42 »).

**Navigation** (L17, `frontend/src/components/site/Navbar.vue`) : barre du bureau dès 64em (`lg:`,
1024 px à la police par défaut — les requêtes média en rem suivent la taille de police du
navigateur, ne jamais passer en px ni fixer `html { font-size }` en px). Learning + Vidéos sous
« Ressources ▾ », Guides sous « Guides ▾ » : boutons à divulgation (`aria-expanded`/`aria-controls`,
jamais `role=menu` ni ouverture au survol, un seul panneau ouvert). « Nouveautés » toujours dans la
barre avec sa pastille ; « Plan de travail » et « À propos » n'y tiennent pas avec une vraie marge :
menu du téléphone et rangée du pied de page (`Footer.astro`, toutes les pages) + encart « Suivre
le site » de l'accueil. Toute entrée ajoutée à la barre se mesure dans les deux langues : barre française
par `tests/navbar.e2e.test.mjs`, barre anglaise par `tests/l111-barre-anglaise.e2e.test.mjs` (mesure partagée
`tests/lib/mesure-barre.mjs` ; seuil ±1 px, polices web bloquées, police par défaut 18 et 20 px : ≥ 16 px après le logo).

**Livre de bord** (page `/livre-de-bord/`, L44, lot récurrent chaque semaine) : une entrée par semaine ISO dans
`frontend/src/data/livre-de-bord.ts`, la plus récente EN TÊTE (rubriques `appris`, `fabrique`, `teste` ; sources :
notes de clôture du plan, CHANGELOG et docs de cadence, Nouveautés, verdicts Tools tested). Filtre strict appliqué
au build par `src/lib/livre-de-bord.ts` : aucun chemin de machine, secret, nom de machine, compte pro, e-mail ni
mention de confidentialité ; liens seulement vers une page du site qui existe ou le dépôt public de cadence ; date
dans la semaine, une seule entrée par semaine. Une entrée refusée fait échouer le build. Tests :
`tests/livre-de-bord.test.mjs` et `tests/livre-de-bord-page.e2e.test.mjs`. Lien dans le pied de page (`Footer.astro`).

**Deux langues** (L108, contenu partagé depuis L112) : le site est en français aux adresses de toujours, et **chaque
page existe aussi sous `/en/`** (i18n d'Astro dans `astro.config.mjs`, `prefixDefaultLocale: false`). Une page traduite
(adresse dans `TRADUITES` de `frontend/src/lib/langues.mjs`, à ce jour `/case-studies/cadence/`) a son texte anglais ;
les autres sont servies sous `/en/` par la route générale `src/pages/en/[...page].astro` : texte français dans
`<div lang="fr">`, bandeau « Not translated yet. », canonique vers la page française, aucun `hreflang` alternatif.
**Un seul contrôle de langue, global, dans la barre** (`Navbar.vue`, `data-selecteur-langue` ; sur téléphone en tête
du menu) : il mène à la même adresse dans l'autre langue (`autreLangue`), depuis la 404 à l'accueil de l'autre ; aucun
sélecteur dans les pages. La 404 anglaise est construite en `dist/en/404.html` (intégration de `astro.config.mjs`),
que Cloudflare Pages sert sous `/en/`. Le contenu d'un composant commun suit `langueDuContenu` (français sur une page
non traduite), pas `Astro.currentLocale`. **Barre et pied** (L111) : leurs libellés vivent dans une source unique par
langue, `frontend/src/lib/libelles-site.mjs` (jamais en dur dans `Navbar.vue` ni `Footer.astro`) ; sur /en/ ils sont
en anglais, leurs liens restent sous /en/, et un lien vers une page restée en français porte `hreflang="fr"`
(`lienDans`). La barre du bureau est pleine entre 64em et 80em : toute entrée ajoutée se mesure dans les deux langues
(`tests/navbar.e2e.test.mjs`, `tests/l111-barre-anglaise.e2e.test.mjs`, mesure partagée `tests/lib/mesure-barre.mjs`).
**Traduire une page** (contenu partagé, jamais une copie de la mise en page) : 1. déplacer sa mise en page dans
`frontend/src/components/pages/<Page>.astro`, qui reçoit `langue` ; 2. ses textes courts dans un dictionnaire par
langue (prolonger `libelles-site.mjs` ou un `src/contenus/<page>.mjs` `{ fr, en }`), ses textes longs dans
`src/contenus/<page>/fr.ts` et `en.ts` (mêmes clés ; modèle : `etude-cadence/`) ; 3. réduire
`src/pages/<page>.astro` et `src/pages/en/<page>.astro` à une enveloppe `<Page langue="fr|en" />` ; 4. ajouter
l'adresse (barre finale) à `TRADUITES`. Chiffres, dates et sources identiques, écrits à l'anglaise (`formatDayEn`).
**Règle : une page française traduite qui change → son texte anglais change dans le même lot.** Tests :
`tests/l112-contenu-partage.test.mjs` (enveloppes seulement sous `src/pages/en/`, part de mise en page copiée ≤ 5 %,
liste des pages sans anglais, mêmes clés fr/en), `tests/l112-langue-globale.e2e.test.mjs` (chaque page sous /en/,
bandeau, contrôle unique, liens /en/, 404 anglaise, parcours au clic), `tests/l108-langues.test.mjs` et
`tests/l108-langues.e2e.test.mjs` (hreflang, mêmes nombres, liens externes et captures des deux versions, carte par
carte) — ils ne voient pas une phrase sans chiffre ajoutée d'un seul côté : la règle reste à tenir à la main.
