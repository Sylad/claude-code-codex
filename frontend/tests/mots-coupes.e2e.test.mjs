// L8 r2 (revue UX r2, Nielsen 4) — à 390 et 320 px, texte 100 %, aucun mot court (≤ 12 lettres ou chiffres)
// n'est coupé au milieu sur deux lignes, hors code. Régression de 211c6c3 : la règle globale
// `overflow-wrap: anywhere` + `min-width: 0` des enfants de flex coupait « TYPESCRI|PT », « LICENS|E »,
// les numéros « 1. » de k8s et « 02 » du sommaire de /theory. Toutes les pages de dist sont parcourues
// (la règle vaut pour tout le site). Une coupure à un trait d'union n'est pas une coupure de mot (le trait
// d'union n'appartient pas au mot mesuré). Lit le site CONSTRUIT : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

function pages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return pages(p);
    return e.name === 'index.html' ? [`/${relative(DIST, dir).split(sep).join('/')}/`.replace(/^\/\/$/, '/')] : [];
  });
}
const ROUTES = pages(DIST);

// Pages où la revue a mesuré des coupures : elles doivent être dans le lot parcouru.
const CITEES = [
  '/case-studies/k8s-migration-overnight/', '/case-studies/aetherwx-qa-harness/',
  '/case-studies/alexgreensh-polyform/', '/theory/', '/argocd-k8s-pour-les-nuls/', '/cloudflare-pour-les-nuls/',
];

test('les pages citées par la revue sont dans dist', () => {
  for (const r of CITEES) assert.ok(ROUTES.includes(r), `${r} absent de dist : lancer astro build`);
});

// Dans la page : chaque mot court (≤ 12 lettres ou chiffres) d'un nœud texte de <main> (hors code/pre/script/style, éléments visibles)
// dont les fragments tombent sur plus d'une ligne.
function motsCoupes() {
  const main = document.querySelector('main');
  if (!main) return [];
  const out = [];
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('code, pre, script, style, svg, [aria-hidden="true"]')
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el.getClientRects().length) continue;
    // Un mot = un bloc entre espaces, sans sa ponctuation de bord. Plus de 12 lettres ou chiffres (chemin,
    // URL, identifiant) : sa coupure est le prix voulu contre le défilement. Sinon chaque partie entre
    // traits d'union doit tenir sur une ligne (couper après un trait d'union reste permis).
    for (const bloc of n.data.matchAll(/\S+/g)) {
      if (bloc[0].replace(/[^\p{L}\p{N}]/gu, '').length > 12) continue;
      for (const m of bloc[0].matchAll(/[^-‐–—]+/g)) {
        const debut = bloc.index + m.index;
        if (m[0].replace(/[^\p{L}\p{N}]/gu, '').length === 0 || m[0].length < 2) continue;
        range.setStart(n, debut);
        range.setEnd(n, debut + m[0].length);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0.5);
        const ys = [...new Set(rects.map((r) => Math.round(r.top)))].sort((a, b) => a - b);
        // Fragments sur des lignes distinctes : décalage vertical d'au moins la moitié d'une ligne.
        if (ys.length > 1 && ys.at(-1) - ys[0] >= rects[0].height / 2) {
          out.push(`« ${m[0]} » (${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)})`);
        }
      }
    }
  }
  return out;
}

test('aucun mot court coupé sur deux lignes à 390 et 320 px, texte 100 %', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [390, 320]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const coupes = await page.evaluate(motsCoupes);
      if (coupes.length) failures.push(`${route} @${width}px : ${coupes.slice(0, 6).join(', ')}${coupes.length > 6 ? ` (+${coupes.length - 6})` : ''}`);
    }
    await context.close();
  }
  assert.deepEqual(failures, []);
});
