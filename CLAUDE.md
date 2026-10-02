# claude-code-codex

## Plan, sessions et revue UX (cadence)

Le reste à faire vit dans `docs/plan/raf.yaml`, tenu par `raf`
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
ils échouent si le JSON versionné n'est plus à jour. Node ≥ 22.12 obligatoire pour Astro 6.

**Plan de travail** (page `/plan-de-travail/`, L15) : rendue AU BUILD depuis `docs/plan/raf.yaml`
(`frontend/src/lib/plan-public.ts`, dépendance `yaml`). N'est publié qu'un lot `visible: true`, non
abandonné, avec un **titre public** : son champ `public:` (une chaîne sur une ligne), sinon — lot livré
seulement — le titre de sa Nouveauté la plus récente ; les lots « Revue … », « Audit … »,
« Campagne … » exigent un `public:`. Jamais le titre brut, les notes, verdicts, raisons ni sous-tâches
(seulement leur décompte). Un titre public non conforme (> 80 caractères, « / », fichier, technique,
identifiant de lot, sécurité) ou un plan illisible fait **échouer le build**. Pour publier un lot
visible, lui donner un `public:` en français pour le visiteur. `tests/plan-page.e2e.test.mjs` cherche
tout texte privé du plan dans tout `dist/`. Dates : un seul formateur, `src/lib/format-date.mjs`
(« 1er octobre 2026 », « 20 h 42 »).

**Navigation** (L17, `frontend/src/components/site/Navbar.vue`) : barre du bureau dès 64em (`lg:`,
1024 px à la police par défaut — les requêtes média en rem suivent la taille de police du
navigateur, ne jamais passer en px ni fixer `html { font-size }` en px). Learning + Vidéos sous
« Ressources ▾ », Guides sous « Guides ▾ » : boutons à divulgation (`aria-expanded`/`aria-controls`,
jamais `role=menu` ni ouverture au survol, un seul panneau ouvert). « Nouveautés » toujours dans la
barre avec sa pastille ; « Plan de travail » et « À propos » n'y tiennent pas avec une vraie marge :
menu du téléphone et rangée du pied de page (`Footer.astro`, toutes les pages) + encart « Suivre
le site » de l'accueil. Toute entrée ajoutée à la barre se mesure avec `tests/navbar.e2e.test.mjs`
(seuil ±1 px, polices web bloquées, police par défaut 18 et 20 px : ≥ 16 px après le logo).
