// L8 (revue UX, constat bloquant WCAG 1.4.3) — les textes que la revue mesurait sous 4,5:1, mesurés au
// PIRE PIXEL réel (capture, fond fixe compris) une fois leur couleur prise dans les jetons de la charte :
// index des études (dates de push, licences, « Suggestion ? »), ligne « Test mené… » des pages Test bench,
// étiquettes « Anti » de drona23. Avant L8 : 3,12 à 4,27:1 au pixel. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser, worstPixelContrast } from './lib/e2e-dist.mjs';

// [page, description, sélection de l'élément dans la page (renvoie un Element ou null)]
const CIBLES = [
  ['/case-studies/', 'date de push', () => [...document.querySelectorAll('main span')].find((e) => /^Dernier push le /.test(e.textContent.trim()))],
  ['/case-studies/', 'licence', () => [...document.querySelectorAll('main p span')].find((e) => /^· (MIT|Apache)/.test(e.textContent.trim()))],
  ['/case-studies/', '« Suggestion ? »', () => [...document.querySelectorAll('main p')].find((e) => e.textContent.trim() === 'Suggestion ?')],
  ['/case-studies/ccproxy/', 'ligne « Test mené »', () => [...document.querySelectorAll('main p')].find((e) => /^Test mené/.test(e.textContent.trim()))],
  ['/case-studies/token-savior/', 'ligne « Test mené »', () => [...document.querySelectorAll('main p')].find((e) => /^Test mené/.test(e.textContent.trim()))],
  ['/case-studies/drona23-token-efficient/', 'étiquette « Anti »', () => [...document.querySelectorAll('main span')].find((e) => e.textContent.trim() === 'Anti')],
];

test('L8 — textes discrets des études ≥ 4,5:1 au pire pixel, 1440 et 390 px', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const ecarts = [];
  for (const width of [1440, 390]) {
    const context = await env.browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    for (const [route, nom, trouver] of CIBLES) {
      await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const ok = await page.evaluate(`(() => { const e = (${trouver})(); if (!e) return false; e.setAttribute('data-l8', ''); return true; })()`);
      if (ok === false) { ecarts.push(`${route} ${nom} @${width} : introuvable`); continue; }
      const { worst, glyphs } = await worstPixelContrast(page, '[data-l8]');
      if (!glyphs) ecarts.push(`${route} ${nom} @${width} : aucun glyphe mesuré`);
      else if (worst < 4.5) ecarts.push(`${route} ${nom} @${width} : ${worst.toFixed(2)}:1`);
    }
    await context.close();
  }
  assert.deepEqual(ecarts, []);
});
