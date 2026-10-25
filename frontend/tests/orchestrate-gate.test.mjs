// L41, L42 — porte de tests de la vague (cadence.yaml) : depuis cadence L333, la vague joue `build` PUIS `test`,
// ligne de base comprise ; les tests e2e lisent `dist` (ignoré par git), construit par la porte `build`.
// La commande `test` ne reconstruit donc plus le site (le build serait joué deux fois à chaque passe).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const { parse } = createRequire(new URL('../package.json', import.meta.url))('yaml');
const CONFIG = parse(readFileSync(new URL('../../cadence.yaml', import.meta.url), 'utf8'));
const ORCHESTRATE = CONFIG.orchestrate;

test('L42 — orchestrate.test lance la suite sans reconstruire le site', () => {
  assert.match(ORCHESTRATE.test, /npm test/);
  assert.doesNotMatch(ORCHESTRATE.test, /astro build|npm run build/);
});

test('L41 — orchestrate.build est la porte de construction, et le precheck est actif', () => {
  assert.match(ORCHESTRATE.build, /astro build/);
  assert.equal(ORCHESTRATE.precheck, true);
});
