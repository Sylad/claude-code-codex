// L112 — textes EN de l'étude cadence, histoire V1 → V2 (échecs, mesures, causes, décisions) ; découpés de en.ts (max-lines).
import { DESIGN, TEMPS_LOT } from "./commun";
export const echecs = [
  {
    id: "classement",
    titre: "A classification of corrections that was almost always wrong",
    corps:
      "To find out why lots were being corrected, a local model classified each pass by cause. On the first try it put 169 passes out of 254 under “vague spec” and agreed with a manual review on only 5 passes out of 24.",
    change:
      "The prompt was tightened (code bug by default, “vague spec” only if the finding says the request is unclear): agreement on 17 out of 24 (71%). Every published measurement now says who made it and what was not reviewed.",
  },
  {
    id: "regression-apparente",
    titre: "A regression that was only half a regression",
    corps:
      "`cadence perf` on October 18 announced 51% fewer lots delivered and review times up by nearly 50%. Broken down by project and at equal effort, the increases dropped to +12% or 0% for implementation, and the drop in deliveries to −35% once working copies counted twice were set aside.",
    change:
      "`cadence perf` no longer reads working-copy folders (`tmp/`), and the breakdown that brought these figures down is a versioned script that can be rerun on the logs.",
  },
  {
    id: "publication",
    titre: "A version published on paper that never reached npm",
    corps:
      "Four times (1.5.0, 1.14.0, 1.16.0, 1.25.0), the tag went out but the version never reached npm. For 1.25.0, the tests read a type file that the editor writes when loading a module and that git does not track: none of our working trees could see it was missing.",
    change:
      "The tests run in a fresh clone, and `cadence release` replays the version commit in a fresh clone before handing back. Every lost version was republished under a patch number.",
  },
  {
    id: "reglages-copies",
    titre: "A first design for a lighter context, abandoned",
    corps:
      "To lighten the context of wave sessions, a first idea set aside the user's whole settings folder and passed a copy through a temporary file: −29% tokens. But the copy duplicated secrets with wide read access, never deleted, and ignored configuration variables.",
    change:
      "We kept a more modest gain (−9.9%) that copies nothing: a single setting turns off the plugins, and it merges with the existing settings instead of replacing them.",
  },
  {
    id: "mesure-manquante",
    titre: "A mechanism shipped with no way to tell whether it helped",
    corps:
      "The first set of instructions against code bugs (implementation brief) was shipped without an “after” measurement: waves already started keep the brief they were created with.",
    change:
      "The measurement protocol now dates the go-live, counts only the waves created after it, and measures both mechanisms together over two seven-day windows. Until those windows are measured, the page claims no gain.",
  },
];


export const v1Mesures = [
  {
    id: "essai",
    valeur: "×3.8 · ×4.5",
    quand: "November 7, 2026 · 1.62, the last V1 release",
    legende:
      "Against Claude alone, on the same 8 real requests: 199 min against 52 min, and 5.7 M tokens against 1.27 M. The lead had to step in 12 times, against 0 for Claude alone.",
    source: DESIGN,
  },
  {
    id: "lot",
    valeur: "25 min · 266 k",
    quand: "November 1, 2026 · waves of releases 1.8 to 1.36",
    legende:
      "The average cost of a lot, over 721 lots of the waves from October 17 to November 1: 25 minutes of elapsed time in the wave and 266 k counted tokens, plus 19 minutes on average where the lot was waiting for the lead, the budget or the night.",
    source: TEMPS_LOT,
  },
  {
    id: "tests",
    valeur: "62% · 4.6 times",
    quand: "November 1, 2026 · same waves",
    legende:
      "Tests took 62% of a writing session's time: a lot's full suite ran 4.6 times on average, started by the session then rerun by the wave's gate after each session. Writing the code itself: 6%.",
    source: TEMPS_LOT,
  },
  {
    id: "revue",
    valeur: "42% · 41%",
    quand: "November 1, 2026 · same waves",
    legende:
      "Counted tokens went first to review (42%) and to correction passes (41%): 620 passes, each 11.9 min and 126 k tokens, gate and new review included.",
    source: TEMPS_LOT,
  },
];

export const v1Causes = [
  {
    id: "C1",
    titre: "Judging against a frozen sheet, not against the request",
    corps: "Sealed sheet, mockup and acceptance tests were the reference: 101 reseals and 13 lots handed back because of a lock in 30 days.",
    mesuree: true,
  },
  {
    id: "C2",
    titre: "A context split across sessions",
    corps: "Code was written with Sonnet, in several successive sessions per lot: each step started over from a fresh session.",
    mesuree: false,
  },
  {
    id: "C3",
    titre: "Stacked gates",
    corps: "On a small fix, 4 gates: 24 min of gates for 4 min of work. The “end of lot” gate had never found a red on its own.",
    mesuree: true,
  },
  {
    id: "C4",
    titre: "Mechanisms added without measurement",
    corps: "The code went from 6,400 to 39,300 lines in a month, with 27 options to start a wave.",
    mesuree: true,
  },
  {
    id: "C5",
    titre: "A lead catching up with the machine",
    corps: "12 interventions from the lead over 8 requests, where Claude alone needed none.",
    mesuree: true,
  },
];

export type Preuve = { fichier: string; quand: string };
export const v2Decisions: { id: string; titre: string; causes: string[]; corps: string; effet: string; mesure: boolean; preuves: Preuve[] }[] = [
  {
    id: "run",
    titre: "One request, one session: cadence run",
    causes: ["C1", "C2", "C3"],
    corps:
      "Since 2.0.0 (November 10, 2026), `cadence run` replaces waves for doing a request: a single owner, in its own working copy, writes the code and the tests, and fixes them in the same session. The request, kept word for word, is the reference: no more sealed sheet or test. The full suite runs once, before integration.",
    effet:
      "Measured on the bench against Claude alone, on a few requests: the results, favorable and unfavorable, are on the “Pourquoi cadence” page.",
    mesure: true,
    preuves: [
      { fichier: "docs/v2/2026-11-09-cadence-run.md", quand: "November 9, 2026" },
      { fichier: "docs/v2/publications/2.0.0.md", quand: "November 10, 2026 · 2.0.0" },
    ],
  },
  {
    id: "banc",
    titre: "A bench before any mechanism, in three levels",
    causes: ["C4", "C5"],
    corps:
      "No mechanism gets in without a bench where it wins against Claude alone. The weekly bench had taken more than 5 h on November 13: it is split into three levels. The micro one (about 8 min) is used during a change; the mechanical one, with no AI judge (about 30 min targeted), is the release guard since 2.0.9; the full one, with judges, runs on Saturdays.",
    effet:
      "The criterion “total time ≤ 1.5 × Claude alone” came out red 4 times out of 9 between two identical arms. Since 2.0.10, each bench's natural spread is counted, taken as the median of its last pairs of identical arms: replayed with this rule, those 9 runs still give 3 time reds, and only 1 when the judged run is left out of the spread calculation. The threshold gets sharper as the pairs pile up.",
    mesure: true,
    preuves: [
      { fichier: "docs/v2/banc.md", quand: "November 13 to 15, 2026 · from 2.0.5 to 2.0.9" },
      { fichier: "docs/v2/banc.md", quand: "November 15, 2026 · 2.0.10" },
      { fichier: "CHANGELOG.md", quand: "November 15, 2026 · 2.0.10" },
    ],
  },
  {
    id: "modeles",
    titre: "A model chosen for each role",
    causes: ["C2"],
    corps:
      "In V1, code was written with Sonnet and reviewed with Opus, in separate sessions. Cadence 2 hands the whole request to a single Opus owner; after two unsuccessful correction rounds, Fable takes over. Agents that judge nothing step down: since 2.0.13 (November 17), the deliverer runs on Sonnet instead of inheriting Opus.",
    effet:
      "Not published yet: the before-and-after measurement (Opus tokens per delivery, over 5 deliveries on each side, with no extra failed delivery) is written, its result is not in the repository yet.",
    mesure: false,
    preuves: [
      { fichier: "docs/perf/goulot-2026-10-18.md", quand: "October 18, 2026 · V1" },
      { fichier: DESIGN, quand: "November 7, 2026" },
      { fichier: "docs/mesures/modele-agents-l757.md", quand: "November 17, 2026 · 2.0.13" },
    ],
  },
  {
    id: "contexte",
    titre: "A lighter starting context",
    causes: [],
    corps:
      "This decision does not come from the design document: it starts from a measurement made after it. Before its first move, each `cadence run` session received about 62 k tokens of context, measured item by item on November 11. Part of it was useless in a working session: the user's extensions, the account's connectors, automatic memory. Since 2.0.4, they are turned off for the session, as waves already turned off extensions.",
    effet:
      "Context at the first prompt down from 64,844 to 57,653 tokens (−11.1%), about $0.12 per lot (−5.0%). Measured with Haiku on a minimal prompt; the effect on quality is not measured.",
    mesure: true,
    preuves: [
      { fichier: "docs/mesures/socle-session-2026-11-11.md", quand: "November 11 and 12, 2026 · 2.0.4" },
    ],
  },
  {
    id: "code",
    titre: "A line budget, and the wave code to remove",
    causes: ["C4"],
    corps:
      "The code of cadence 2 has a line budget checked by the CI. A study from November 15 counts 11,404 lines (36% of the code outside cadence 2) and 3,444 test cases out of 9,013 that only serve the waves: their removal is proposed for a major release.",
    effet: "No effect to measure yet: as of November 24, nothing has been removed.",
    mesure: false,
    preuves: [
      { fichier: DESIGN, quand: "November 7, 2026" },
      { fichier: "docs/etudes/retrait-vagues.md", quand: "November 15, 2026" },
    ],
  },
];
export const LIEN_V1 = `<a href="#le-probleme-de-la-v1">“The problem with V1”</a>`;
export const EN_FRANCAIS = `<span class="whitespace-nowrap text-ink-muted">(in French)</span>`;
