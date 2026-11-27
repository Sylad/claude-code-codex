// L56 — corrections de vérité sur les outils testés (docs/verite-site.md, « Corrections à faire, par page »).
// Valeurs relevées via l'API GitHub / npm le 2026-10-31, puis le 2026-11-22 (revue L21). Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { testedTools, TOOLS_SURVEYED_AT } from '../src/data/tools-tested.ts';

// L21 (22-11) : relevé refait par l'API GitHub le 2026-11-22 ; ccusage et ccproxy ont changé de dépôt ; Omnara ajouté.
const RELEVE = {
  rtk: [87450, '2026-11-21'],
  ruflo: [82249, '2026-11-21'],
  'claude-mem': [118920, '2026-11-22'],
  'claude-code-router': [38301, '2026-11-21'],
  'vibe-kanban': [28778, '2026-11-15'],
  'claude-code-templates': [34081, '2026-11-22'],
  'claude-hud': [29283, '2026-11-20'],
  opcode: [22455, '2026-11-06'],
  'hermes-agent': [265282, '2026-11-22'],
  'fable-mode': [889, '2026-11-15'],
  'superclaude-framework': [23951, '2026-09-27'],
  ccusage: [19540, '2026-11-22'],
  ccproxy: [362, '2026-08-10'],
  'tanstack-start': [15341, '2026-11-22'],
  convex: [12808, '2026-11-21'],
  'code-review-graph': [32898, '2026-11-16'],
  'alexgreensh-token-optimizer': [3043, '2026-11-21'],
  'ooples-token-optimizer-mcp': [591, '2026-11-18'],
  'claude-context': [12716, '2026-11-12'],
  'token-savior': [1228, '2026-10-15'],
  'nadimtuhin-claude-token-optimizer': [661, '2026-11-16'],
  'claude-token-efficient': [6199, '2026-06-16'],
  archify: [98676, '2026-11-22'],
  'ui-ux-pro-max-skill': [152626, '2026-11-22'],
  'design-for-ai': [336, '2026-07-02'],
  'apple-design-skill': [3688, '2026-11-13'],
  'emilkowalski-apple-design': [58728, '2026-11-15'],
  'claude-design-styles': [44, '2026-07-30'],
  kodza: [15, '2026-11-20'],
  'cloudflare-security-audit': [76841, '2026-09-14'],
  omnara: [3434, '2026-11-21'],
  // L107 (27-11) : testés après le relevé du 22-11 ; étoiles citées dans la description, pas de badge daté du 22-11.
  impeccable: [undefined, undefined],
  hallmark: [undefined, undefined],
  'agent-browser': [undefined, undefined],
  treg: [undefined, undefined],
  openjarvis: [undefined, undefined],
};
const page = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const texte = (p) => page(p).replace(/<[^>]+>/g, ' ').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ');

test('R1 — archify : licence Apache-2.0 (et non MIT)', () => {
  assert.equal(testedTools.find((t) => t.id === 'archify').license, 'Apache-2.0');
});

test('R2 — étoiles et dernier push de chaque outil = dernier relevé (2026-11-22)', () => {
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
  assert.equal(TOOLS_SURVEYED_AT, '2026-11-22');
  assert.match(texte('case-studies'), /Étoiles, licences et dates de push relevées le 22 novembre 2026/);
});

test('R5 — /case-studies : étoile affichée = valeur du relevé (ccproxy 362, pas 400 ni 356)', () => {
  const t = texte('case-studies');
  assert.match(t, /★ 87\.5k/); // rtk 87 450 au relevé du 22-11
  assert.match(t, /★ 362/);
  assert.doesNotMatch(t, /★ 356(?!\d)/);
  assert.doesNotMatch(t, /★ 400(?!\d)/);
});

const PAGES = {
  'case-studies/claude-code-templates': { oui: [/v1\.29\.7/, /33k★/], non: [/v1\.28\.16 stable,/, /27k★/] },
  'case-studies/claude-mem': { oui: [/v15\.7\.0/, /106k★/], non: [/v13\.0\.1 stable,/, /\b74k★/] },
  'case-studies/code-review-graph': { oui: [/32\.5k★/], non: [/16\.9k/] },
  'case-studies/drona23-token-efficient': { oui: [/6\.1k★/], non: [/5\.4k/] },
  'case-studies/superclaude': { oui: [/23\.9k★/, /v5\.0/], non: [/22\.7k★/] },
  'case-studies/token-optimizers-2026': { oui: [/19\.3k étoiles/, /v20/], non: [/15k(⭐| étoiles)/] },
  'case-studies/token-savior': { oui: [/v4\.24\.0/, /1\.2k★/], non: [/891★/] },
};
for (const [p, { oui, non }] of Object.entries(PAGES)) {
  test(`R6 — /${p} : valeurs du relevé présentes, anciennes absentes`, () => {
    const t = texte(p);
    for (const re of oui) assert.match(t, re, p);
    for (const re of non) assert.doesNotMatch(t, re, p);
  });
}
