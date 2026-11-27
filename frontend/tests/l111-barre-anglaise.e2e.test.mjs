// L111 — la barre de la page anglaise (/en/) se mesure comme la française (tests/navbar.e2e.test.mjs) : ses
// libellés n'ont pas la même largeur. Mêmes six configurations, mêmes largeurs et seuils ±1 px, mêmes écarts ;
// libellés attendus lus dans src/lib/libelles-site.mjs. Lit dist : build avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';
import { mesurerBarre, tableBarre } from './lib/mesure-barre.mjs';

test('barre anglaise : mode attendu à chaque largeur et seuil ±1 px, six configurations ; aucun débordement, ≥ 16 px après le logo', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { rows, failures } = await mesurerBarre(env, { path: '/en/case-studies/cadence/', langue: 'en' });
  t.diagnostic(`\n${tableBarre(rows)}`);
  assert.deepEqual(failures, []);
});
