// L108 (D-5) — deux langues : module des versions d'une page (src/lib/langues.mjs). Critères tirés de la
// consigne du lot : français par défaut aux URL de toujours, anglais sous /en/, hreflang réciproques, une
// page sans traduction ne mène pas à une 404.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { versions, alternates, langueDe, adresseFr, formatDayEn, TRADUITES } from '../src/lib/langues.mjs';

const PAGES = fileURLToPath(new URL('../src/pages/', import.meta.url));
const SITE = 'https://exemple.test';

test('R1 — langue d’une adresse : /en/… en anglais, tout le reste en français', () => {
  assert.equal(langueDe('/en/case-studies/cadence/'), 'en');
  assert.equal(langueDe('/en'), 'en');
  assert.equal(langueDe('/case-studies/cadence/'), 'fr');
  assert.equal(langueDe('/'), 'fr');
  assert.equal(langueDe('/entretien/'), 'fr', '« /en » doit être un segment entier');
});

test('R2 — une page traduite a ses deux versions, dans les deux sens', () => {
  assert.deepEqual(versions('/case-studies/cadence/'), { langue: 'fr', fr: '/case-studies/cadence/', en: '/en/case-studies/cadence/' });
  assert.deepEqual(versions('/en/case-studies/cadence/'), { langue: 'en', fr: '/case-studies/cadence/', en: '/en/case-studies/cadence/' });
  assert.deepEqual(versions('/case-studies/cadence'), versions('/case-studies/cadence/'), 'sans barre finale (dev)');
  assert.equal(adresseFr('/en/'), '/');
});

test('R3 — une page sans traduction n’annonce aucune adresse anglaise', () => {
  assert.equal(versions('/about/').en, null);
  assert.equal(versions('/case-studies/pourquoi-cadence/').en, null);
  assert.deepEqual(alternates('/about/', SITE), []);
});

test('R4 — hreflang réciproques et absolus : fr, en et x-default (vers le français)', () => {
  const attendu = [
    { hreflang: 'fr', href: `${SITE}/case-studies/cadence/` },
    { hreflang: 'en', href: `${SITE}/en/case-studies/cadence/` },
    { hreflang: 'x-default', href: `${SITE}/case-studies/cadence/` },
  ];
  assert.deepEqual(alternates('/case-studies/cadence/', SITE), attendu);
  assert.deepEqual(alternates('/en/case-studies/cadence/', SITE), attendu);
});

test('R5 — chaque page annoncée traduite existe sous src/pages/en/ (jamais un lien vers une 404)', () => {
  assert.ok(TRADUITES.length > 0);
  for (const p of TRADUITES) {
    const base = `${PAGES}en${p.replace(/\/$/, '')}`;
    assert.ok(existsSync(`${base}.astro`) || existsSync(`${base}/index.astro`), `${p} : aucune page sous src/pages/en`);
    assert.ok(existsSync(`${PAGES}${p.replace(/^\//, '').replace(/\/$/, '') || 'index'}.astro`) || existsSync(`${PAGES}${p.replace(/^\//, '')}index.astro`), `${p} : la page française n'existe pas`);
  }
});

test('R6 — une date s’écrit à l’anglaise, même jour', () => {
  assert.equal(formatDayEn('2026-11-27'), 'November 27, 2026');
  assert.equal(formatDayEn('2026-01-01'), 'January 1, 2026');
  assert.throws(() => formatDayEn('2026-13-01'));
  assert.throws(() => formatDayEn('27/11/2026'));
});
