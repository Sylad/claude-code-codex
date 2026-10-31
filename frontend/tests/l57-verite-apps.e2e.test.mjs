// L57 — corrections de vérité des études de cas des apps (docs/verite-site.md, « Corrections à faire, par page »).
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { apps } from '../src/data/apps.ts';

const texte = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');

test('R1 — evatosorus : 1 532 pages (et plus 1527)', () => {
  const t = texte('case-studies/evatosorus');
  assert.match(t, /1532 pages/);
  assert.doesNotMatch(t, /1527/);
});

test('R2 — finance-tracker : claude-sonnet-5-5 (et plus Sonnet 4.5)', () => {
  const t = texte('case-studies/finance-tracker');
  assert.match(t, /claude-sonnet-5-5/);
  assert.doesNotMatch(t, /Sonnet 4\.5/);
});

test('R3 — hermes-agent : Sonnet 4.6 daté de juin 2026, Sonnet 5.5 cité, étoiles du relevé', () => {
  const t = texte('case-studies/hermes-agent');
  assert.match(t, /Sonnet 4\.6 \(juin 2026\)/);
  assert.match(t, /Sonnet 5\.5/);
  assert.doesNotMatch(t, /196 852 ⭐ MIT, push aujourd/);
  assert.match(t, /259 005/);
});

test('R4 — ol-companion : plus de SDK Anthropic, football-data.org dans la fiche', () => {
  const t = texte('case-studies/ol-companion');
  assert.doesNotMatch(t, /Anthropic SDK/);
  assert.match(t, /SDK Anthropic retiré/);
  assert.match(apps.find((a) => a.name === 'ol-companion').stack, /football-data\.org/);
});

test('R5 — warhammer40k : CLAUDE.md daté (134 lignes au 2026-05-08), plus « 130 lignes » nu', () => {
  const t = texte('case-studies/warhammer40k');
  assert.doesNotMatch(t, /de 130 lignes/);
  assert.match(t, /134 lignes au 8 mai 2026/);
});
