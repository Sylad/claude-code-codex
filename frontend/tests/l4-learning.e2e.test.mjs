// L4 — revue UX de /learning (WCAG 2.2 AA) : défauts corrigés, mesurés sur le site CONSTRUIT
// (`npx astro build` avant ; « skip » sans playwright-core/Chromium). Avant L4 :
// date et compteur du fil à 4,28:1 (text-ink/50, 10 px), champ de recherche sans nom accessible,
// anneau de focus du champ à 30 % d'opacité, filtres sans état exposé, compteur non annoncé,
// bouton « Réinitialiser » de 20 px de haut, titres d'articles anglais lus avec la voix française.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser, worstPixelContrast } from './lib/e2e-dist.mjs';

const html = () => readFileSync(join(DIST, 'learning', 'index.html'), 'utf8');

// Couleur CSS (oklch, alpha…) composée sur un fond opaque → luminance relative, via un canvas (dans la page).
const LUM = `(c, sous = '#000') => { const x = document.createElement('canvas').getContext('2d');
  x.fillStyle = sous; x.fillRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1);
  const d = x.getImageData(0, 0, 1, 1).data; const l = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * l(d[0]) + 0.7152 * l(d[1]) + 0.0722 * l(d[2]); }`;

test('L4 — articles des sources anglophones marqués lang="en" (WCAG 3.1.2)', () => {
  const h = html();
  assert.ok((h.match(/<h3[^>]*lang="en"/g) ?? []).length >= 1, 'aucun titre d’article en anglais marqué');
  // Chaque carte du fil : lang="en" si et seulement si la source n'est pas marquée FR.
  const cartes = h.split('<li').filter((c) => /rounded-full text-\[10px\]/.test(c) && /<h3/.test(c));
  assert.ok(cartes.length >= 1, 'aucune carte d’article');
  for (const c of cartes) {
    const fr = /uppercase tracking-wider text-ink-muted[^>]*>\s*FR\s*</.test(c);
    assert.equal(/<h3[^>]*lang="en"/.test(c), !fr, c.slice(0, 300));
    // La langue du résumé (traduit ou resté en anglais) est vérifiée par L78 (l78-learning.e2e.test.mjs).
  }
});

test('L4 — /learning à 1440 et 390 px : contraste, nom, état, cible, focus', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [1440, 390]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${env.base}/learning/`, { waitUntil: 'networkidle' });
    const at = `@${width}px`;

    // 1.4.3 — date des articles et nombre d'entrées du fil (10 px) ≥ 4,5:1 au pire pixel.
    for (const sel of ['main ul li span.ml-auto.font-mono', 'main p.shrink-0.font-mono']) {
      await page.locator(sel).first().evaluate((e) => e.scrollIntoView({ block: 'center' }));
      const { worst, glyphs } = await worstPixelContrast(page, sel);
      if (!glyphs) failures.push(`${at} ${sel} : aucun glyphe mesuré`);
      else if (worst < 4.5) failures.push(`${at} ${sel} : ${worst.toFixed(2)}:1 < 4,5`);
    }

    // 4.1.2 / 3.3.2 — le champ de recherche a un nom accessible.
    const search = page.getByRole('searchbox', { name: /rechercher/i });
    if ((await search.count()) !== 1) failures.push(`${at} champ de recherche sans nom accessible`);

    // 2.4.7 / 1.4.11 — anneau de focus du champ au clavier : visible, ≥ 3:1 contre le fond de la page.
    await search.focus();
    const ring = await page.evaluate(`(() => { const lum = ${LUM}; const e = document.activeElement; const cs = getComputedStyle(e);
      const m = cs.boxShadow.match(/(oklch|oklab|rgba?)\\([^)]*\\)/g) ?? [];
      const page = getComputedStyle(document.documentElement).backgroundColor; const fond = lum(page);
      const best = Math.max(0, ...m.map((c) => { const L = lum(c, page); return (Math.max(L, fond) + 0.05) / (Math.min(L, fond) + 0.05); }));
      return { best, shadow: cs.boxShadow }; })()`);
    if (ring.best < 3) failures.push(`${at} anneau de focus ${ring.best.toFixed(2)}:1 < 3 (${ring.shadow})`);

    // 4.1.2 — l'état des filtres est exposé (aria-pressed) et suit le clic.
    const blog = page.getByRole('button', { name: /^Blog/ });
    if ((await blog.getAttribute('aria-pressed')) !== 'false') failures.push(`${at} filtre Blog sans aria-pressed="false"`);
    await blog.click();
    if ((await blog.getAttribute('aria-pressed')) !== 'true') failures.push(`${at} filtre Blog actif sans aria-pressed="true"`);

    // 4.1.3 — le nombre de résultats est annoncé (role=status) et suit le filtre.
    const status = await page.getByRole('status').filter({ hasText: /sources/ }).textContent().catch(() => null);
    if (!status || !/^\s*\d+ \/ \d+ sources\s*$/.test(status) || /^\s*(\d+) \/ \1 /.test(status)) failures.push(`${at} compteur non annoncé ou non filtré : ${status}`);

    // 2.5.8 — le bouton « Réinitialiser » fait au moins 24 px de haut ; l'état vide parle français.
    await search.fill('zzzz');
    const reset = await page.getByRole('button', { name: 'Réinitialiser', exact: true }).boundingBox();
    if (!reset || reset.height < 24 || reset.width < 24) failures.push(`${at} Réinitialiser ${reset?.width}×${reset?.height} < 24 px`);
    if (!(await page.getByText('Aucune source ne correspond à ces filtres.').isVisible())) failures.push(`${at} message d’état vide absent`);

    // 1.4.10 — pas de défilement horizontal.
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (sw > 0) failures.push(`${at} défilement horizontal de ${sw} px`);
    await context.close();
  }
  assert.deepEqual(failures, []);
});
