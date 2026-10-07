// L29 — aucune erreur d'hydratation Vue dans la console, sur le site CONSTRUIT (dist).
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';

const PAGES = ['/atelier-ia/', '/case-studies/maritime-atlas/', '/cloudflare-pour-les-nuls/', '/case-studies/claude-code-codex/'];

for (const path of PAGES) {
  test(`L29 — ${path} : 0 message d'hydratation en console`, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const messages = [];
    page.on('console', (m) => messages.push(`${m.type()}: ${m.text()}`));
    page.on('pageerror', (e) => messages.push(`pageerror: ${e.message}`));
    const response = await page.goto(`${env.base}${path}`, { waitUntil: 'load' });
    // Sans cela, une page renommée ou un dist/ absent (404) passerait à vide.
    assert.equal(response?.status(), 200, `${path} : réponse HTTP inattendue`);
    // client:visible → faire défiler toute la page pour monter chaque îlot.
    await page.evaluate(async () => {
      for (let y = 0; y <= document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const hydrated = await page.locator('astro-island[ssr]').count();
    const islands = await page.locator('astro-island').count();
    await context.close();
    assert.ok(islands > 0, `${path} : aucun astro-island sur la page`);
    assert.equal(hydrated, 0, `${path} : ${hydrated} îlot(s) non hydraté(s)`);
    const hydration = messages.filter((m) => /hydrat/i.test(m));
    assert.deepEqual(hydration, [], hydration.join('\n'));
  });
}
