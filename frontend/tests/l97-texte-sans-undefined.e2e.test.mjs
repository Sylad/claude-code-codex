// L97 — aucune page n'affiche « undefined », « NaN » ou « [object Object] » dans son texte rendu,
// îlots hydratés (schémas Mermaid, barre de navigation…), lu dans le site CONSTRUIT (`npx astro build` avant).
// Vécu : QA de L93 (24-11), « undefined » relevé dans le texte de /case-studies/aetherwx-encyclopedia/.
// Cause : une valeur JS citée en <code> dans la prose (« Piège #3 »), pas un script ; le test couvre les deux.
// On lit les nœuds texte visibles du document (svg compris), hors <script>, <style>, <noscript>, <template>.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const INTERDITS = /\bundefined\b|\bNaN\b|\[object Object\]/;

function pages(dir = DIST, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) pages(p, out);
    else if (e.name === 'index.html') out.push('/' + relative(DIST, p).replace(/index\.html$/, ''));
  }
  return out;
}

test('aucune page construite n’affiche undefined, NaN ou [object Object], îlots hydratés', async (t) => {
  const liste = pages();
  const env = await setupBrowser(t);
  if (!env) return;
  assert.ok(liste.length >= 30, `seulement ${liste.length} pages dans dist`);
  const ctx = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const trouves = [];
  for (const path of liste) {
    const page = await ctx.newPage();
    await page.goto(env.base + path, { waitUntil: 'load' });
    // client:visible : amener chaque îlot à l'écran pour l'hydrater, puis attendre les schémas.
    // Défilement par pas d'un écran (un <astro-island> est en display: contents, sans boîte : on ne
    // peut pas le faire défiler jusqu'à l'écran lui-même).
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
        window.scrollTo(0, y);
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }
    });
    // Attente sur signal : chaque schéma dessiné ou en erreur (un îlot caché à cette largeur,
    // comme le menu du téléphone, ne s'hydrate jamais : on n'attend pas tous les îlots).
    await page.waitForFunction(() => [...document.querySelectorAll('[data-mermaid-inline]')]
      .every((x) => x.querySelector('svg') || x.closest('figure')?.querySelector('[role=alert]')),
    null, { timeout: 20000 }).catch(() => {});
    const extraits = await page.evaluate((re) => {
      const rx = new RegExp(re);
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.parentElement?.closest('script, style, noscript, template')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (!rx.test(n.textContent)) continue;
        const ctxTexte = (n.parentElement?.closest('p, li, td, figure, div') ?? n.parentElement).textContent;
        const m = ctxTexte.replace(/\s+/g, ' ').match(new RegExp(`.{0,40}(${re}).{0,40}`));
        out.push(m?.[0] ?? n.textContent.trim());
      }
      return out;
    }, INTERDITS.source);
    for (const e of extraits) trouves.push(`${path} : « ${e.trim()} »`);
    // Garde : un schéma resté sans svg rendrait le test vide pour lui.
    const nonDessines = await page.$$eval('[data-mermaid-inline]', (f) => f.filter((x) => !x.querySelector('svg')).length);
    if (nonDessines) trouves.push(`${path} : ${nonDessines} schéma(s) non dessiné(s), texte non vérifié`);
    await page.close();
  }
  assert.deepEqual(trouves, []);
});
