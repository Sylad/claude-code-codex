// L27 — Aucune étude de cas ne fait défiler la page latéralement à 320 et 390 px
// (QA prod 05-10 : maritime-atlas, scrollWidth 600 pour clientWidth 390). Les pages sont
// trouvées dans dist/case-studies, pas listées à la main. Lit le site CONSTRUIT : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const dir = join(DIST, 'case-studies');
const routes = existsSync(dir)
  ? readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => `/case-studies/${e.name}/`)
  : [];

test('les études de cas sont trouvées', () => {
  assert.ok(routes.length >= 10, `${routes.length} études trouvées : lancer astro build`);
  assert.ok(routes.includes('/case-studies/maritime-atlas/'));
});

test('étude de cas : pas de défilement latéral de la page à 320 et 390 px', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [320, 390]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const m = await page.evaluate(() => {
        const cw = document.documentElement.clientWidth;
        const culprits = [...document.querySelectorAll('main *')]
          .filter((el) => el.getBoundingClientRect().right > cw + 1 && !el.closest('pre, [class*="overflow-x"]'))
          .slice(0, 3).map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);
        return { sw: document.documentElement.scrollWidth, cw, culprits };
      });
      if (m.sw > m.cw) failures.push(`${route} @${width}px : scrollWidth ${m.sw} > clientWidth ${m.cw} (${m.culprits.join(' | ')})`);
    }
    await context.close();
  }
  assert.deepEqual(failures, []);
});
