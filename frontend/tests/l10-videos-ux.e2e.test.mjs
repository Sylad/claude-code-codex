// L10 — revue UX de /videos (WCAG 2.2 AA, Nielsen), mesurée sur le site CONSTRUIT
// (`npx astro build` avant ; « skip » sans playwright-core/Chromium). Avant L10 (fd51c5f) :
//  1. champ de recherche nommé par son seul texte indicatif, anneau de focus à 30 % d'opacité (1 px) ;
//  2. filtres sans état exposé (aria-pressed), compteur non annoncé, qui comptait les chaînes comme « vidéos » ;
//  3. nombre de chaque filtre à 4,31:1 (opacity-70, 12 px) à 1440 px ; point séparateur à 3,23:1 ;
//  4. filtre « Playlist 0 » qui ne menait qu'à une liste vide ;
//  5. état vide « Aucune vidéo ne match ces filtres. » avec deux boutons « Réinitialiser » de 20 px de haut ;
//  6. titres de cartes en h3 sous le h1 (aucun h2), « Filtres de curation » sans balise de titre ;
//  7. titres anglais lus avec la voix française (aucun lang="en") ;
//  8. étiquettes en text-[10px] (px) : elles ne suivaient pas la taille de texte choisie (WCAG 1.4.4, C28) ;
//  9. à 320 px et texte 200 %, gouttières de page, de carte et du bloc de revue en rem : 39 mots courts coupés
//     (« Anthropic », « walkthroughs »…), loupe du champ collée au texte.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser, pageReady, worstPixelContrast } from './lib/e2e-dist.mjs';
import { motsCoupes } from './lib/mots-coupes.mjs';

const html = () => readFileSync(join(DIST, 'videos', 'index.html'), 'utf8');

const LUM = `(c, sous = '#000') => { const x = document.createElement('canvas').getContext('2d');
  x.fillStyle = sous; x.fillRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1);
  const d = x.getImageData(0, 0, 1, 1).data; const l = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * l(d[0]) + 0.7152 * l(d[1]) + 0.0722 * l(d[2]); }`;

async function ouvrir(env, width, { zoom = false } = {}) {
  const context = await env.browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  if (zoom) await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'html{font-size:200% !important}';
      document.head.append(s);
    });
  });
  await page.goto(`${env.base}/videos/`, { waitUntil: 'networkidle' });
  await pageReady(page);
  return { context, page };
}

test('L10 (6, 7) — titres : h1 puis h2, titres anglais en lang="en", noms propres et titres français sans', () => {
  const h = html();
  const niveaux = [...h.matchAll(/<h([1-6])\b/g)].map((m) => m[1]);
  assert.equal(niveaux[0], '1');
  assert.ok(!niveaux.includes('3'), `titre h3 sans h2 : ${niveaux.join(',')}`);
  assert.match(h, /<h2[^>]*>\s*Critères de sélection\s*<\/h2>/);
  const en = [...h.matchAll(/<h2[^>]*lang="en"[^>]*>\s*<a[^>]*>\s*([^<]+?)\s*<\/a>/g)].map((m) => m[1]);
  assert.deepEqual(en.sort(), [
    'A conversation on Claude Code — Boris Cherny &amp; Alex Albert',
    'Anthropic&#39;s Felix Rieseberg on AI Coworkers, Local-First Agents',
    'Claude Code &amp; the evolution of agentic coding — Boris Cherny, Anthropic',
    'Anthropic&#39;s Surprise Hit: How Claude Code Became an AI Coding Powerhouse',
    'Head of Claude Code — Boris Cherny',
    'How Anthropic&#39;s product team moves faster — Cat Wu',
  ].sort());
  assert.doesNotMatch(h, /lang="en"[^>]*>\s*<a[^>]*>\s*Claude Code et l&#39;évolution/);
});

test('L10 (8) — aucune taille de texte en px dans le catalogue', () => {
  const src = readFileSync(new URL('../src/components/site/VideosCatalog.vue', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /text-\[\d+px\]/);
});

test('L10 (1–5) — /videos à 1440, 390 et 320 px : nom, focus, états, contraste, état vide', { timeout: 240_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [1440, 390, 320]) {
    const { context, page } = await ouvrir(env, width);
    const at = `@${width}px`;

    // 1 — 4.1.2 / 3.3.2 : nom accessible du champ ; 2.4.7 / 1.4.11 : anneau ≥ 3:1 contre le fond.
    const search = page.getByRole('searchbox', { name: 'Rechercher une chaîne ou une vidéo' });
    if ((await search.count()) !== 1) failures.push(`${at} champ de recherche sans nom accessible`);
    await search.focus();
    const ring = await page.evaluate(`(() => { const lum = ${LUM}; const cs = getComputedStyle(document.activeElement);
      const m = cs.boxShadow.match(/(oklch|oklab|rgba?)\\([^)]*\\)/g) ?? [];
      const fondCss = getComputedStyle(document.documentElement).backgroundColor; const fond = lum(fondCss);
      return Math.max(0, ...m.map((c) => { const L = lum(c, fondCss); return (Math.max(L, fond) + 0.05) / (Math.min(L, fond) + 0.05); })); })()`);
    if (ring < 3) failures.push(`${at} anneau de focus du champ ${ring.toFixed(2)}:1 < 3`);

    // 4 — Nielsen 5 : pas de filtre vide ; 2 — aria-pressed, curseur.
    const filtres = await page.locator('main button[aria-pressed]').allTextContents();
    const noms = filtres.map((f) => f.replace(/\s+/g, ' ').trim());
    if (noms.some((n) => / 0$/.test(n))) failures.push(`${at} filtre sans entrée : ${noms.join(' | ')}`);
    if (noms.length !== 2) failures.push(`${at} ${noms.length} filtres exposés (aria-pressed) au lieu de 2`);
    const video = page.getByRole('button', { name: /^Vidéo/ });
    if ((await video.getAttribute('aria-pressed')) !== 'false') failures.push(`${at} Vidéo sans aria-pressed="false"`);
    if ((await video.evaluate((e) => getComputedStyle(e).cursor)) !== 'pointer') failures.push(`${at} Vidéo sans curseur main`);

    // 3 — 1.4.3 au pire pixel : nombre d'un filtre (12 px). Le point séparateur des cartes (trop peu de
    // pixels pour la mesure au pire pixel) a la couleur de la langue voisine, mesurée elle à plus de 7:1.
    const sel = 'main button[aria-pressed] span.font-mono';
    const { worst, glyphs } = await worstPixelContrast(page, sel);
    if (!glyphs) failures.push(`${at} ${sel} : aucun glyphe mesuré`);
    else if (worst < 4.5) failures.push(`${at} ${sel} : ${worst.toFixed(2)}:1 < 4,5`);
    const couleurs = await page.locator('main ul.grid > li').first().evaluate((li) => {
      const point = li.querySelector('span[aria-hidden="true"].font-mono');
      return [point, point.nextElementSibling].map((e) => getComputedStyle(e).color);
    });
    if (couleurs[0] !== couleurs[1]) failures.push(`${at} point séparateur ${couleurs[0]} ≠ langue ${couleurs[1]}`);

    // 2 — 4.1.3 : le compteur est annoncé, compte « chaînes et vidéos », suit le filtre.
    await video.click();
    if ((await video.getAttribute('aria-pressed')) !== 'true') failures.push(`${at} Vidéo actif sans aria-pressed="true"`);
    const status = await page.getByRole('status').filter({ hasText: /chaînes et vidéos/ }).textContent().catch(() => null);
    const nVideos = await page.locator('main ul.grid > li').count();
    if (!status || status.trim() !== `${nVideos} / 15 chaînes et vidéos` || nVideos === 15) failures.push(`${at} compteur : ${status} (${nVideos} cartes)`);

    // 5 — état vide en français, un seul « Réinitialiser » d'au moins 24 px, qui rend toute la sélection.
    await search.fill('zzzz');
    if (!(await page.getByText('Aucune chaîne ni vidéo ne correspond à ces filtres.').isVisible())) failures.push(`${at} message d’état vide absent`);
    const resets = page.getByRole('button', { name: 'Réinitialiser', exact: true });
    const n = await resets.count();
    if (n !== 1) failures.push(`${at} ${n} boutons Réinitialiser à l'état vide`);
    if (n >= 1) {
      const b = await resets.first().boundingBox();
      if (b.height < 24 || b.width < 24) failures.push(`${at} Réinitialiser ${b.width}×${b.height} < 24 px`);
      await resets.first().click();
      const s = await page.getByRole('status').textContent();
      if (s.trim() !== '15 / 15 chaînes et vidéos') failures.push(`${at} après réinitialisation : ${s}`);
    }

    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (sw > 0) failures.push(`${at} défilement horizontal de ${sw} px`);
    await context.close();
  }
  assert.deepEqual(failures, []);
});

test('L10 (8, 9) — 320 px, texte 200 % : étiquettes agrandies, noms et mots courts entiers, pas de défilement', { timeout: 240_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await ouvrir(env, 320, { zoom: true });
  const r = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    etiquette: parseFloat(getComputedStyle(document.querySelector('main ul.grid > li p.font-mono')).fontSize),
    // Loupe du champ : elle ne touche pas le texte saisi (avant : 0 px d'écart, gouttière en rem).
    ecartLoupe: (() => { const i = document.querySelector('main input[type=search]');
      return i.getBoundingClientRect().left + parseFloat(getComputedStyle(i).paddingLeft) - i.previousElementSibling.getBoundingClientRect().right; })(),
  }));
  const coupes = await page.evaluate(motsCoupes);
  await context.close();
  assert.equal(r.sw, 0, `défilement horizontal de ${r.sw} px`);
  assert.ok(r.ecartLoupe >= 8, `loupe à ${r.ecartLoupe} px du texte`);
  assert.equal(r.etiquette, 20, `étiquette de carte à ${r.etiquette} px (attendu 20 = 0,625 × 32)`);
  for (const mot of ['Anthropic', 'Réinitialiser', 'novembre', 'décembre', 'uniquement']) {
    assert.ok(!coupes.some((c) => c.startsWith(`« ${mot} »`)), `« ${mot} » coupé : ${coupes.slice(0, 12).join(', ')}`);
  }
});
