// L112 — textes FR de l'étude cadence, histoire V1 → V2 (échecs, mesures, causes, décisions) ; découpés de fr.ts (max-lines).
import { DESIGN, TEMPS_LOT } from "./commun";
export const echecs = [
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

export const v1Mesures = [
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

export const v1Causes = [
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

export type Preuve = { fichier: string; quand: string; nombres: string; passages?: string[] };
// `causes` : les causes C1 à C5 auxquelles la décision répond, d'après la colonne « Contre-mesure v2 » du
// tableau §0 du design (vide quand la décision vient d'une mesure postérieure : la carte dit alors qu'elle ne répond à aucune des cinq causes et l'explique dans son corps).
export const v2Decisions: { id: string; titre: string; causes: string[]; corps: string; effet: string; mesure: boolean; preuves: Preuve[] }[] = [
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
export const LIEN_V1 = `<a href="#le-probleme-de-la-v1">« Le problème de la V1 »</a>`;
