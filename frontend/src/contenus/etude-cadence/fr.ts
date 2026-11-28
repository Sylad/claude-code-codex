/*
  L112 — textes français de l'étude de cas de cadence (/case-studies/cadence/). La mise en page est
  src/components/pages/EtudeCadence.astro, partagée avec la version anglaise (en.ts, mêmes clés).
  Historique du contenu (L19, L33, L93, L103, L104) : voir les commentaires des données ci-dessous.
  L19 — contenu tiré du dépôt public Sylad/cadence (README, docs/whats-new.md, CHANGELOG, docs/mesures/,
  docs/perf/) : chaque chiffre y a sa source, nommée dans la section « Les chiffres mesurés ». Rien de privé :
  pas de machine, pas de chemin, pas de compte pro.
  L93 (D-3) : la méthode des vagues et les chiffres d'octobre sont ceux de la V1 (versions 1.x), dit comme tel ;
  chaque chiffre du chapitre « Le problème de la V1 » a son fichier, sa date et sa version (data-nombres /
  data-source, vérifiés contre le dépôt cadence par tests/l93-cadence-v1.e2e.test.mjs).
  Règle (L108) : un changement ici a son pendant dans en.ts, dans le même lot.
*/
import { DESIGN, TEMPS_LOT, doc, html } from "./commun";

// L104 — le schéma « plan relié aux commits » : une seule source pour le dessin (SVG, à 100 %) et sa version
// en liste (texte agrandi). L108 : le dessin vit dans components/site/cadence/, partagé avec la page anglaise.
const PLAN_COMMITS = {
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

const parcours = [
  { titre: "Spec", detail: "fiche, maquette, tests d'acceptation verrouillés", qui: "session spec-writer, puis tests écrits à part" },
  { titre: "Code", detail: "fait passer les tests sans les modifier", qui: "session de code (Sonnet)" },
  { titre: "Revue", detail: "relecteur neuf : bugs, dérive, docs", qui: "Opus, qui n'a pas écrit le code" },
  { titre: "Correction", detail: "reprend ce que la revue a trouvé", qui: "session de correction (escalade Fable)", accent: true },
  { titre: "UX", detail: "application lancée, captures 1440 et 390 px", qui: "agent ux-reviewer" },
  { titre: "Prêt", detail: "le lead regarde les captures et décide", qui: "le lead confie au livreur : porte, livraison", accent: true },
];

// L103 (D-4) — le parcours d'un lot dans cadence 2, tel qu'il tourne aujourd'hui (`cadence run`). Le
// parcours V1 ci-dessus reste affiché plus bas, comme historique daté (le point de départ).
const parcoursV2 = [
  { titre: "Lot choisi", detail: "le lead écrit le brief et lance le run", qui: "le lead" },
  { titre: "cadence run", detail: "une session fait tout le lot dans un worktree", qui: "Opus ; Fable dès la 3e passe de correction" },
  { titre: "Porte et intégration", detail: "build et tests, puis avance rapide sur main", qui: "cadence ; si rouge, la même session corrige" },
  { titre: "Revue", detail: "revue de code ; revue UX si le lot a un écran", qui: "relecteurs neufs, lancés par le lead", accent: true },
  { titre: "Livraison", detail: "CI attendue, déploiement joué, effet vérifié", qui: "le lead, par le livreur" },
  { titre: "QA", detail: "les pages livrées, ouvertes dans un navigateur", qui: "le lead, par l'agent QA", accent: true },
];

const livreur = [
  { titre: "Lot prêt", detail: "revue passée, verdict UX enregistré" },
  { titre: "Porte de tests", detail: "tests et build rejoués sur le sha" },
  { titre: "Verdict UX", detail: "lu, pas refait : sinon la chaîne s'arrête" },
  { titre: "Clôture du lot", detail: "le plan note le lot livré" },
  { titre: "Push", detail: "le commit part vers le dépôt distant" },
  { titre: "Livraison vérifiée", detail: "CI attendue, déploiement joué, effet contrôlé" },
  { titre: "Une ligne rendue", detail: "« L84 livré 3d6edf4, QA à lancer <url> »", accent: true },
];

// L33 — le lead et ses créneaux : une seule source pour le dessin et sa version en liste (L104).
const LEAD = {
  haut: { qui: "Le lead · session de pilotage", titre: "Choisit le lot suivant", detail: "dans l'ordre des priorités, un run par dépôt" },
  creneaux: [
    { titre: "Créneau occupé", code: "cadence run", detail: "une session, un dépôt" },
    { titre: "Créneau libre", code: "le lead le remplit", detail: "sans attendre", accent: true },
  ],
  bas: { qui: "Rendu au lead", titre: "Une ligne ou une question", detail: "le créneau se libère pour le lot suivant" },
  boucle: "Le créneau libéré reçoit aussitôt le lot suivant (pointillés).",
};

// L33 — la mémoire partagée : des fichiers, jamais la conversation.
const MEMOIRE = {
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
const NBSP = "\u00a0";
const insecable = (s: string) =>
  s.replace(/(\d) (?=\d{3}(?!\d))/g, `$1${NBSP}`).replace(/(\d) (?=(?:s|min|k|M|px|j)(?!\p{L})|%)/gu, `$1${NBSP}`);

const pieces = [
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

const chiffres: { valeur: string; legende: string; source: string }[] = [
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

const echecs = [
  {
    id: "classement",
    titre: "Un classement des corrections qui se trompait presque toujours",
    corps:
      "Pour savoir pourquoi les lots étaient corrigés, un modèle local classait chaque passe par cause. Au premier essai il mettait 169 passes sur 254 en « spec floue » et ne s'accordait avec une relecture à la main que sur 5 passes sur 24.",
    change:
      "Le prompt a été resserré (le bug de code par défaut, « spec floue » seulement si le constat dit que l'énoncé est flou) : accord de 17 sur 24 (71 %). Chaque mesure publiée dit désormais qui l'a faite et ce qui n'a pas été relu.",
  },
  {
    id: "regression-apparente",
    titre: "Une régression qui n'en était qu'à moitié une",
    corps:
      "`cadence perf` du 18 octobre annonçait 51 % de lots livrés en moins et des durées de revue en hausse de près de 50 %. Ventilées par projet et à effort égal, les hausses tombaient à +12 % ou 0 % pour l'implémentation, et le recul des livraisons à −35 % une fois écartées des copies de travail comptées deux fois.",
    change:
      "`cadence perf` ne lit plus les dossiers de copies de travail (`tmp/`), et la ventilation qui a fait tomber ces chiffres est un script versionné qui se rejoue sur les journaux.",
  },
  {
    id: "publication",
    titre: "Une version publiée sur le papier, jamais arrivée sur npm",
    corps:
      "À quatre reprises (1.5.0, 1.14.0, 1.16.0, 1.25.0), le tag est parti mais la version n'a jamais atteint npm. Pour la 1.25.0, les tests lisaient un fichier de types que l'éditeur écrit en chargeant un module et que git ne suit pas : aucun de nos arbres de travail ne pouvait le voir manquer.",
    change:
      "Les tests passent dans un clone neuf, et `cadence release` rejoue le commit de version dans un clone neuf avant de rendre la main. Chaque version perdue a été republiée sous un numéro de correction.",
  },
  {
    id: "reglages-copies",
    titre: "Une première conception du contexte allégé, abandonnée",
    corps:
      "Pour alléger le contexte des sessions de vague, une première idée écartait tout le dossier de réglages de l'utilisateur et en relayait une copie dans un fichier temporaire : −29 % de jetons. Mais la copie recopiait des secrets en lecture large, jamais supprimée, et ignorait des variables de configuration.",
    change:
      "On a gardé un gain plus modeste (−9,9 %) qui ne copie rien : un seul réglage désactive les plugins, et il se fusionne avec les réglages existants au lieu de les remplacer.",
  },
  {
    id: "mesure-manquante",
    titre: "Un mécanisme posé sans pouvoir dire s'il a servi",
    corps:
      "Le premier bloc de consignes contre les bugs de code (brief d'implémentation) a été livré sans mesure « après » : les vagues déjà lancées gardent le brief de leur création.",
    change:
      "Le protocole de mesure date maintenant la mise en service, ne compte que les vagues créées après, et mesure les deux mécanismes ensemble sur deux fenêtres de sept jours. Tant que ces fenêtres ne sont pas relevées, la page n'annonce aucun gain.",
  },
];

// L93 (D-3) — « Le problème de la V1 ». Chaque nombre de `nombres` figure à sa place des deux côtés
// (test R7 de l93-cadence-v1) : dans le texte de la carte qui l'affiche, et dans l'un des `passages`,
// extraits recopiés mot pour mot du fichier `source` du dépôt cadence (gras markdown et retours à la
// ligne mis à part). Un nombre trouvé ailleurs dans le fichier ne compte pas.

const v1Mesures = [
  {
    id: "essai",
    valeur: "×3,8 · ×4,5",
    quand: "7 novembre 2026 · la 1.62, dernière de la V1",
    legende:
      "Contre Claude seul, sur les mêmes 8 vraies demandes : 199 min contre 52 min, et 5,7 M de jetons contre 1,27 M. Le lead a dû intervenir 12 fois, contre 0 pour Claude seul.",
    nombres: "3,8 4,5 8 199 52 5,7 1,27 12 1.62",
    passages: [
      "Essai sur 8 vraies demandes, même commit de départ",
      "| A — Opus seul | B — cadence 1.62 |",
      "| Temps | 52 min | 199 min (×3,8) |",
      "| Tokens | 1,27 M | 5,7 M (×4,5) |",
      "| Interventions du lead | 0 | 12 |",
    ],
    source: DESIGN,
  },
  {
    id: "lot",
    valeur: "25 min · 266 k",
    quand: "1er novembre 2026 · vagues des versions 1.8 à 1.36",
    legende:
      "Le coût moyen d'un lot, sur 721 lots des vagues du 17 octobre au 1er novembre : 25 minutes de temps écoulé dans la vague et 266 k jetons comptés, plus 19 minutes en moyenne où le lot attendait le lead, le budget ou la nuit.",
    nombres: "25 266 721 19",
    passages: [
      "A lot costs 25 minutes of wave wall on average (18 022 min over 721 lots) and 266 k counted tokens, to which 13 972 min of suspension are added (19 min per lot",
    ],
    source: TEMPS_LOT,
  },
  {
    id: "tests",
    valeur: "62 % · 4,6 fois",
    quand: "1er novembre 2026 · mêmes vagues",
    legende:
      "Les tests prenaient 62 % du temps d'une session d'écriture : la suite complète d'un lot tournait 4,6 fois en moyenne, lancée par la session puis rejouée par la porte de la vague après chaque session. Écrire le code lui-même : 6 %.",
    nombres: "62 4,6 6",
    passages: [
      "Tests are the first cost of a writing session: 62 % of its wall",
      "a lot's suite runs 4.6 times on average",
      "| écriture | 524,7 | 6 % |",
    ],
    source: TEMPS_LOT,
  },
  {
    id: "revue",
    valeur: "42 % · 41 %",
    quand: "1er novembre 2026 · mêmes vagues",
    legende:
      "Les jetons comptés partaient d'abord dans la revue (42 %) et dans les passes de correction (41 %) : 620 passes, chacune 11,9 min et 126 k jetons, porte et nouvelle revue comprises.",
    nombres: "42 41 620 11,9 126",
    passages: [
      "| revue | 4294,6 | 24 % | 6,0 | 81 239 k | 42 % |",
      "620 passes, each costing 11.9 min and 126 k counted tokens (correction, gate, and the review that follows) — 7 366 min and 78 M tokens, 41 % of the counted tokens of the window",
    ],
    source: TEMPS_LOT,
  },
];

const v1Causes = [
  {
    id: "C1",
    titre: "Juger contre une fiche figée, pas contre la demande",
    corps: "Fiche, maquette et tests d'acceptation scellés servaient de référence : 101 rescellements et 13 lots rendus pour un verrou en 30 jours.",
    nombres: "101 13 30",
    mesuree: true,
    passages: ["101 rescellements et 13 lots rendus pour verrou en 30 j"],
  },
  {
    id: "C2",
    titre: "Un contexte découpé entre sessions",
    corps: "Le code s'écrivait en Sonnet, en plusieurs sessions successives par lot : chaque étape repartait d'une session neuve.",
    nombres: "",
    mesuree: false,
    passages: [],
  },
  {
    id: "C3",
    titre: "Des portes empilées",
    corps: "Sur une retouche, 4 portes : 24 min de porte pour 4 min de travail. La porte « fin de lot » n'avait jamais trouvé seule un rouge.",
    nombres: "4 24",
    mesuree: true,
    passages: ["Retouche : 4 portes, 24 min de porte pour 4 min de travail"],
  },
  {
    id: "C4",
    titre: "Des mécanismes ajoutés sans mesure",
    corps: "Le code est passé de 6 400 à 39 300 lignes en un mois, avec 27 options pour lancer une vague.",
    nombres: "6400 39300 27",
    mesuree: true,
    passages: ["src : 6 400 → 39 300 lignes en un mois, 27 options d'orchestrate"],
  },
  {
    id: "C5",
    titre: "Un lead qui rattrape la machine",
    corps: "12 interventions du lead sur 8 demandes, là où Claude seul n'en demandait aucune.",
    nombres: "12 8",
    mesuree: true,
    passages: ["12 interventions sur 8 demandes"],
  },
];

type Preuve = { fichier: string; quand: string; nombres: string; passages?: string[] };
// `causes` : les causes C1 à C5 auxquelles la décision répond, d'après la colonne « Contre-mesure v2 » du
// tableau §0 du design (vide quand la décision vient d'une mesure postérieure : la carte dit alors qu'elle ne répond à aucune des cinq causes et l'explique dans son corps).
const v2Decisions: { id: string; titre: string; causes: string[]; corps: string; effet: string; mesure: boolean; preuves: Preuve[] }[] = [
  {
    id: "run",
    titre: "Une demande, une session : cadence run",
    causes: ["C1", "C2", "C3"],
    corps:
      "Depuis la 2.0.0 (10 novembre 2026), `cadence run` remplace les vagues pour faire une demande : un seul responsable, dans sa copie de travail, écrit le code et les tests, et corrige dans la même session. La demande, gardée mot pour mot, sert de référence : plus de fiche ni de test scellé. La suite complète tourne une fois, avant l'intégration.",
    effet:
      "Mesuré au banc contre Claude seul, sur quelques demandes : les résultats, favorables et défavorables, sont sur la page Pourquoi cadence.",
    mesure: true,
    preuves: [
      { fichier: "docs/v2/2026-11-09-cadence-run.md", quand: "9 novembre 2026", nombres: "" },
      { fichier: "docs/v2/publications/2.0.0.md", quand: "10 novembre 2026 · la 2.0.0", nombres: "2.0.0", passages: ["# Dossier de publication 2.0.0"] },
    ],
  },
  {
    id: "banc",
    titre: "Un banc avant tout mécanisme, en trois niveaux",
    causes: ["C4", "C5"],
    corps:
      "Aucun mécanisme n'entre sans un banc où il gagne contre Claude seul. Le banc de la semaine avait duré plus de 5 h le 13 novembre : il est découpé en trois niveaux. Le micro (environ 8 min) sert pendant un changement ; le mécanique, sans juge IA (environ 30 min visées), est la garde de publication depuis la 2.0.9 ; le complet, avec juges, tourne le samedi.",
    effet:
      "Le critère « temps total ≤ 1,5 × Claude seul » sortait rouge 4 fois sur 9 entre deux bras identiques. Depuis la 2.0.10, l'écart naturel de chaque banc est compté, pris comme la médiane de ses dernières paires de bras identiques : rejoués avec cette règle, ces 9 passages donnent encore 3 rouges de temps, et 1 seul quand le passage jugé est laissé hors du calcul de l'écart. Le seuil s'affine à mesure que les paires s'accumulent.",
    mesure: true,
    preuves: [
      {
        fichier: "docs/v2/banc.md",
        quand: "13 au 15 novembre 2026 · de la 2.0.5 à la 2.0.9",
        nombres: "5 8 30",
        passages: [
          "le banc hebdo, garde de publication, a duré plus de 5 h",
          "| aucun juge IA | ≈ 8 min |",
          "| aucun juge IA | ≈ 30 min |",
        ],
      },
      {
        fichier: "docs/v2/banc.md",
        quand: "15 novembre 2026 · la 2.0.10",
        nombres: "1,5 4 9 3 1",
        passages: [
          "1,5 × A dans « temps total »",
          "Mesure, rejouée sur les 9 rapports du 13-11 17:17 au 15-11 17:49 (10 paires au banc 3) : 4 passages rouges de temps avant",
          "Avec la médiane des 3 dernières paires (correctif de revue L738), il en reste 3 (14-11 00:02, 15-11 15:40, 15-11 17:49)",
          "Rejouée en laissant chaque fois le passage jugé hors du calcul du bruit, il en reste 1 (14-11 00:02",
        ],
      },
      { fichier: "CHANGELOG.md", quand: "15 novembre 2026 · la 2.0.10", nombres: "" },
    ],
  },
  {
    id: "modeles",
    titre: "Un modèle choisi pour chaque rôle",
    causes: ["C2"],
    corps:
      "En V1, le code s'écrivait en Sonnet et la revue se faisait en Opus, dans des sessions séparées. Cadence 2 confie toute la demande à un seul responsable Opus ; après deux tours de correction sans succès, Fable reprend. Les agents qui ne jugent rien descendent : depuis la 2.0.13 (17 novembre), le livreur tourne sur Sonnet au lieu d'hériter d'Opus.",
    effet:
      "Pas encore publié : la mesure avant et après (jetons Opus par livraison, sur 5 livraisons de chaque côté, sans livraison ratée de plus) est écrite, son résultat n'est pas encore dans le dépôt.",
    mesure: false,
    preuves: [
      { fichier: "docs/perf/goulot-2026-10-18.md", quand: "18 octobre 2026 · V1", nombres: "" },
      { fichier: DESIGN, quand: "7 novembre 2026", nombres: "" },
      { fichier: "docs/mesures/modele-agents-l757.md", quand: "17 novembre 2026 · la 2.0.13", nombres: "5", passages: ["sur 5 livraisons chacun"] },
    ],
  },
  {
    id: "contexte",
    titre: "Un contexte de départ allégé",
    causes: [],
    corps:
      "Cette décision ne vient pas du document de conception : elle part d'une mesure faite après lui. Avant son premier geste, chaque session de `cadence run` recevait environ 62 k jetons de contexte, relevés poste par poste le 11 novembre. Une partie ne servait à rien dans une session de travail : extensions de l'utilisateur, connecteurs du compte, mémoire automatique. Depuis la 2.0.4, ils sont coupés pour la session, comme les vagues coupaient déjà les extensions.",
    effet:
      "Premier tour de 64 844 à 57 653 jetons (−11,1 %), soit environ 0,12 $ par lot (−5,0 %). Mesuré avec Haiku sur une consigne minimale ; l'effet sur la qualité n'est pas mesuré.",
    mesure: true,
    preuves: [
      {
        fichier: "docs/mesures/socle-session-2026-11-11.md",
        quand: "11 et 12 novembre 2026 · la 2.0.4",
        nombres: "62 64844 57653 11,1 0,12 5,0",
        passages: [
          "62 k jetons : c'est le",
          "sans supplément) | 64 844 (64 846) |",
          "| code de L705, C2 + C3 + C4 (défaut) | 57 653 (57 652) | −7 191 (−11,1 %) |",
          "0,12 $ par lot (−5,0 %)",
        ],
      },
    ],
  },
  {
    id: "code",
    titre: "Un budget de lignes, et le code des vagues à retirer",
    causes: ["C4"],
    corps:
      "Le code de cadence 2 a un budget de lignes vérifié par la CI. Une étude du 15 novembre compte 11 404 lignes (36 % du code hors cadence 2) et 3 444 cas de test sur 9 013 qui ne servent qu'aux vagues : leur retrait est proposé pour une version majeure.",
    effet: "Pas encore d'effet à mesurer : au 24 novembre, rien n'est retiré.",
    mesure: false,
    preuves: [
      { fichier: DESIGN, quand: "7 novembre 2026", nombres: "" },
      { fichier: "docs/etudes/retrait-vagues.md", quand: "15 novembre 2026", nombres: "11404 36 3444 9013", passages: ["11 404 lignes de déclarations (36 % du code", "Sur 9 013 cas", "3 444 cas (38 %) ne testent que les vagues"] },
    ],
  },
];
const LIEN_V1 = `<a href="#le-probleme-de-la-v1">« Le problème de la V1 »</a>`;

export const FR = {
  insecable,
  page: {
    title: "Cadence",
    description:
      "Étude de cas de cadence, la méthode de travail et l'outil de ce codex : un plan versionné relié aux commits, des sessions IA lancées par un programme, des livraisons prouvées par leur effet. Le problème, la méthode et les chiffres de la V1 (vagues de sessions, versions 1.x), ses échecs, et pourquoi cadence 2 l'a remplacée : mesures de temps et de jetons, décisions prises.",
  },
  hero: {
    eyebrow: "Case study · cadence",
    title: "Un plan relié aux commits, des sessions IA mesurées",
    intro:
      "Cadence est la méthode de travail derrière les projets de ce codex : un plan versionné à côté du code, des sessions Claude Code lancées par un programme, des livraisons prouvées par leur effet. Né le 28 septembre 2026, il a connu deux générations. La V1 (versions 1.x) faisait passer chaque lot par une vague de sessions courtes ; cadence 2, depuis le 10 novembre, confie chaque demande à une seule session. Le parcours d’un lot décrit ci-dessous est celui de cadence 2 ; le parcours des vagues et les chiffres d’octobre sont ceux de la V1, gardés comme point de départ, et le dernier chapitre dit ce qu’elle coûtait et ce qui a changé.",
  },
  donnees: { PLAN_COMMITS, parcours, parcoursV2, livreur, LEAD, MEMOIRE, pieces, chiffres, echecs, v1Mesures, v1Causes, v2Decisions },
  probleme: {
    eyebrow: "Le problème de départ",
    h1: "Deux questions qui reviennent sans cesse",
    p1: html`Coder avec une IA fait aller vite, et perdre le fil tout aussi vite. Deux
        questions reviennent sans cesse : <strong>qu'est-ce qui reste à faire ?</strong>
        et <strong>à quoi servait ce commit ?</strong> Dans une conversation, la
        réponse s'évapore à la fin de la session ; dans un outil de tickets, elle
        vit loin du code et se périme.`,
    h2: "Ce que ça coûtait",
    p2: html`Avec huit projets menés en parallèle et plusieurs sessions par jour, le
        coût devenait visible : des lots recommencés, des commits sans raison
        écrite, des livraisons « réussies » qui ne faisaient pas ce qu'on croyait.
        Le premier commit de cadence (28 septembre 2026) ne contient d'ailleurs
        que l'essentiel : un plan en YAML et le calcul du lien entre commits et lots.`,
    principeTitre: "Le principe retenu",
    principe: html`<strong>Tout l'état vit dans des fichiers ordinaires à côté du code</strong>,
          lisibles par l'humain comme par la prochaine session, et chaque
          affirmation (« c'est livré », « c'est testé ») doit pouvoir être rejouée.`,
  },
  methode: {
    eyebrow: "La méthode",
    piecesTitre: "Sept pièces qui s'emboîtent",
    piecesIntro: html`Sept pièces, chacune optionnelle, qui s'emboîtent. Le détail de chaque
        commande est dans la documentation du dépôt ; ici, ce que chacune
        règle.`,
    piecesV1: html`Six d'entre elles restent dans cadence 2. La cinquième, les vagues
        orchestrate, est celle de la <strong>V1 (versions 1.x)</strong> : depuis
        le 10 novembre 2026, une demande se fait avec <code>cadence run</code>,
        une seule session (chapitre ${LIEN_V1}).`,
    v1Seulement: "V1 seulement",
    planTitre: "Le plan, relié aux commits",
    planIntro: html`Tout part du plan : un lot a un numéro, et chaque commit qui travaille
        dessus le cite. Le lien se lit dans les deux sens, sans base de données.`,
    planSchema: {
      titre: "Le plan relié aux commits",
      desc: "Un fichier de plan contient les lots L4 et L5. Les commits « fix(L4) » et « feat(L5) » citent chacun leur lot. Les commandes raf commits, raf now et raf check lisent ce lien et en tirent ce qu'un lot a produit, la suite du travail et les écarts.",
      legende: "Le plan (un fichier YAML) liste des lots ; chaque commit cite son lot dans son message ; trois commandes lisent ce lien.",
    },
    parcoursTitre: "Le parcours d'un lot dans cadence 2",
    parcoursP1: html`Depuis le 10 novembre 2026, un lot se fait avec <code>cadence run</code> :
        une seule session Opus le prend de bout en bout, dans une copie de
        travail à part (un worktree). Le programme cadence rejoue ensuite la
        porte complète (build et tests) ; si elle est rouge, la même session
        corrige et la repasse. Le travail arrive ensuite sur <code>main</code>
        par avance rapide, sans commit de fusion. Le lead lance alors la revue de code, et la revue
        UX si le lot touche un écran.`,
    parcoursP2: html`Une revue non conforme relance un <code>cadence run</code> de
        correction, qui repasse la porte puis la revue. Dès la troisième passe de
        correction, ou après deux revues non conformes, la correction est confiée à Fable.
        Le lot revu, le lead le livre et fait vérifier les pages livrées (QA).`,
    parcoursSchema: {
      legende: "Les six étapes d'un lot dans cadence 2. Une revue non conforme relance un run de correction : la boucle en pointillés. Cadre orange : les deux contrôles faits par un regard neuf, la revue et la QA.",
      boucle: "non conforme : correction",
      titre: "Le parcours d'un lot dans cadence 2",
      desc: "Six étapes dans l'ordre, chacune avec qui la fait. Une boucle en pointillés ramène de la revue à un nouveau cadence run de correction tant que la revue n'est pas conforme ; dès la troisième passe de correction, ou après deux revues non conformes, la correction passe à Fable.",
    },
    retenirTitre: "À retenir",
    retenir: html`Le lead choisit les lots à jouer, mais aucune étape ne se croit sur
          parole : chacune laisse une trace (sha, verdict, capture) que la
          suivante relit.`,
    livraisonTitre: "La livraison, déléguée",
    livraison: html`Un lot prêt n'est pas livré pour autant. Le lead le confie au livreur,
        qui joue la porte et la livraison (chaîne ci-dessous) et ne rend qu'une ligne ou une question ;
        le lead regarde les captures et décide.
        Les lots visibles se lisent dans le panneau du plan publié sur ce site.`,
    livreurSchema: {
      legende: "La chaîne du livreur, du lot prêt à la ligne rendue au lead. Une étape qui échoue arrête la chaîne.",
      titre: "La chaîne du livreur",
      desc: "Sept étapes dans l'ordre, du lot prêt à la ligne rendue au lead. Une étape qui échoue arrête la chaîne.",
    },
    panneauAlt: "Le panneau des lots de la page Plan de travail : la section « Prévu » et la liste des lots à venir, chacun avec son titre public.",
    panneauLegende: "Le panneau des lots tel que le publie la page Plan de travail : un titre par lot, rangé en cours, prévu ou livré.",
    leadTitre: "Le lead et ses créneaux",
    lead: html`Le lead ne code pas : il tient des créneaux. Chaque créneau est une
        session qui travaille, au plus une par dépôt pour que deux runs ne se
        marchent pas dessus. Dès qu'un run rend la main (une ligne, ou une
        question), le lead relit le résultat et remplit le créneau libéré avec
        le lot suivant du plan, sans attendre qu'on le lui demande. Une question
        se tranche tout de suite quand la réponse est réversible et sourcée ;
        le reste remonte à l'humain, pendant que les autres créneaux continuent.`,
    leadSchema: {
      titre: "Le lead et ses créneaux",
      desc: "Le lead, une session de pilotage, choisit le lot suivant dans l'ordre des priorités, un run par dépôt. Il remplit deux sortes de créneaux : un créneau occupé par un cadence run, une session dans un dépôt, et un créneau libre qu'il remplit sans attendre. Le run occupé rend au lead une ligne ou une question ; le créneau se libère alors pour le lot suivant.",
      legende: "Le lead remplit les créneaux de session, un run par dépôt ; chaque run rend une ligne ou une question. Pointillés : le créneau libéré reçoit aussitôt le lot suivant.",
    },
    hudAlt: "La bande du mod cadence-hud le 8 octobre 2026 : en tête, le contexte de la session et les quotas ; puis deux projets, chacun avec le lot en cours, son étape (revue, implémentation), le modèle qui la joue, les lots en attente, le budget de jetons et « 1 session/2 ».",
    hudLegende: html`Ce que voit le lead : la bande du mod <code class="font-mono text-claude-soft">cadence-hud</code>,
          capturée le 8 octobre 2026, au temps de la V1 (vagues orchestrate). Une ligne par projet
          en cours, avec son lot, l'étape, le modèle et les lots en attente ; « 1 session/2 » y
          compte les créneaux occupés sur le plafond réglé ce jour-là. Toucher l'image l'ouvre en
          taille réelle.`,
    memoireTitre: "Une mémoire en fichiers, jamais dans la conversation",
    memoire: html`Les sessions sont neuves et courtes : aucune ne se souvient de la
        précédente. Ce qui passe d'une session à l'autre est écrit dans des
        fichiers du projet. Le plan et l'historique git sont versionnés avec le
        code ; les journaux de run gardent le brief, le résultat et la porte de
        chaque run. Une session qui démarre les relit ; en partant, elle y
        laisse un commit qui cite son lot, un verdict ou une note.`,
    memoireSchema: {
      titre: "Une mémoire en fichiers",
      desc: "Trois fichiers du projet : le plan (raf.yaml, lots et verdicts), l'historique (git log, commits et lots) et les journaux (.cadence/runs, brief et porte). Chaque session neuve lit ces fichiers au départ ; rien ne vient d'une conversation passée. Ce qu'elle laisse, un commit, un verdict, une note, est écrit dans ces mêmes fichiers et relu par la session suivante.",
      legende: "La mémoire partagée : le plan, l'historique git et les journaux de run. Chaque session neuve les relit et y écrit ; pointillés : ce qu'elle laisse est relu par la suivante.",
    },
  },
  depart: {
    eyebrow: "Le point de départ : la V1",
    date: "Historique · V1 (versions 1.x), jusqu'au 10 novembre 2026",
    titre: "Le parcours d'un lot dans une vague (V1)",
    texte: html`Ce parcours ne tourne plus : c'est celui d'où cadence 2 est parti. En
          V1, dans une vague, un lot passait de session en session, chacune
          courte et neuve. Les tests d'acceptation étaient écrits par une session
          à part et verrouillés rouges : l'implémentation devait les faire passer
          sans les toucher. Le chapitre ${LIEN_V1}
          dit ce que ce parcours coûtait.`,
    schema: {
      legende: "V1 · les six étapes d'un lot dans une vague. La revue pouvait renvoyer le lot en correction, puis le relire : la boucle en pointillés.",
      titre: "V1 · Le parcours d'un lot dans une vague",
      boucle: "reprise",
      desc: "Historique de la V1. Six étapes dans l'ordre, chacune avec qui la faisait. Une boucle en pointillés ramène de la correction à la revue tant que la revue trouve quelque chose.",
    },
    docVagues: "· la documentation des vagues",
  },
  chiffresV1: {
    eyebrow: "Les chiffres mesurés de la V1",
    note: html`Ces relevés datent d'octobre 2026 et portent sur les vagues de la
        <strong>V1 (versions 1.x)</strong> : ils ne mesurent pas <code>cadence run</code>.`,
    intro: html`Cadence se mesure lui-même : <code>cadence perf</code> affiche chaque
        indicateur de vitesse à côté de son jumeau de qualité (« vite <em>et</em>
        bien »), sans compter de volume produit. Les relevés ci-dessous sont dans
        le dépôt, avec la commande qui les rejoue.`,
    source: "V1 · source :",
    limite: html`Limite assumée : le classement des causes est celui d'un modèle local de
        24 milliards de paramètres. Le relevé du 10 octobre a été relu à la main sur
        un échantillon (17 passes sur 24 d'accord) ; le relevé du 30 octobre, d'où
        viennent les 136 et les 96, n'a pas été relu : l'accord n'y est pas calculé. Il
        est un point de départ ; l'effet du mécanisme posé contre les cas limites
        n'est pas encore mesuré.`,
  },
  echecsV1: {
    eyebrow: "Les échecs et ce qu'ils ont changé",
    intro: html`Une méthode qui ne raconte pas ses ratés n'est qu'une plaquette. Cinq
        épisodes de la V1, tirés du journal des versions et des relevés du dépôt :`,
    change: "Ce que ça a changé.",
  },
  problemeV1: {
    eyebrow: "Le problème de la V1",
    essaiTitre: "Un essai perdu, le 7 novembre",
    essai: html`La V1 donnait des lots revus, testés et livrés, mais à un prix que ses
        propres relevés montraient. Le 7 novembre 2026, la 1.62, dernière version
        de la V1, a refait 8 vraies demandes déjà livrées, contre Claude Code seul,
        depuis le même commit. Elle a perdu sur le temps et sur les jetons ; ce qu'en
        ont dit le juge à l'aveugle et les tests cachés est sur la page
        <a href="/case-studies/pourquoi-cadence/">Pourquoi cadence</a>.`,
    source: "Source :",
    causesTitre: "Cinq causes, quatre mesurées",
    causes: html`Le document de conception de cadence 2 (<a href="${doc(DESIGN)}" target="_blank" rel="noopener" class="[overflow-wrap:anywhere]">↗ ${DESIGN}</a>,
        7 novembre 2026) attribue la défaite à cinq causes. Il en mesure quatre ; la deuxième,
        C2, n'y est que décrite, sans chiffre :`,
    decrite: "Décrite, pas mesurée.",
    laisseTitre: "Ce que la V1 laisse",
    laisse: html`Cadence 2 garde ce que la V1 apportait vraiment : le plan relié aux
          commits, la porte de tests, la livraison vérifiée, la revue courte du
          diff, la revue sur captures des écrans et le contrôle dans le
          navigateur après livraison.`,
    decisionsTitre: "Les décisions de cadence 2",
    decisions: html`Chaque décision dit à quelle cause elle répond. Quand son effet est mesuré,
        la mesure est dite ; quand il ne l'est pas encore, c'est dit aussi.`,
    repond: (causes: string[]) => (causes.length ? `Répond à ${causes.join(", ")}` : "Ne répond à aucune des cinq causes"),
    effetMesure: "Effet mesuré.",
    pasMesure: "Pas encore mesuré.",
    preuvesBanc: html`<a href="/case-studies/pourquoi-cadence/">Lire les preuves du banc</a>.`,
    manque: html`Ce qui manque encore : le relevé du temps d'un lot (25 min et 266 k jetons
        en V1) n'a pas été refait pour <code>cadence run</code>. La comparaison de
        la V1 et de cadence 2 sur le travail réel reste à faire ; les preuves qui
        existent viennent du banc, sur quelques demandes.`,
  },
  plusLoin: {
    eyebrow: "Pour aller plus loin",
    note: "",
    liens: [
      html`Les cinq besoins qui ont fait naître cadence, et ce qu'en dit le
          banc qui l'oppose à Claude seul : <a href="/case-studies/pourquoi-cadence/">Pourquoi cadence</a>.`,
      html`Semaine par semaine, ce qui a été appris, fabriqué et testé :
          le <a href="/livre-de-bord/">Livre de bord</a>.`,
      html`Ce qui change pour l'utilisateur de ce site, lot par lot, sur la
          page <a href="/nouveautes/">Nouveautés</a>, et ce qui se prépare dans le
          <a href="/plan-de-travail/">Plan de travail</a>.`,
      html`Le même fonctionnement, appliqué à un produit complet :
          <a href="/case-studies/maritime-atlas">AetherWX</a>.`,
    ],
    depot: "↗ Dépôt cadence",
    paquet: "↗ Paquet npm @sylad/cadence",
    changelog: "↗ CHANGELOG",
    demarrage: "↗ Démarrage en 10 minutes",
    releve: "Chiffres relevés dans le dépôt cadence : ceux de la V1 au 30 octobre 2026, ceux du chapitre « Le problème de la V1 » au 24 novembre 2026.",
  },
};

export type ContenuEtudeCadence = typeof FR;
