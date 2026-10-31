// L56 — corrections de vérité sur les outils testés (docs/verite-site.md, « Corrections à faire, par page »).
// Valeurs relevées via l'API GitHub / npm le 2026-10-31. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { testedTools, TOOLS_SURVEYED_AT } from '../src/data/tools-tested.ts';

const RELEVE = {
  rtk: [85109, '2026-10-30'], ruflo: [80351, '2026-10-31'], 'claude-mem': [106898, '2026-10-31'],
  'claude-code-router': [37915, '2026-10-10'], 'vibe-kanban': [28528, '2026-10-29'],
  'claude-code-templates': [33008, '2026-10-31'], 'claude-hud': [29048, '2026-10-30'], opcode: [22428, '2026-09-18'],
  'hermes-agent': [259005, '2026-10-31'], 'fable-mode': [881, '2026-10-24'],
  'superclaude-framework': [23917, '2026-09-27'], ccusage: [19274, '2026-10-31'], ccproxy: [356, '2026-08-10'],
  'tanstack-start': [15267, '2026-10-30'], convex: [12770, '2026-10-31'], 'code-review-graph': [32516, '2026-10-29'],
  'alexgreensh-token-optimizer': [2816, '2026-10-31'], 'ooples-token-optimizer-mcp': [563, '2026-10-30'],
  'claude-context': [12661, '2026-07-14'], 'token-savior': [1199, '2026-10-15'],
  'nadimtuhin-claude-token-optimizer': [638, '2026-10-28'], 'claude-token-efficient': [6135, '2026-06-16'],
  archify: [91964, '2026-10-31'],
};
const page = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const texte = (p) => page(p).replace(/<[^>]+>/g, ' ').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ');

test('R1 — archify : licence Apache-2.0 (et non MIT)', () => {
  assert.equal(testedTools.find((t) => t.id === 'archify').license, 'Apache-2.0');
});

test('R2 — étoiles et dernier push de chaque outil = relevé du 2026-10-31', () => {
  assert.equal(testedTools.length, Object.keys(RELEVE).length, 'un outil sans relevé (ou l’inverse)');
  for (const t of testedTools) {
    assert.ok(RELEVE[t.id], `relevé manquant pour ${t.id}`);
    assert.deepEqual([t.stars, t.lastPush], RELEVE[t.id], t.id);
  }
});

test('R3 — TanStack Start : version 1.169.4 (et plus 1.167)', () => {
  const d = testedTools.find((t) => t.id === 'tanstack-start').description;
  assert.match(d, /v1\.169\.4/);
  assert.doesNotMatch(d, /1\.167/);
});

test('R4 — /case-studies affiche la date du relevé des étoiles et licences', () => {
  assert.equal(TOOLS_SURVEYED_AT, '2026-10-31');
  assert.match(texte('case-studies'), /Étoiles, licences et dates de push relevées le 31 octobre 2026/);
});

test('R5 — /case-studies : étoile affichée = valeur du relevé (ccproxy 356, pas 400)', () => {
  const t = texte('case-studies');
  assert.match(t, /★ 85\.1k/);
  assert.match(t, /★ 356/);
  assert.doesNotMatch(t, /★ 400(?!\d)/);
});

const PAGES = {
  'case-studies/claude-code-templates': { oui: [/v1\.29\.7/, /33k★/], non: [/v1\.28\.16 stable,/, /27k★/] },
  'case-studies/claude-mem': { oui: [/v15\.7\.0/, /106k★/], non: [/v13\.0\.1 stable,/, /\b74k★/] },
  'case-studies/code-review-graph': { oui: [/32\.5k★/], non: [/16\.9k/] },
  'case-studies/drona23-token-efficient': { oui: [/6\.1k★/], non: [/5\.4k/] },
  'case-studies/superclaude': { oui: [/23\.9k★/, /v5\.0/], non: [/22\.7k★/] },
  'case-studies/token-optimizers-2026': { oui: [/19\.3k⭐/, /v20/], non: [/15k⭐/] },
  'case-studies/token-savior': { oui: [/v4\.24\.0/, /1\.2k★/], non: [/891★/] },
};
for (const [p, { oui, non }] of Object.entries(PAGES)) {
  test(`R6 — /${p} : valeurs du relevé présentes, anciennes absentes`, () => {
    const t = texte(p);
    for (const re of oui) assert.match(t, re, p);
    for (const re of non) assert.doesNotMatch(t, re, p);
  });
}
