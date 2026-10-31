// L61 — Étude AetherWX encyclopédie : le texte des schémas (Mermaid) lisible au téléphone.
// QA du 31-10 : 1,6–1,8 px rendus à 360 et 390 px. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';

const ROUTE = '/case-studies/aetherwx-encyclopedia/';

// Taille rendue = taille de police calculée × (largeur rendue du svg / largeur du viewBox).
// Couvre les <text> SVG et les libellés HTML des <foreignObject> de Mermaid.
async function mesure(page) {
  await page.goto(`${page.base}${ROUTE}`);
  // client:visible : un schéma ne se rend qu'une fois entré dans la fenêtre, on les y amène un à un.
  const total = await page.locator('[data-mermaid-inline]').count();
  for (let k = 0; k < total; k++) {
    await page.locator('[data-mermaid-inline]').nth(k).scrollIntoViewIfNeeded();
    await page.waitForFunction((j) => document.querySelectorAll('[data-mermaid-inline]')[j].querySelector('svg'), k, { timeout: 30_000 });
  }
  await page.waitForFunction(() => {
    const c = [...document.querySelectorAll('[data-mermaid-inline]')];
    return c.length > 0 && c.every((e) => e.querySelector('svg'));
  }, null, { timeout: 30_000 });
  return page.evaluate(() => [...document.querySelectorAll('[data-mermaid-inline]')].map((box, i) => {
    const svg = box.querySelector('svg');
    const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    const nodes = [...svg.querySelectorAll('text, foreignObject *')].filter((n) =>
      [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()));
    const px = nodes.map((n) => parseFloat(getComputedStyle(n).fontSize) * scale);
    return { i, min: Math.min(...px), n: px.length, boxOverflowX: getComputedStyle(box).overflowX,
      page: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  }));
}

for (const width of [360, 390]) {
  test(`R1 — à ${width} px, le plus petit texte de chaque schéma Mermaid de l’étude AetherWX est rendu à 11 px ou plus`, { timeout: 120_000 }, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const page = await env.browser.newPage({ viewport: { width, height: 844 } });
    page.base = env.base;
    const sizes = await mesure(page);
    await page.close();
    assert.ok(sizes.length >= 4, `${sizes.length} schémas trouvés (4 attendus)`);
    for (const { i, min, n, boxOverflowX, page: dep } of sizes) {
      assert.ok(n > 0, `schéma ${i} : aucun texte mesuré`);
      assert.ok(min >= 11, `schéma ${i} : plus petit texte rendu à ${min.toFixed(1)} px à ${width} px (11 px attendus)`);
      assert.match(boxOverflowX, /auto|scroll/, `schéma ${i} : le défilement du schéma n’est pas assumé (overflow-x ${boxOverflowX})`);
      assert.equal(dep, 0, `schéma ${i} : la page défile latéralement (${dep} px)`);
    }
  });
}

test('R2 — à 1440 px, le texte reste à 11 px ou plus, la page ne défile pas latéralement', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const page = await env.browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.base = env.base;
  const sizes = await mesure(page);
  await page.close();
  for (const { i, min, page: dep } of sizes) {
    assert.ok(min >= 11, `schéma ${i} : ${min.toFixed(1)} px à 1440 px`);
    assert.equal(dep, 0, `schéma ${i} : la page défile latéralement (${dep} px)`);
  }
});
