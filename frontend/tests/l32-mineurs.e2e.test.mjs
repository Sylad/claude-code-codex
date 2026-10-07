// L32 — mineurs des revues L29/L31, lus dans le site CONSTRUIT (lancer `npx astro build` avant).
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';

// (1) un diagramme = un seul arrêt Tab (le bouton « Agrandir »), rien d'interactif ni de région sur le conteneur du diagramme
test('diagramme Mermaid : un seul arrêt Tab par diagramme, pas de région imbriquée', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const ctx = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const response = await page.goto(`${env.base}/case-studies/maritime-atlas/`, { waitUntil: 'load' });
  assert.equal(response?.status(), 200);
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
  });
  // chaque diagramme doit être rendu (son svg présent) avant de compter ses arrêts
  await page.waitForFunction(() => {
    const figs = [...document.querySelectorAll('figure')].filter((f) => f.querySelector('[data-mermaid-inline]'));
    return figs.length > 0 && figs.every((f) => f.querySelector('[data-mermaid-inline] svg'));
  }, null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const figs = [...document.querySelectorAll('figure')].filter((f) => f.querySelector('[data-mermaid-inline]'));
    return figs.map((f) => {
      const stops = [...f.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')].filter((n) => n.tabIndex >= 0 && !n.closest('noscript'));
      const nested = f.querySelector('[data-mermaid-inline][tabindex], [data-mermaid-inline][role], [data-mermaid-inline][aria-label], [role="button"] [tabindex], [role="button"] [role="region"], [role="button"] [aria-label]');
      return { stops: stops.length, nested: !!nested };
    });
  });
  assert.ok(r.length > 0, 'aucun diagramme trouvé');
  for (const x of r) assert.deepEqual(x, { stops: 1, nested: false });
  await ctx.close();
});

// (2) options CLI : jamais coupées au trait d'union dans les cartes de l'index
test('index des études de cas : <code> des cartes sans retour à la ligne (--dry-run, --check)', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [320, 390, 768]) {
    const ctx = await env.browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const response = await page.goto(`${env.base}/case-studies/`, { waitUntil: 'load' });
    assert.equal(response?.status(), 200);
    const r = await page.evaluate(() => {
      const codes = [...document.querySelectorAll('p code [data-opt]')];
      const over = [...document.querySelectorAll('article p')].filter((p) => p.scrollWidth > p.clientWidth + 1).map((p) => p.textContent.slice(0, 40));
      return { opts: codes.map((c) => ({ t: c.textContent, lines: Math.round(c.getBoundingClientRect().height / parseFloat(getComputedStyle(c.parentElement.closest('p')).lineHeight)) })), over };
    });
    assert.deepEqual(r.over, [], `paragraphes de carte qui débordent (${width} px)`);
    assert.ok(r.opts.length >= 2, `options CLI introuvables (${width} px)`);
    for (const c of r.opts.filter((o) => o.t.length <= 16)) assert.equal(c.lines, 1, `${c.t} coupé à ${width} px`);
    await ctx.close();
  }
});
