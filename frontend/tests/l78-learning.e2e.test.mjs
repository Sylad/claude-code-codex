// L78 — suite de la revue UX de /learning, mesurée sur le site CONSTRUIT (`npx astro build` avant ;
// « skip » sans playwright-core/Chromium), à 1440 et 390 px.
// Point 2 : curseur main sur les 4 filtres et sur « Réinitialiser » (grille cursor-pointer, Nielsen 1).
// Point 3 : le texte du catalogue dit ce que la page fait (filtres par type + recherche), sans tri ni langue.
// Point 4 : à l'état vide, un seul bouton pour réinitialiser.
// Point 5 : chaque résumé du fil porte lang="en" si et seulement s'il est en anglais.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { guessLang } from '../src/lib/feed-text.mjs';

const html = () => readFileSync(join(DIST, 'learning', 'index.html'), 'utf8');

test('L78 — le texte du catalogue ne promet ni tri ni filtre de langue', () => {
  const h = html();
  assert.doesNotMatch(h, /triables|par type et langue/);
  assert.match(h, /filtrables par type, avec une recherche par\s+auteur, sujet ou tag/);
});

test('L78 — le code cité dans un résumé du fil n’est pas effacé', () => {
  const h = html();
  assert.doesNotMatch(h, /Utilisez\s*`\s*`/);
  if (/Utilisez <code>/.test(h)) assert.match(h, /Utilisez <code>&lt;details&gt;&lt;summary&gt;<\/code> en HTML/);
});

test('L78 — /learning à 1440 et 390 px : curseur, état vide, langue des résumés', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [1440, 390]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${env.base}/learning/`, { waitUntil: 'networkidle' });
    const at = `@${width}px`;

    // Point 5 : lang du résumé = langue détectée de son texte.
    const resumes = await page.$$eval('main section ul li > p', (ps) => ps.map((p) => ({ lang: p.getAttribute('lang'), text: p.textContent })));
    if (resumes.length < 1) failures.push(`${at} aucun résumé du fil`);
    for (const r of resumes) {
      const attendu = guessLang(r.text) === 'en' ? 'en' : null;
      if (r.lang !== attendu) failures.push(`${at} résumé lang=${r.lang} attendu ${attendu} : ${r.text.slice(0, 60)}`);
    }

    // Point 2 : curseur main sur les filtres, puis sur « Réinitialiser ».
    for (const name of [/^Blog/, /^Newsletter/, /^Engineering/, /^Podcast/]) {
      const b = page.getByRole('button', { name });
      const c = await b.evaluate((e) => getComputedStyle(e).cursor);
      if (c !== 'pointer') failures.push(`${at} filtre ${name} : cursor ${c}`);
    }
    await page.getByRole('searchbox', { name: /rechercher/i }).fill('zzzz');
    const resets = page.getByRole('button', { name: /^Réinitialiser/ });
    // Point 4 : un seul bouton de remise à zéro à l'état vide.
    const n = await resets.count();
    if (n !== 1) failures.push(`${at} ${n} boutons Réinitialiser à l'état vide`);
    if (n >= 1) {
      const c = await resets.first().evaluate((e) => getComputedStyle(e).cursor);
      if (c !== 'pointer') failures.push(`${at} Réinitialiser : cursor ${c}`);
      await resets.first().click();
      const status = await page.getByRole('status').filter({ hasText: /sources/ }).textContent();
      if (!/^\s*(\d+) \/ \1 sources\s*$/.test(status)) failures.push(`${at} après réinitialisation : ${status}`);
    }
    await context.close();
  }
  assert.deepEqual(failures, []);
});
