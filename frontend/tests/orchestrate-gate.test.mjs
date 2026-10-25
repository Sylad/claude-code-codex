// L41 — porte de tests de la vague (cadence.yaml, orchestrate.test) : cadence joue `test` PUIS `build`,
// et les tests e2e lisent `dist`, ignoré par git. La commande `test` doit donc construire elle-même
// avant `npm test`, sinon la porte est rouge sur un clone neuf et verte sur un ancien `dist`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const { parse } = createRequire(new URL('../package.json', import.meta.url))('yaml');
const CONFIG = parse(readFileSync(new URL('../../cadence.yaml', import.meta.url), 'utf8'));
const ORCHESTRATE = CONFIG.orchestrate;

test('L41 — la commande orchestrate.test construit le site avant de lancer npm test', () => {
  const cmd = ORCHESTRATE.test;
  const build = cmd.indexOf('astro build');
  const run = cmd.indexOf('npm test');
  assert.ok(build >= 0, 'orchestrate.test ne construit pas le site');
  assert.ok(run > build, 'npm test doit passer après astro build');
});

test('L41 — orchestrate.build reste la porte de construction, et le precheck est actif', () => {
  assert.match(ORCHESTRATE.build, /astro build/);
  assert.equal(ORCHESTRATE.precheck, true);
});
