/*
  L112 — English texts of the cadence case study (/en/case-studies/cadence/), same keys as fr.ts; the layout is
  src/components/pages/EtudeCadence.astro, shared with the French page. L108 (D-5): same facts as the French
  page — every figure, date and source file is the one of the French page, written the English way (3.8, 4,211,
  November 7, 2026); tests/l108-langues.e2e.test.mjs compares the numbers of both versions card by card.
  When fr.ts changes, this file changes in the same lot. The pages linked from here exist only in French:
  the links say so (hreflang="fr", “(in French)”).
*/
import type { ContenuEtudeCadence } from "./fr";
import { DESIGN, doc, html } from "./commun";
import { LEAD, MEMOIRE, PLAN_COMMITS, chiffres, insecable, livreur, parcours, parcoursV2, pieces } from "./en-parcours";
import { EN_FRANCAIS, LIEN_V1, echecs, v1Causes, v1Mesures, v2Decisions } from "./en-histoire";

export const EN = {
  insecable,
  page: {
    title: "Cadence",
    description:
      "Case study of cadence, the working method and tool behind this codex: a versioned plan tied to the commits, AI sessions started by a program, deliveries proven by their effect. The problem, the method and the figures of V1 (session waves, releases 1.x), its failures, and why cadence 2 replaced it: time and token measurements, decisions taken.",
  },
  hero: {
    eyebrow: "Case study · cadence",
    title: "A plan tied to the commits, measured AI sessions",
    intro:
      "Cadence is the working method behind the projects of this codex: a versioned plan next to the code, Claude Code sessions started by a program, deliveries proven by their effect. Born on September 28, 2026, it has had two generations. V1 (releases 1.x) sent each lot through a wave of short sessions; cadence 2, since November 10, hands each request to a single session. The path of a lot described below is the cadence 2 one; the wave path and the October figures are V1's, kept as the starting point, and the last chapter says what it cost and what changed.",
  },
  donnees: { PLAN_COMMITS, parcours, parcoursV2, livreur, LEAD, MEMOIRE, pieces, chiffres, echecs, v1Mesures, v1Causes, v2Decisions },
  probleme: {
    eyebrow: "The starting problem",
    h1: "Two questions that keep coming back",
    p1: html`Coding with an AI makes you go fast, and lose track just as fast. Two
        questions keep coming back: <strong>what is left to do?</strong>
        and <strong>what was this commit for?</strong> In a chat, the
        answer evaporates when the session ends; in a ticketing tool, it
        lives far from the code and goes stale.`,
    h2: "What it cost",
    p2: html`With eight projects run in parallel and several sessions a day, the
        cost became visible: lots started over, commits with no written
        reason, “successful” deliveries that did not do what we thought.
        The first commit of cadence (September 28, 2026) holds only the
        essentials: a plan in YAML and the computation of the link between commits and lots.`,
    principeTitre: "The principle we kept",
    principe: html`<strong>All the state lives in ordinary files next to the code</strong>,
          readable by the human as well as by the next session, and every
          claim (“it's delivered”, “it's tested”) must be checkable by running it again.`,
  },
  methode: {
    eyebrow: "The method",
    piecesTitre: "Seven pieces that fit together",
    piecesIntro: html`Seven pieces, each optional, that fit together. The detail of each
        command is in the repository's documentation; here, what each one
        settles.`,
    piecesV1: html`Six of them remain in cadence 2. The fifth, orchestrate waves, belongs
        to <strong>V1 (releases 1.x)</strong>: since November 10, 2026, a request
        is done with <code>cadence run</code>, a single session (chapter
        ${LIEN_V1}).`,
    v1Seulement: "V1 only",
    planTitre: "The plan, tied to the commits",
    planIntro: html`Everything starts from the plan: a lot has a number, and every commit
        that works on it cites it. The link reads both ways, with no database.`,
    planSchema: {
      titre: "The plan tied to the commits",
      desc: "A plan file holds lots L4 and L5. The commits “fix(L4)” and “feat(L5)” each cite their lot. The commands raf commits, raf now and raf check read this link and derive from it what a lot produced, what comes next and the gaps.",
      legende: "The plan (a YAML file) lists lots; every commit cites its lot in its message; three commands read this link.",
    },
    parcoursTitre: "The path of a lot in cadence 2",
    parcoursP1: html`Since November 10, 2026, a lot is done with <code>cadence run</code>:
        a single Opus session takes it from start to finish, in a separate
        working copy (a worktree). The cadence program then reruns the
        full gate (build and tests); if it is red, the same session
        fixes it and runs it again. The work then lands on <code>main</code>
        by fast-forward, with no merge commit. The lead then starts the code review, and the UX
        review if the lot touches a screen.`,
    parcoursP2: html`A non-compliant review starts a correction <code>cadence run</code>,
        which goes through the gate and the review again. From the third correction
        pass, or after two non-compliant reviews, the correction is handed to Fable.
        Once the lot is reviewed, the lead delivers it and has the delivered pages checked (QA).`,
    parcoursSchema: {
      legende: "The six steps of a lot in cadence 2. A non-compliant review starts a correction run: the dotted loop. Orange frame: the two checks made by fresh eyes, the review and the QA.",
      boucle: "non-compliant: fix",
      titre: "The path of a lot in cadence 2",
      desc: "Six steps in order, each with who does it. A dotted loop goes from the review back to a new correction cadence run as long as the review is not compliant; from the third correction pass, or after two non-compliant reviews, the correction goes to Fable.",
    },
    retenirTitre: "Key takeaway",
    retenir: html`The lead picks the lots to run, but no step is taken at its
          word: each one leaves a trace (sha, verdict, screenshot) that the
          next one reads again.`,
    livraisonTitre: "Delivery, delegated",
    livraison: html`A ready lot is not delivered yet. The lead hands it to the deliverer,
        who runs the gate and the delivery (chain below) and returns only one line or one question;
        the lead looks at the screenshots and decides.
        The visible lots can be read in the plan panel published on this site.`,
    livreurSchema: {
      legende: "The deliverer's chain, from the ready lot to the line handed back to the lead. A failing step stops the chain.",
      titre: "The deliverer's chain",
      desc: "Seven steps in order, from the ready lot to the line handed back to the lead. A failing step stops the chain.",
    },
    panneauAlt: "The lots panel of the “Plan de travail” page, in French: the “Prévu” (planned) section and the list of upcoming lots, each with its public title.",
    panneauLegende: "The lots panel as published by the “Plan de travail” page (in French): one title per lot, filed as in progress, planned or delivered.",
    leadTitre: "The lead and its slots",
    lead: html`The lead does not code: it holds slots. Each slot is a session at
        work, at most one per repository so that two runs do not step on
        each other. As soon as a run hands back (a line, or a question), the
        lead reads the result and fills the freed slot with the next lot of
        the plan, without being asked. A question is settled right away when
        the answer is reversible and sourced; the rest goes up to the human,
        while the other slots keep going.`,
    leadSchema: {
      titre: "The lead and its slots",
      desc: "The lead, a steering session, picks the next lot in priority order, one run per repository. It fills two kinds of slots: a slot busy with a cadence run, one session in one repository, and a free slot that it fills without waiting. The busy run hands back one line or one question to the lead; the slot then frees up for the next lot.",
      legende: "The lead fills the session slots, one run per repository; each run hands back a line or a question. Dotted line: the freed slot gets the next lot right away.",
    },
    hudAlt: "The cadence-hud mod's strip on October 8, 2026, in French: first, the session context and the quotas; then two projects, each with the lot in progress, its step (review, implementation), the model running it, the waiting lots, the token budget and “1 session/2”.",
    hudLegende: html`What the lead sees: the strip of the <code class="font-mono text-claude-soft">cadence-hud</code> mod,
          captured on October 8, 2026, in the days of V1 (orchestrate waves). One line per project
          in progress, with its lot, the step, the model and the waiting lots; “1 session/2”
          counts the busy slots against the cap set that day. Tap the image to open it at
          full size.`,
    memoireTitre: "A memory in files, never in the chat",
    memoire: html`Sessions are fresh and short: none remembers the previous one.
        What passes from one session to the next is written in the project's
        files. The plan and the git history are versioned with the code; the
        run logs keep the brief, the result and the gate of each run. A
        session that starts reads them again; when it leaves, it leaves there
        a commit that cites its lot, a verdict or a note.`,
    memoireSchema: {
      titre: "A memory in files",
      desc: "Three project files: the plan (raf.yaml, lots and verdicts), the history (git log, commits, lots) and the logs (.cadence/runs, brief and gate). Every fresh session reads these files first; nothing comes from a past chat. What it leaves, a commit, a verdict, a note, is written to these same files and read again by the next session.",
      legende: "The shared memory: the plan, the git history and the run logs. Every fresh session reads them and writes to them; dotted line: what it leaves is read again by the next one.",
    },
  },
  depart: {
    eyebrow: "The starting point: V1",
    date: "History · V1 (releases 1.x), until November 10, 2026",
    titre: "The path of a lot in a wave (V1)",
    texte: html`This path no longer runs: it is the one cadence 2 started from. In
          V1, within a wave, a lot went from session to session, each one
          short and fresh. Acceptance tests were written by a separate session
          and locked red: the implementation had to make them pass
          without touching them. The chapter ${LIEN_V1}
          says what this path cost.`,
    schema: {
      legende: "V1 · the six steps of a lot in a wave. The review could send the lot back for correction, then read it again: the dotted loop.",
      titre: "V1 · The path of a lot in a wave",
      boucle: "rework",
      desc: "V1 history. Six steps in order, each with who did it. A dotted loop goes from the correction back to the review as long as the review finds something.",
    },
    docVagues: "· the waves documentation",
  },
  chiffresV1: {
    eyebrow: "The measured figures of V1",
    note: html`These measurements date from October 2026 and cover the waves of
        <strong>V1 (releases 1.x)</strong>: they do not measure <code>cadence run</code>.`,
    intro: html`Cadence measures itself: <code>cadence perf</code> shows each speed
        indicator next to its quality twin (“fast <em>and</em>
        good”), without counting output volume. The measurements below are in
        the repository, with the command that reproduces them.`,
    source: "V1 · source:",
    limite: html`Acknowledged limit: the classification of causes is made by a local model of
        24 billion parameters. The October 10 measurement was checked by hand on a
        sample (17 passes out of 24 in agreement); the October 30 measurement, where
        the 136 and the 96 come from, was not checked: agreement is not computed for it. It
        is a starting point; the effect of the mechanism set against edge cases
        is not measured yet.`,
  },
  echecsV1: {
    eyebrow: "The failures and what they changed",
    intro: html`A method that does not tell its misses is only a brochure. Five
        episodes of V1, taken from the release log and the repository's measurements:`,
    change: "What it changed.",
  },
  problemeV1: {
    eyebrow: "The problem with V1",
    essaiTitre: "A lost trial, on November 7",
    essai: html`V1 delivered reviewed, tested and shipped lots, but at a price its
        own measurements showed. On November 7, 2026, 1.62, the last release
        of V1, redid 8 real requests already delivered, against Claude Code alone,
        from the same commit. It lost on time and on tokens; what the blind
        judge and the hidden tests said about it is on the page
        <a href="/case-studies/pourquoi-cadence/" hreflang="fr">Pourquoi cadence</a> ${EN_FRANCAIS}.`,
    source: "Source:",
    causesTitre: "Five causes, four measured",
    causes: html`The design document of cadence 2 (<a href="${doc(DESIGN)}" target="_blank" rel="noopener" class="[overflow-wrap:anywhere]">↗ ${DESIGN}</a>,
        November 7, 2026) puts the defeat down to five causes. It measures four of them; the second,
        C2, is only described there, with no figure:`,
    decrite: "Described, not measured.",
    laisseTitre: "What V1 leaves behind",
    laisse: html`Cadence 2 keeps what V1 really brought: the plan tied to the
          commits, the test gate, verified delivery, the short review of the
          diff, the screenshot review of screens and the in-browser check
          after delivery.`,
    decisionsTitre: "The decisions of cadence 2",
    decisions: html`Each decision says which cause it answers. When its effect is measured,
        the measurement is given; when it is not yet, that is said too.`,
    repond: (causes: string[]) => (causes.length ? `Answers ${causes.join(", ")}` : "Answers none of the five causes"),
    effetMesure: "Measured effect.",
    pasMesure: "Not measured yet.",
    preuvesBanc: html`<a href="/case-studies/pourquoi-cadence/" hreflang="fr">Read the bench evidence</a> ${EN_FRANCAIS}.`,
    manque: html`What is still missing: the measurement of a lot's time (25 min and 266 k tokens
        in V1) has not been redone for <code>cadence run</code>. The comparison of
        V1 and cadence 2 on real work remains to be done; the evidence that
        exists comes from the bench, on a few requests.`,
  },
  plusLoin: {
    eyebrow: "Further reading",
    note: "The pages below exist only in French for now.",
    liens: [
      html`The five needs that gave birth to cadence, and what the bench that
          pits it against Claude alone says about them: <a href="/case-studies/pourquoi-cadence/" hreflang="fr">Pourquoi cadence</a>.`,
      html`Week by week, what was learned, built and tested:
          the <a href="/livre-de-bord/" hreflang="fr">Livre de bord</a> (logbook).`,
      html`What changes for the users of this site, lot by lot, on the
          <a href="/nouveautes/" hreflang="fr">Nouveautés</a> page (release notes), and what is coming in the
          <a href="/plan-de-travail/" hreflang="fr">Plan de travail</a> (work plan).`,
      html`The same way of working, applied to a full product:
          <a href="/case-studies/maritime-atlas" hreflang="fr">AetherWX</a>.`,
    ],
    depot: "↗ cadence repository",
    paquet: "↗ npm package @sylad/cadence",
    changelog: "↗ CHANGELOG",
    demarrage: "↗ Quickstart in 10 minutes",
    releve: "Figures taken from the cadence repository: V1's as of October 30, 2026, those of the chapter “The problem with V1” as of November 24, 2026.",
  },
} satisfies ContenuEtudeCadence;
