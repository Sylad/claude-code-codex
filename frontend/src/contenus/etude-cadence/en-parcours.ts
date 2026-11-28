// L112 — textes EN de l'étude cadence, première partie (parcours, pièces, chiffres) ; découpés de en.ts (max-lines).

export const PLAN_COMMITS = {
  groupes: [
    {
      qui: "The plan · versioned YAML file",
      lien: "cited by",
      items: [
        { code: "L4", detail: "lot in progress", accent: true },
        { code: "L5", detail: "lot to do" },
      ],
    },
    {
      qui: "The commits · git",
      items: [
        { code: "fix(L4): …", detail: "cites lot L4", accent: true },
        { code: "feat(L5): …", detail: "cites lot L5" },
      ],
    },
  ],
  commandes: [
    { code: "raf commits L4", detail: "what the lot produced" },
    { code: "raf now", detail: "what comes next" },
    { code: "raf check", detail: "unlinked commits or lots" },
  ],
};

export const parcours = [
  { titre: "Spec", detail: "sheet, mockup, locked acceptance tests", qui: "spec-writer, then separate tests" },
  { titre: "Code", detail: "makes the tests pass without editing them", qui: "coding session (Sonnet)" },
  { titre: "Review", detail: "fresh reviewer: bugs, drift, docs", qui: "Opus, not the author" },
  { titre: "Correction", detail: "fixes what the review found", qui: "correction session (Fable escalation)", accent: true },
  { titre: "UX", detail: "app running, screenshots at 1440 and 390 px", qui: "ux-reviewer agent" },
  { titre: "Ready", detail: "the lead looks at the screenshots and decides", qui: "lead; deliverer: gate, delivery", accent: true },
];

export const parcoursV2 = [
  { titre: "Lot chosen", detail: "the lead writes the brief and starts the run", qui: "the lead" },
  { titre: "cadence run", detail: "one session does the whole lot in a worktree", qui: "Opus; Fable from the 3rd fix pass" },
  { titre: "Gate and integration", detail: "build and tests, then fast-forward onto main", qui: "cadence; if red, same session fixes" },
  { titre: "Review", detail: "code review; UX review if the lot has a screen", qui: "fresh reviewers, started by the lead", accent: true },
  { titre: "Delivery", detail: "CI awaited, deployment run, effect checked", qui: "the lead, through the deliverer" },
  { titre: "QA", detail: "the delivered pages, opened in a browser", qui: "the lead, through the QA agent", accent: true },
];

export const livreur = [
  { titre: "Lot ready", detail: "review passed, UX verdict recorded" },
  { titre: "Test gate", detail: "tests and build rerun on the sha" },
  { titre: "UX verdict", detail: "read, not redone: otherwise the chain stops" },
  { titre: "Lot closed", detail: "the plan records the lot as delivered" },
  { titre: "Push", detail: "the commit goes to the remote repository" },
  { titre: "Delivery verified", detail: "CI awaited, deployment run, effect checked" },
  { titre: "One line back", detail: "“L84 livré 3d6edf4, QA à lancer <url>” (in French)", accent: true },
];

export const LEAD = {
  haut: { qui: "The lead · steering session", titre: "Picks the next lot", detail: "in priority order, one run per repository" },
  creneaux: [
    { titre: "Busy slot", code: "cadence run", detail: "one session, one repo" },
    { titre: "Free slot", code: "the lead fills it", detail: "without waiting", accent: true },
  ],
  bas: { qui: "Handed back to the lead", titre: "One line or one question", detail: "the slot frees up for the next lot" },
  boucle: "The freed slot gets the next lot right away (dotted line).",
};

export const MEMOIRE = {
  fichiers: [
    { titre: "The plan", code: "raf.yaml", detail: "lots and verdicts" },
    { titre: "The history", code: "git log", detail: "commits, lots" },
    { titre: "The logs", code: ".cadence/runs", detail: "brief and gate" },
  ],
  session: { qui: "Every fresh session", titre: "Reads these files first", detail: "nothing comes from a past chat" },
  trace: { qui: "What it leaves", titre: "A commit, a verdict, a note", detail: "written to these same files" },
  boucle: "What it leaves is read again by the next session (dotted line).",
};

// A number never splits from its unit at the end of a line (site rule, L88).
export const NBSP = " ";
export const insecable = (s: string) => s.replace(/(\d) (?=(?:s|min|k|M|px|h)(?!\p{L}))/gu, `$1${NBSP}`);

export const pieces = [
  {
    nom: "The raf plan, tied to the commits",
    corps:
      "What is left to do is a versioned YAML file next to the code: lots, subtasks, notes. Every commit cites its lot (`fix(L4): …`); `raf commits L4` finds what a lot produced, `raf now` says what comes next, `raf check` spots the gaps (a commit without a lot, a closed lot without a commit).",
    doc: "docs/raf.md",
  },
  {
    nom: "The release notes",
    corps:
      "A visible lot is not done without an entry written from the user's point of view, with a screenshot. `cadence news build` turns them into a JSON file the site reads: this codex's “Nouveautés” page comes from it.",
    doc: "docs/news.md",
  },
  {
    nom: "The session rituals",
    corps:
      "`cadence session start` gives the state of the work in the morning (lots in progress, commits from other sessions, gaps); `cadence session close` does the evening cleanup and exits with an error as long as something is left open. The memory from one day to the next lives in files, not in the chat's head.",
    doc: "docs/session.md",
  },
  {
    nom: "Verified delivery",
    corps:
      "`cadence deliver` waits for the commit's CI, runs the deployment, then checks the effect: a URL that answers with the right sha, a command that exits with zero. A delivery is done when its checks pass, not when a tool prints “success”.",
    doc: "docs/deliver.md",
  },
  {
    nom: "Orchestrate waves",
    corps:
      "A program, with no model, starts short, fresh Claude Code sessions, one per step: pre-check, sheet and mockup for a screen, red and locked acceptance tests, implementation, review, UX pass, corrections. Each session reads a brief, returns a structured result and goes away; the wave's log keeps the trace.",
    doc: "docs/orchestrate.md",
    v1: true,
  },
  {
    nom: "The lead and the subagents",
    corps:
      "A steering session keeps a small context: it reads summaries (`cadence lead tour`), decides with the human which lots to run, relays the sessions' questions and never answers in the human's place. The work is done by the wave's sessions and by specialized agents (code reviewer, UX reviewer, sheet writer).",
    doc: "docs/lead.md",
  },
  {
    nom: "The delegated deliverer",
    corps:
      "Since 1.26, the lead hands the delivery of a ready lot to the `livreur` agent: test gate on the sha, UX verdict, lot closing, push, delivery, then a single line back (`L84 livré 3d6edf4, QA à lancer <url>`) or a single question. The lead keeps its context for deciding, not for executing.",
    doc: "docs/lead.md",
  },
];

export const chiffres: { valeur: string; legende: string; source: string }[] = [
  {
    valeur: "61% · 29%",
    legende:
      "of the 263 lots in the first measurement (October 10) had at least one, then at least two correction passes after the first writing.",
    source: "docs/mesures/corrections-2026-10-10.md",
  },
  {
    valeur: "136 passes",
    legende:
      "caused by a “code bug” out of 201 classifiable passes from October 24 to 30; 96 of them are edge cases. The weakest link is therefore the implementation brief, which since 1.27 asks for the list of edge cases before the first line of code.",
    source: "docs/mesures/bug-code-2026-10-30.md",
  },
  {
    valeur: "−4,211 tokens",
    legende:
      "on the first prompt of each wave session (42,541 → 38,330, −9.9%) by turning off the user's plugins, which have no business in a session that reads, edits and runs commands.",
    source: "docs/mesures/contexte-session-2026-10-28.md",
  },
  {
    valeur: "565 KB → 5 KB",
    legende:
      "for the plan of a project that kept growing, once the closed lots were filed away by `raf archive`; the commands that read it show the same thing before and after.",
    source: "docs/whats-new.md (1.19.0)",
  },
  {
    valeur: "1 h 53 min",
    legende:
      "of total waiting for a session slot over 199 waves, with a single stop due to the quota: enough to decide not to raise the session cap without having measured it.",
    source: "docs/mesures/attente-creneaux-2026-10-12.md",
  },
];
