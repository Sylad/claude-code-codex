// L87 — suite de la QA en ligne de L83, sur le site CONSTRUIT (`npx astro build` avant ; « skip » sans
// playwright-core ni Chromium). Toutes les pages de dist, à 320 px texte 200 %, 390 et 1440 px :
//  - un jour suivi de son mois (« 31 octobre », « 1er décembre ») est sur la même ligne que lui, dans
//    tout le texte (avant L87 : « …le 31 | octobre 2026 » sur /nouveautes à 1440, « 3 | novembre » à
//    390, « (29 | octobre) » et « 23 | octobre » sur /livre-de-bord, « du 22 | novembre » sur /learning) ;
//  - aucune page ne défile en largeur (l'insécable ne fait rien sortir de l'écran à 320 px 200 %) ;
//  - la recherche de /learning trouve toujours une date tapée avec une espace ordinaire.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DIST, setupBrowser, pageReady } from './lib/e2e-dist.mjs';

function pages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return pages(p);
    return e.name === 'index.html' ? [`/${relative(DIST, dir).split(sep).join('/')}/`.replace(/^\/\/$/, '/')] : [];
  });
}
const ROUTES = pages(DIST);

const zoom200 = () => document.addEventListener('DOMContentLoaded', () => {
  const s = document.createElement('style');
  s.textContent = 'html{font-size:200% !important}';
  document.head.append(s);
});

const CONFIGS = [
  { width: 320, zoom: true },
  { width: 390, zoom: false },
  { width: 1440, zoom: false },
];

test('L87 — jour et mois sur la même ligne partout, aucune page plus large que l\'écran (320 px 200 %, 390, 1440)', { timeout: 900_000 }, async (t) => {
  assert.ok(ROUTES.length >= 30, `${ROUTES.length} page(s) dans dist : lancer astro build`);
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  let paires = 0;
  for (const cfg of CONFIGS) {
    const context = await env.browser.newContext({ viewport: { width: cfg.width, height: 900 } });
    const page = await context.newPage();
    if (cfg.zoom) await page.addInitScript(zoom200);
    for (const route of ROUTES) {
      await page.goto(`${env.base}${route}`, { waitUntil: 'networkidle' });
      await pageReady(page);
      const r = await page.evaluate(() => {
        const out = { n: 0, defauts: [] };
        const de = document.documentElement;
        if (de.scrollWidth > de.clientWidth) out.defauts.push(`la page défile en largeur (${de.scrollWidth} > ${de.clientWidth} px)`);
        const re = /(?<![\p{L}\p{N}.,:/_-])(1er|0?[1-9]|[12]\d|3[01])(\s+)(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)(?![\p{L}\p{N}])/giu;
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
          acceptNode: (n) => (n.parentElement.closest('script, style, [hidden], [aria-hidden="true"]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
        });
        const rects = (n, a, b) => {
          const rg = document.createRange();
          rg.setStart(n, a);
          rg.setEnd(n, b);
          return [...rg.getClientRects()].filter((q) => q.width > 0);
        };
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          for (const m of n.data.matchAll(re)) {
            const jour = rects(n, m.index, m.index + m[1].length);
            const debutMois = m.index + m[1].length + m[2].length;
            const mois = rects(n, debutMois, debutMois + m[3].length);
            if (!jour.length || !mois.length) continue; // pas affiché (menu replié, détails fermés)
            out.n++;
            const texte = m[0].replace(/\s+/g, ' ');
            // Bloc qui contient la paire : premier ancêtre qui n'est pas en ligne ; bord de son contenu.
            let blk = n.parentElement;
            while (getComputedStyle(blk).display.startsWith('inline')) blk = blk.parentElement;
            const cs = getComputedStyle(blk);
            const cb = blk.getBoundingClientRect();
            const gauche = cb.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
            const droite = cb.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight);
            const finMois = Math.max(...mois.map((q) => q.right));
            if (finMois > droite + 0.5) out.defauts.push(`« ${texte} » sort de son bloc de ${Math.round(finMois - droite)} px`);
            if (Math.abs(jour.at(-1).top - mois[0].top) <= 2) continue;
            // Séparés : admis seulement si « jour mois » ne tient pas sur une ligne entière du bloc
            // (boîte de DateLongue.astro, « 23 NOVEMBRE » à chasse fixe à 320 px texte 200 %).
            const sonde = document.createElement('span');
            sonde.textContent = m[0].replace(/\s+/g, ' ');
            sonde.style.whiteSpace = 'nowrap';
            n.parentElement.append(sonde);
            const besoin = sonde.getBoundingClientRect().width;
            sonde.remove();
            if (besoin <= droite - gauche + 0.5) out.defauts.push(`jour seul en fin de ligne : « ${texte} » (${Math.round(besoin)} px pour une ligne de ${Math.round(droite - gauche)} px)`);
          }
        }
        return out;
      });
      paires += r.n;
      failures.push(...r.defauts.map((d) => `@${cfg.width} px ${cfg.zoom ? '200 %' : '100 %'} ${route} ${d}`));
    }
    await context.close();
  }
  assert.ok(paires >= 300, `${paires} paire(s) jour + mois mesurée(s) seulement`);
  assert.deepEqual([...new Set(failures)], []);
});

test('L87 — la recherche de /learning trouve une date tapée avec une espace ordinaire', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${env.base}/learning/`, { waitUntil: 'networkidle' });
  await pageReady(page);
  await page.getByRole('searchbox').first().fill('22 novembre');
  await page.waitForTimeout(300);
  const texte = await page.locator('main').innerText();
  assert.match(texte.replace(/ /g, ' '), /revue du 22 novembre 2026/);
  await context.close();
});
