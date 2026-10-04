// L16 — PageHero : sur-titre, titre et chapeau posés sur l'image de fond du site, mesurés au
// PIRE PIXEL sous les glyphes (pas sur la couleur déclarée) à 320, 390, 768, 1024, 1440 et 1920 px, en haut de page et défilé (le fond est fixe : ce qui est sous le texte change avec la largeur et le défilement), sur TOUTES les
// pages qui utilisent PageHero (trouvées dans src/pages, pas listées à la main).
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, setupBrowser, worstPixelContrast } from './lib/e2e-dist.mjs';

const PAGES = fileURLToPath(new URL('../src/pages/', import.meta.url));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const routes = walk(PAGES)
  .filter((f) => f.endsWith('.astro') && readFileSync(f, 'utf8').includes('<PageHero'))
  .map((f) => `/${relative(PAGES, f).split(sep).join('/').replace(/\.astro$/, '').replace(/index$/, '')}/`.replace('//', '/'));

test('PageHero est utilisé par plusieurs pages (le test les trouve)', () => {
  assert.ok(routes.length >= 10, `${routes.length} pages trouvées`);
  for (const r of routes) assert.ok(existsSync(join(DIST, r, 'index.html')), `${r} absente de dist : lancer astro build`);
});

test('PageHero : sur-titre, titre et chapeau ≥ 4,5:1 au pire pixel (6 largeurs, 3 défilements, toutes les pages)', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    const context = await env.browser.newContext({ viewport: { width, height: width > 1000 ? 900 : 844 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      for (const scroll of [0, 60, 100]) {
        await page.evaluate((y) => window.scrollTo(0, y), scroll);
        for (const sel of ['main section.codex-grid p:first-of-type', 'main section.codex-grid h1', 'main section.codex-grid h1 ~ p']) {
          // Un sélecteur qui ne trouve rien est un échec, pas un « rien à mesurer » silencieux.
          assert.ok(await page.locator(sel).count(), `${route} ${sel} @${width}px : sélecteur sans résultat`);
          const { worst, glyphs } = await worstPixelContrast(page, sel);
          t.diagnostic(`${route} ${sel.split(' ').pop()} @${width}px y${scroll} : ${worst.toFixed(2)}:1 (${glyphs} px)`);
          // Défilé, le texte peut passer sous la barre fixe ; en haut de page, il doit être mesuré.
          if (scroll === 0) assert.ok(glyphs > 20, `${route} ${sel} @${width}px : glyphes non détectés`);
          if (glyphs > 20 && worst < 4.5) failures.push(`${route} ${sel} @${width}px y${scroll} : ${worst.toFixed(2)}:1`);
        }
      }
    }
    await context.close();
  }
  assert.deepEqual(failures, []);
});
