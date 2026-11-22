// L16 — PageHero : sur-titre, titre et chapeau posés sur l'image de fond du site, mesurés au
// PIRE PIXEL sous les glyphes (pas sur la couleur déclarée) à 320, 390, 768, 1024, 1440 et 1920 px, en haut de page et défilé (le fond est fixe : ce qui est sous le texte change avec la largeur et le défilement), sur TOUTES les
// pages qui utilisent PageHero (trouvées dans src/pages, pas listées à la main).
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, setupBrowser, worstPixelContrast, pageReady, settleAfterScroll } from './lib/e2e-dist.mjs';

const PAGES = fileURLToPath(new URL('../src/pages/', import.meta.url));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const routes = walk(PAGES)
  // GuideLayout (L9) pose lui-même le PageHero des guides longs : ses pages en font partie.
  .filter((f) => f.endsWith('.astro') && /<(PageHero|GuideLayout)\b/.test(readFileSync(f, 'utf8')))
  .map((f) => `/${relative(PAGES, f).split(sep).join('/').replace(/\.astro$/, '').replace(/index$/, '')}/`.replace('//', '/'));

const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const SCROLLS = [0, 60, 100];
const SELECTORS = ['main section.codex-grid p:first-of-type', 'main section.codex-grid h1', 'main section.codex-grid h1 ~ p'];

test('PageHero est utilisé par plusieurs pages (le test les trouve)', () => {
  assert.ok(routes.length >= 10, `${routes.length} pages trouvées`);
  for (const r of routes) assert.ok(existsSync(join(DIST, r, 'index.html')), `${r} absente de dist : lancer astro build`);
});

// L80 — plus de plafond de temps sur l'ensemble : la mesure (1 890 couples de captures) est bornée
// par le processeur, et sous la charge de la porte (autres sessions) elle dépassait les 600 s du test
// entier (L5, reproduit avant L80 : 3 exécutions sur 3 coupées à 600 s, 40 processus occupés).
// Chaque page à chaque largeur est un sous-test avec son propre plafond, qui borne un blocage, pas
// un débit : 9 mesures, ~5 s seules, 38 s au pire sous charge (mesuré), 180 s de plafond. Les six largeurs tournent en parallèle,
// chacune dans son contexte, comme avant ; mêmes pages, défilements, textes, seuil.
test('PageHero : sur-titre, titre et chapeau ≥ 4,5:1 au pire pixel (6 largeurs, 3 défilements, toutes les pages)', { concurrency: WIDTHS.length }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  await Promise.all(WIDTHS.map((width) => t.test(`@${width}px`, async (tw) => {
    const context = await env.browser.newContext({ viewport: { width, height: width > 1000 ? 900 : 844 }, deviceScaleFactor: 2 });
    tw.after(() => context.close());
    const page = await context.newPage();
    for (const route of routes) {
      await tw.test(`${route} @${width}px`, { timeout: 180_000 }, async (tr) => {
        const failures = [];
        await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
        await pageReady(page);
        for (const scroll of SCROLLS) {
          await page.evaluate((y) => window.scrollTo(0, y), scroll);
          await settleAfterScroll(page);
          for (const sel of SELECTORS) {
            // Un sélecteur qui ne trouve rien est un échec, pas un « rien à mesurer » silencieux.
            assert.ok(await page.locator(sel).count(), `${route} ${sel} @${width}px : sélecteur sans résultat`);
            const { worst, glyphs } = await worstPixelContrast(page, sel);
            tr.diagnostic(`${route} ${sel.split(' ').pop()} @${width}px y${scroll} : ${worst.toFixed(2)}:1 (${glyphs} px)`);
            // Défilé, le texte peut passer sous la barre fixe ; en haut de page, il doit être mesuré.
            if (scroll === 0) assert.ok(glyphs > 20, `${route} ${sel} @${width}px : glyphes non détectés`);
            if (glyphs > 20 && worst < 4.5) failures.push(`${route} ${sel} @${width}px y${scroll} : ${worst.toFixed(2)}:1`);
          }
        }
        assert.deepEqual(failures, []);
      });
    }
  })));
});
