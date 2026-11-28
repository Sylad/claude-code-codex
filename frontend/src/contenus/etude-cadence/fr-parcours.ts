// L112 — textes FR de l'étude cadence, première partie (parcours, pièces, chiffres) ; découpés de fr.ts (max-lines).

// L104 — le schéma « plan relié aux commits » : une seule source pour le dessin (SVG, à 100 %) et sa version
// en liste (texte agrandi). L108 : le dessin vit dans components/site/cadence/, partagé avec la page anglaise.
export const PLAN_COMMITS = {
  groupes: [
    {
      qui: "Le plan · fichier YAML versionné",
      lien: "cité par",
      items: [
        { code: "L4", detail: "lot en cours", accent: true },
        { code: "L5", detail: "lot à faire" },
      ],
    },
    {
      qui: "Les commits · git",
      items: [
        { code: "fix(L4): …", detail: "cite le lot L4", accent: true },
        { code: "feat(L5): …", detail: "cite le lot L5" },
      ],
    },
  ],
  commandes: [
    { code: "raf commits L4", detail: "ce que le lot a produit" },
    { code: "raf now", detail: "la suite du travail" },
    { code: "raf check", detail: "commit sans lot, lot sans commit" },
  ],
};

export const parcours = [
  { titre: "Spec", detail: "fiche, maquette, tests d'acceptation verrouillés", qui: "session spec-writer, puis tests écrits à part" },
  { titre: "Code", detail: "fait passer les tests sans les modifier", qui: "session de code (Sonnet)" },
  { titre: "Revue", detail: "relecteur neuf : bugs, dérive, docs", qui: "Opus, qui n'a pas écrit le code" },
  { titre: "Correction", detail: "reprend ce que la revue a trouvé", qui: "session de correction (escalade Fable)", accent: true },
  { titre: "UX", detail: "application lancée, captures 1440 et 390 px", qui: "agent ux-reviewer" },
  { titre: "Prêt", detail: "le lead regarde les captures et décide", qui: "le lead confie au livreur : porte, livraison", accent: true },
];

// L103 (D-4) — le parcours d'un lot dans cadence 2, tel qu'il tourne aujourd'hui (`cadence run`). Le
// parcours V1 ci-dessus reste affiché plus bas, comme historique daté (le point de départ).
export const parcoursV2 = [
  { titre: "Lot choisi", detail: "le lead écrit le brief et lance le run", qui: "le lead" },
  { titre: "cadence run", detail: "une session fait tout le lot dans un worktree", qui: "Opus ; Fable dès la 3e passe de correction" },
  { titre: "Porte et intégration", detail: "build et tests, puis avance rapide sur main", qui: "cadence ; si rouge, la même session corrige" },
  { titre: "Revue", detail: "revue de code ; revue UX si le lot a un écran", qui: "relecteurs neufs, lancés par le lead", accent: true },
  { titre: "Livraison", detail: "CI attendue, déploiement joué, effet vérifié", qui: "le lead, par le livreur" },
  { titre: "QA", detail: "les pages livrées, ouvertes dans un navigateur", qui: "le lead, par l'agent QA", accent: true },
];

export const livreur = [
  { titre: "Lot prêt", detail: "revue passée, verdict UX enregistré" },
  { titre: "Porte de tests", detail: "tests et build rejoués sur le sha" },
  { titre: "Verdict UX", detail: "lu, pas refait : sinon la chaîne s'arrête" },
  { titre: "Clôture du lot", detail: "le plan note le lot livré" },
  { titre: "Push", detail: "le commit part vers le dépôt distant" },
  { titre: "Livraison vérifiée", detail: "CI attendue, déploiement joué, effet contrôlé" },
  { titre: "Une ligne rendue", detail: "« L84 livré 3d6edf4, QA à lancer <url> »", accent: true },
];

// L33 — le lead et ses créneaux : une seule source pour le dessin et sa version en liste (L104).
export const LEAD = {
  haut: { qui: "Le lead · session de pilotage", titre: "Choisit le lot suivant", detail: "dans l'ordre des priorités, un run par dépôt" },
  creneaux: [
    { titre: "Créneau occupé", code: "cadence run", detail: "une session, un dépôt" },
    { titre: "Créneau libre", code: "le lead le remplit", detail: "sans attendre", accent: true },
  ],
  bas: { qui: "Rendu au lead", titre: "Une ligne ou une question", detail: "le créneau se libère pour le lot suivant" },
  boucle: "Le créneau libéré reçoit aussitôt le lot suivant (pointillés).",
};

// L33 — la mémoire partagée : des fichiers, jamais la conversation.
export const MEMOIRE = {
  fichiers: [
    { titre: "Le plan", code: "raf.yaml", detail: "lots et verdicts" },
    { titre: "L'historique", code: "git log", detail: "commits et lots" },
    { titre: "Les journaux", code: ".cadence/runs", detail: "brief et porte" },
  ],
  session: { qui: "Chaque session neuve", titre: "Lit ces fichiers au départ", detail: "rien ne vient d'une conversation passée" },
  trace: { qui: "Ce qu'elle laisse", titre: "Un commit, un verdict, une note", detail: "écrits dans ces mêmes fichiers" },
  boucle: "Ce qu'elle laisse est relu par la session suivante (pointillés).",
};

// Un nombre ne se sépare ni de ses milliers ni de son unité en fin de ligne (règle du site, L88).
export const NBSP = "\u00a0";
export const insecable = (s: string) =>
  s.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`).replace(/(\d) (?=(?:s|min|k|M|px|j)(?!\p{L})|%)/gu, `$1${NBSP}`);

export const pieces = [
  {
    nom: "Le plan raf, relié aux commits",
    corps:
      "Le reste à faire est un fichier YAML versionné à côté du code : des lots, des sous-tâches, des notes. Chaque commit cite son lot (`fix(L4): …`) ; `raf commits L4` retrouve ce qu'un lot a produit, `raf now` dit la suite, `raf check` repère les écarts (un commit sans lot, un lot clos sans commit).",
    doc: "docs/raf.md",
  },
  {
    nom: "Les Nouveautés",
    corps:
      "Un lot visible n'est pas fini sans une entrée écrite du point de vue de l'utilisateur, avec une capture. `cadence news build` en fait un JSON que le site lit : la page Nouveautés de ce codex en vient.",
    doc: "docs/news.md",
  },
  {
    nom: "Les rituels de session",
    corps:
      "`cadence session start` rend l'état du travail au matin (lots en cours, commits des autres sessions, écarts) ; `cadence session close` fait l'hygiène du soir et sort en erreur tant que quelque chose reste ouvert. La mémoire d'une journée à l'autre est dans des fichiers, pas dans la tête de la conversation.",
    doc: "docs/session.md",
  },
  {
    nom: "La livraison vérifiée",
    corps:
      "`cadence deliver` attend la CI du commit, joue le déploiement, puis vérifie l'effet : une URL qui répond avec le bon sha, une commande qui sort à zéro. Une livraison est finie quand ses contrôles passent, pas quand un outil écrit « success ».",
    doc: "docs/deliver.md",
  },
  {
    nom: "Les vagues orchestrate",
    corps:
      "Un programme, sans modèle, lance des sessions Claude Code courtes et neuves, une par étape : contrôle préalable, fiche et maquette pour un écran, tests d'acceptation rouges et verrouillés, implémentation, revue, passe UX, corrections. Chaque session lit un brief, rend un résultat structuré et disparaît ; le journal de la vague garde la trace.",
    doc: "docs/orchestrate.md",
    v1: true,
  },
  {
    nom: "Le lead et les sous-agents",
    corps:
      "Une session de pilotage garde un contexte petit : elle lit des synthèses (`cadence lead tour`), décide avec l'humain des lots à jouer, relaie les questions des sessions et ne répond jamais à la place de l'humain. Le travail est fait par les sessions de la vague et par des agents spécialisés (relecteur de code, relecteur UX, rédacteur de fiche).",
    doc: "docs/lead.md",
  },
  {
    nom: "Le livreur délégué",
    corps:
      "Depuis la 1.26, le lead confie la livraison d'un lot prêt à l'agent `livreur` : porte de tests sur le sha, verdict UX, clôture du lot, push, livraison, puis une seule ligne rendue (`L84 livré 3d6edf4, QA à lancer <url>`) ou une seule question. Le lead garde son contexte pour décider, pas pour exécuter.",
    doc: "docs/lead.md",
  },
];

export const chiffres: { valeur: string; legende: string; source: string }[] = [
  {
    valeur: "61 % · 29 %",
    legende:
      "des 263 lots du premier relevé (10 octobre) avaient au moins une, puis au moins deux passes de correction après la première écriture.",
    source: "docs/mesures/corrections-2026-10-10.md",
  },
  {
    valeur: "136 passes",
    legende:
      "de cause « bug de code » sur 201 passes classables du 24 au 30 octobre ; 96 d'entre elles sont des cas limites. Le maillon dominant est donc le brief d'implémentation, qui demande depuis la 1.27 la liste des cas limites avant la première ligne de code.",
    source: "docs/mesures/bug-code-2026-10-30.md",
  },
  {
    valeur: "−4 211 jetons",
    legende:
      "au premier tour de chaque session de vague (42 541 → 38 330, −9,9 %) en désactivant les plugins de l'utilisateur, qui n'ont rien à faire dans une session qui lit, édite et lance des commandes.",
    source: "docs/mesures/contexte-session-2026-10-28.md",
  },
  {
    valeur: "565 Ko → 5 Ko",
    legende:
      "le plan d'un projet qui ne faisait que grossir, une fois les lots clos rangés par `raf archive` ; les commandes qui le lisent affichent la même chose avant et après.",
    source: "docs/whats-new.md (1.19.0)",
  },
  {
    valeur: "1 h 53 min",
    legende:
      "d'attente cumulée d'un créneau de session sur 199 vagues, un seul arrêt par le quota : de quoi décider de ne pas relever le plafond de sessions sans l'avoir mesuré.",
    source: "docs/mesures/attente-creneaux-2026-10-12.md",
  },
];
