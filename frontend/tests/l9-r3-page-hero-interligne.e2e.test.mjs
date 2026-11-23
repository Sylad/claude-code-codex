// L9 r3 — revue de code M1 (tmp/revue-codex-L9.md) : sous 640 px, le h1 de PageHero avait perdu la hauteur
// de ligne de `text-4xl` (36 px / 40 px) en passant à `text-[length:min(…)]`, qui ne pose que la taille :
// il héritait de `line-height: 1.5` (54 px), sur toutes les pages PageHero.
// Référence = le h1 de dfb7a3c (`text-4xl sm:text-5xl`), reconstruit dans la page même : un clone du titre
// avec les classes d'alors, à côté du vrai, mesuré dans les mêmes conditions (police, largeur, texte).
//  - 390 px et 1440 px, texte 100 % : taille, hauteur de ligne et hauteur du bloc identiques à la référence ;
//  - 390 px, texte 200 % : la taille reste bornée (compromis m3 du r1), mais la hauteur de ligne garde la
//    proportion de `text-4xl` (40/36), pas 1,5.
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupBrowser } from './lib/e2e-dist.mjs';

const PAGES = fileURLToPath(new URL('../src/pages/', import.meta.url));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const routes = walk(PAGES)
  .filter((f) => f.endsWith('.astro') && /<(PageHero|GuideLayout)\b/.test(readFileSync(f, 'utf8')))
  .map((f) => `/${relative(PAGES, f).split(sep).join('/').replace(/\.astro$/, '').replace(/index$/, '')}/`.replace('//', '/'));

// Classes du h1 de PageHero à dfb7a3c, avant le r1.
const H1_DFB7A3C = 'mt-3 text-4xl sm:text-5xl font-semibold tracking-tight text-ink [overflow-wrap:anywhere]';

function mesure(ancien) {
  const h1 = document.querySelector('main section.codex-grid h1');
  const ref = h1.cloneNode(true);
  ref.className = ancien;
  ref.setAttribute('aria-hidden', 'true');
  h1.after(ref);
  const m = (el) => {
    const s = getComputedStyle(el);
    return { taille: parseFloat(s.fontSize), interligne: parseFloat(s.lineHeight), hauteur: el.getBoundingClientRect().height };
  };
  const out = { h1: m(h1), ref: m(ref) };
  ref.remove();
  return out;
}

async function relever(env, width, zoom) {
  const context = await env.browser.newContext({ viewport: { width, height: 900 } });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  if (zoom) await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'html{font-size:200% !important}';
      document.head.append(s);
    });
  });
  const out = {};
  for (const route of routes) {
    await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    out[route] = await page.evaluate(`(${mesure})(${JSON.stringify(H1_DFB7A3C)})`);
  }
  await context.close();
  return out;
}

const px = (n) => `${n.toFixed(2)} px`;

test('PageHero : le test trouve les pages (≥ 30)', () => {
  assert.ok(routes.length >= 30, `${routes.length} pages`);
});

for (const width of [390, 1440]) {
  test(`PageHero à ${width} px, texte 100 % : h1 rendu comme à dfb7a3c (taille, interligne, hauteur)`, { timeout: 180_000 }, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const r = await relever(env, width, false);
    const ecarts = [];
    for (const [route, { h1, ref }] of Object.entries(r)) {
      for (const k of ['taille', 'interligne', 'hauteur']) {
        if (Math.abs(h1[k] - ref[k]) > 0.01) ecarts.push(`${route} ${k} ${px(h1[k])} au lieu de ${px(ref[k])}`);
      }
    }
    assert.deepEqual(ecarts, []);
    if (width === 390) {
      // text-4xl : 36 px sur 40 px (pas 54 px, l'interligne 1,5 hérité).
      const { h1 } = r['/cloudflare-pour-les-nuls/'];
      assert.equal(h1.taille, 36);
      assert.equal(h1.interligne, 40);
    }
  });
}

test('PageHero à 390 px, texte 200 % : l\'interligne du h1 garde la proportion de text-4xl (40/36), pas 1,5', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const r = await relever(env, 390, true);
  const ecarts = [];
  for (const [route, { h1, ref }] of Object.entries(r)) {
    const attendu = h1.taille * (ref.interligne / ref.taille);
    if (Math.abs(h1.interligne - attendu) > 0.5) ecarts.push(`${route} interligne ${px(h1.interligne)} pour ${px(h1.taille)} (attendu ${px(attendu)})`);
  }
  assert.deepEqual(ecarts, []);
});
