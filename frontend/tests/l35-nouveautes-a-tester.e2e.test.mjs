// L35 — section « Nouveautés à tester » de /ecosystem, mesurée sur le site CONSTRUIT
// (`npx astro build` avant ; « skip » sans playwright-core/Chromium) : chaque entrée vient d'un flux
// (lien identique), chaque flux montre sa date de relevé, lisible à 390 px sans défilement latéral.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setupBrowser } from './lib/e2e-dist.mjs';

const FLUX = ['github-anthropics-skills', 'github-mcp-servers'];
const urls = new Set(FLUX.flatMap((f) => JSON.parse(readFileSync(new URL(`../src/data/feeds/${f}.json`, import.meta.url), 'utf8')).map((e) => e.url)));

for (const width of [1440, 390]) {
  test(`L35 — nouveautés à tester à ${width} px : sourcées, datées, sans débordement`, { timeout: 120_000 }, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const context = await env.browser.newContext({ viewport: { width, height: 900 } });
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const page = await context.newPage();
    await page.goto(`${env.base}/ecosystem/`, { waitUntil: 'networkidle' });
    const section = page.locator('[data-a-tester]');
    assert.equal(await section.locator('h2').innerText(), 'Nouveautés à tester');
    for (const f of FLUX) {
      const bloc = section.locator(`[data-flux="${f}"]`);
      assert.equal(await bloc.count(), 1, f);
      assert.match(await bloc.locator('[data-releve]').innerText(), /^Dernier relevé le \d{1,2}(er)?\s\S+ \d{4} · \d+ /, f);
      assert.equal(await bloc.locator('[data-releve] time[datetime]').count(), 1, `${f} : date sans <time>`);
      const n = await bloc.locator('[data-a-tester-entree]').count();
      assert.ok(n > 0 || (await bloc.locator('[data-rien]').count()) === 1, `${f} : ni entrée ni message`);
    }
    const entrees = section.locator('[data-a-tester-entree]');
    assert.ok((await entrees.count()) > 0, 'aucune nouveauté à tester alors que le flux des skills en a');
    for (const href of await entrees.locator('a').evaluateAll((as) => as.map((a) => a.href))) {
      assert.ok(urls.has(href), `lien hors flux : ${href}`);
    }
    const largeur = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    assert.ok(largeur[0] <= largeur[1], `défilement latéral : ${largeur}`);
    const deborde = await section.evaluate((s) => [...s.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > innerWidth + 0.5).length);
    assert.equal(deborde, 0, 'élément hors de l’écran');
    await context.close();
  });
}
