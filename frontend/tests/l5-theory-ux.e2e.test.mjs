// L5 — revue UX de /theory (WCAG 2.2 AA), mesurée sur le site CONSTRUIT
// (`npx astro build` avant ; « skip » sans playwright-core/Chromium). Avant L5 :
// numéros du sommaire à 4,43:1 (text-ink/50, 11 px) ; anneau de focus des blocs de code
// invisible (anneau « auto » de Chromium, #101010 sur fond sombre) ; lignes de 92 à 108 caractères ;
// aucun sommaire sous 64em (19 400 px de page à 390 px, 8 sections) ; entrée active du sommaire
// signalée par la seule couleur, sans aria-current.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser, worstPixelContrast } from './lib/e2e-dist.mjs';

const html = () => readFileSync(join(DIST, 'theory', 'index.html'), 'utf8');
const ids = () => [...html().matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]);

// Couleur CSS composée sur un fond opaque → luminance relative (dans la page).
const LUM = `(c, sous = '#000') => { const x = document.createElement('canvas').getContext('2d');
  x.fillStyle = sous; x.fillRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1);
  const d = x.getImageData(0, 0, 1, 1).data; const l = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * l(d[0]) + 0.7152 * l(d[1]) + 0.0722 * l(d[2]); }`;

// Nombre maximal de caractères sur une ligne rendue d'un élément.
const CPL = `(el) => { const r = document.createRange(); const lines = {};
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) for (let i = 0; i < n.length; i++) { r.setStart(n, i); r.setEnd(n, i + 1);
    const b = r.getClientRects()[0]; if (b) { const k = Math.round(b.top); lines[k] = (lines[k] || 0) + 1; } }
  return Math.max(0, ...Object.values(lines)); }`;

test('L5 — le sommaire du téléphone liste toutes les sections, dans l’ordre', () => {
  const h = html();
  const bloc = h.match(/<details[^>]*data-sommaire-mobile[\s\S]*?<\/details>/)?.[0];
  assert.ok(bloc, 'sommaire du téléphone absent');
  const liens = [...bloc.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(liens, ids());
  assert.ok(liens.length >= 8, `${liens.length} sections`);
});

test('L5 — /theory au bureau : contraste du sommaire, focus des blocs de code, longueur des lignes, aria-current', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${env.base}/theory/`, { waitUntil: 'networkidle' });

  // 1.4.3 — numéros du sommaire (11 px) ≥ 4,5:1 au pire pixel (image de fond derrière).
  const num = 'nav[aria-label="Table des matières"] a span:first-child';
  const { worst, glyphs } = await worstPixelContrast(page, num, { ring: 1 });
  if (!glyphs) failures.push('numéro du sommaire : aucun glyphe mesuré');
  else if (worst < 4.5) failures.push(`numéro du sommaire ${worst.toFixed(2)}:1 < 4,5`);

  // Le sommaire du téléphone n'apparaît pas à côté de la colonne du bureau.
  if (await page.locator('[data-sommaire-mobile]').isVisible()) failures.push('sommaire du téléphone visible à 1440 px');

  // 2.4.7 / 1.4.11 — bloc de code défilant au clavier : anneau plein ≥ 2 px, ≥ 3:1 contre son fond.
  const pre = page.locator('main section[id] pre[tabindex="0"]').first();
  await pre.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await pre.focus();
  const ring = await page.evaluate(`(() => { const lum = ${LUM}; const e = document.activeElement; const cs = getComputedStyle(e);
    const fondC = getComputedStyle(e.closest('figure')).backgroundColor; const fond = lum(fondC);
    const L = lum(cs.outlineColor, fondC);
    return { tag: e.tagName, style: cs.outlineStyle, width: parseFloat(cs.outlineWidth),
      ratio: (Math.max(L, fond) + 0.05) / (Math.min(L, fond) + 0.05) }; })()`);
  if (ring.tag !== 'PRE') failures.push(`focus sur ${ring.tag}, pas sur le bloc de code`);
  if (ring.style !== 'solid' || ring.width < 2) failures.push(`anneau du bloc de code : ${ring.style} ${ring.width}px`);
  if (ring.ratio < 3) failures.push(`anneau du bloc de code ${ring.ratio.toFixed(2)}:1 < 3`);

  // Lisibilité des longs textes (WCAG 1.4.8, 80 caractères) : introductions et puces.
  const longest = await page.evaluate(`(() => { const cpl = ${CPL};
    return Math.max(...[...document.querySelectorAll('main section[id] > p, main section[id] li span.flex-1')].map(cpl)); })()`);
  if (longest > 80) failures.push(`ligne de ${longest} caractères > 80`);

  // 4.1.2 / 1.4.1 — l'entrée active du sommaire est exposée (aria-current), pas seulement colorée.
  const cible = ids()[2];
  await page.locator(`#${cible}`).evaluate((e) => e.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(400);
  const actifs = await page.locator('nav[aria-label="Table des matières"] a[aria-current="true"]').evaluateAll((l) => l.map((a) => a.getAttribute('href')));
  if (actifs.length !== 1 || actifs[0] !== `#${cible}`) failures.push(`aria-current : ${JSON.stringify(actifs)} au lieu de #${cible}`);
  await context.close();

  assert.deepEqual(failures, []);
});

test('L5 — /theory au téléphone : sommaire repliable, cibles, aucun défilement latéral', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [320, 390, 840]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${env.base}/theory/`, { waitUntil: 'networkidle' });
    const at = `@${width}px`;
    const summary = page.locator('[data-sommaire-mobile] summary');
    if (!(await summary.isVisible())) { failures.push(`${at} sommaire absent`); await context.close(); continue; }
    // 2.5.8 — résumé et liens : 44 px visés (≥ 24 exigés).
    const sb = await summary.boundingBox();
    if (sb.height < 44) failures.push(`${at} bouton Sommaire ${Math.round(sb.height)} px < 44`);
    await summary.click();
    const liens = page.locator('[data-sommaire-mobile] a');
    for (const b of await liens.evaluateAll((l) => l.map((a) => a.getBoundingClientRect().height))) {
      if (b < 44) failures.push(`${at} lien du sommaire ${Math.round(b)} px < 44`);
    }
    // Un lien mène à sa section, titre visible sous la barre de navigation fixe.
    const cible = ids()[3];
    await liens.nth(3).click();
    await page.waitForTimeout(300);
    const top = await page.locator(`#${cible} h2`).evaluate((e) => e.getBoundingClientRect().top);
    if (top < 64 || top > 844) failures.push(`${at} titre de #${cible} à ${Math.round(top)} px après le lien`);
    // 1.4.10 — pas de défilement horizontal.
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (over > 0) failures.push(`${at} débordement horizontal de ${over} px`);
    await context.close();
  }
  assert.deepEqual(failures, []);
});
