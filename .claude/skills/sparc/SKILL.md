---
name: sparc
description: SPARC methodology — Specification, Pseudocode, Architecture, Refinement, Completion. Five-phase structured workflow for algo-heavy or non-trivial features where the right shape is not obvious upfront. Distinct from APEX (linear analyze-plan-execute-validate) by adding an explicit pseudocode step before architecture and an explicit refinement pass after the first implementation. Use when designing parsers, solvers, scoring algorithms, custom rendering pipelines, complex data transformations, or anything where you'd benefit from sketching the algorithm before committing to file layout.
argument-hint: "<feature description>"
allowed-tools: Read, Glob, Grep, Edit, Write, TodoWrite, Bash, Agent, AskUserQuestion
---

<objective>
Drive a SPARC pass: Specification → Pseudocode → Architecture → Refinement → Completion. Each phase is gated by an artifact you produce before moving on. Track every phase as a TodoWrite item so the user sees progress and can interrupt at any boundary.
</objective>

<when_to_use>

**Pick SPARC over APEX when:**

- The work is **algorithm-shaped**: parser, scoring function, solver, layout/packing, geometry, graph traversal, custom diff, custom DSL, retry logic with subtle invariants.
- You don't yet know the right **data shape** or the right **decomposition** — pseudocode lets you discover it on paper.
- A first implementation is likely **wrong in interesting ways** and will need a real refinement pass.
- The cost of a wrong shape is **rewriting many files** vs. tweaking one.

**Pick APEX over SPARC when:**

- The work is a **multi-file refactor** following a familiar pattern (rename, split module, port endpoint).
- You already know the **target architecture** and just need to dispatch work.
- The decisions are mostly local — APEX's plan-then-execute is enough.

**One-line rule of thumb:** if you'd benefit from writing the algorithm in comments first, use SPARC. If you'd benefit from a checklist of files to touch first, use APEX.

**Examples**

- "Implement a heuristic to split a revolving credit into sub-credits by amount + reference + month distribution" → **SPARC** (algorithm-shaped, the heuristic is the hard part, file layout is trivial).
- "Move all React Query hooks from `lib/queries.ts` into `hooks/use-*.ts` files following the existing pattern" → **APEX** (mechanical, the shape is known).
- "Build a Bézier polygon editor that snaps vertices to concentric circles around Terra" → **SPARC** (geometry-heavy, file layout is the easy part).
- "Add a PIN guard to all write endpoints of warhammer40k backend matching the finance pattern" → **APEX** (pattern is known, just apply it).

</when_to_use>

<workflow>

Always start by recording the 5 phases as a TodoWrite list, then walk through them one by one. Mark `in_progress` before working a phase and `completed` only after the phase artifact is produced.

```
1. Specification — pending
2. Pseudocode — pending
3. Architecture — pending
4. Refinement — pending
5. Completion — pending
```

---

## Phase 1 — Specification

**Output:** a short spec (≤30 lines) the user can react to.

Capture:

- **What we're building** — one paragraph, in the user's own vocabulary.
- **Inputs** — concrete shapes, sample values when possible.
- **Outputs** — concrete shapes, sample values when possible.
- **Success criteria** — how we'll know it works (testable, observable).
- **Non-goals** — what's explicitly out of scope.
- **Constraints** — perf budget, libraries already in use, things that must not change.

If anything is fuzzy, use AskUserQuestion **once** at this phase to lock the unknowns before drawing pseudocode. Don't ask later.

---

## Phase 2 — Pseudocode

**Output:** a pseudocode sketch (commented prose, no real syntax) of the core algorithm or data flow.

This is the phase that distinguishes SPARC from APEX. Write the algorithm in plain English / structured comments **before** picking files, classes, or framework idioms.

Format suggestion:

```
# Goal: <one line>
# Inputs: <shape>
# Outputs: <shape>

step 1: read all PDF transactions, normalize references
step 2: filter to debits with reference >=8 digits AND ref appears >=2 times
step 3: cluster by amount ±5%
step 4: for each cluster:
          if distinct months >= 3 AND avg/month <= 1: keep
          else: drop
step 5: emit one sub-credit per surviving cluster
```

Validate the pseudocode against 1-2 worked examples on paper (real or invented inputs) before moving on. If a corner case breaks the sketch, revise the sketch — not the (non-existent) code.

---

## Phase 3 — Architecture

**Output:** a file-level decomposition with module boundaries and interfaces.

Now translate the pseudocode into a concrete shape:

- Which files are touched / created.
- Which functions/classes/types live where.
- The signatures of the 3-5 most important functions.
- How this plugs into existing modules (imports, DI, routes, hooks).

**Use sub-agents for parallel exploration here when useful.** Examples:

- Spawn one agent to grep for similar patterns already in the repo (`Agent` with Read/Grep/Glob).
- Spawn one agent to check the public API of a library you're integrating (Bash + WebFetch or context7).
- Spawn one agent to draft a test file in parallel with the implementation file.

Run them in parallel when they're independent; consolidate the findings before drafting interfaces.

Don't write implementation code yet — only signatures, types, and 1-line descriptions per function.

---

## Phase 4 — Refinement

**Output:** the working implementation, after at least one revision pass.

This is the second phase that distinguishes SPARC from APEX. APEX's "execute" produces an implementation; SPARC explicitly budgets a **second pass** on it.

Sequence:

1. Write the first implementation following the architecture from phase 3.
2. Run it against the worked examples from phase 2.
3. Identify gaps: corner cases the pseudocode missed, dead branches, awkward shapes, missing error handling.
4. Refine. Don't ship the v1 — ship the v2.

Common refinements that earn their keep:

- Replace ad-hoc loops with the right collection operation once you see the shape.
- Extract a helper once you've used the same 3-line pattern twice.
- Add the error case the spec mentioned but the v1 forgot.
- Fix the off-by-one or boundary case that only shows up on real data.

If the v1 is genuinely fine, document why in a one-line comment and move on. Don't pad refinement with cosmetic changes.

---

## Phase 5 — Completion

**Output:** verified, shipped work.

- Run the relevant tests (unit, integration). If none exist for this code, write at least one for the success criteria from phase 1.
- Run the typechecker / linter (`tsc --noEmit`, `eslint`, `vitest`, etc.).
- Manual smoke test if it's user-facing (curl, browser, etc.).
- Update any docs/comments that drift from the new behavior.
- Hand back a one-paragraph summary: what shipped, where, how to run/verify, what's deferred.

Mark all 5 todos as completed only when the user-visible behavior is verified, not just when the code compiles.

</workflow>

<anti_patterns>

- **Skipping pseudocode** because "the algorithm is obvious" — if it were obvious, you'd pick APEX. The pseudocode is the artifact that justifies SPARC.
- **Writing real code in phase 2** — phase 2 is prose. Use `# step N:` comments, not TypeScript.
- **Treating refinement as polish** — refinement is "find the gaps in v1 and fix them", not "rename variables and add JSDoc".
- **Spawning sub-agents in phase 1 or 2** — the spec and pseudocode should be tight enough to fit in your head. Sub-agents are for phase 3 (parallel exploration) and occasionally phase 5 (parallel test running).
- **Going back to phase 1 silently** — if a discovery in phase 4 invalidates the spec, surface it explicitly ("phase 4 revealed X, re-opening spec") instead of rewriting the spec in your head.

</anti_patterns>

<reporting>

When done, hand back:

1. The final spec (1 paragraph).
2. The files touched.
3. The verification you ran (tests passed, smoke test done).
4. Any deferred items, with a one-line reason each.

Keep the report under 15 lines. Save artifacts (spec, pseudocode) inline in the relevant code as comments when they help the next reader; don't create extra `.md` files unless the user asked.

</reporting>
