// L29 — aucune erreur d'hydratation Vue dans la console, sur le site CONSTRUIT (dist).
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';

const PAGES = ['/atelier-ia/', '/case-studies/maritime-atlas/', '/cloudflare-pour-les-nuls/', '/case-studies/claude-code-codex/'];

// Signal d'hydratation d'Astro : un îlot porte l'attribut `ssr` tant qu'il n'est pas
// hydraté ; le runtime le retire (et émet `astro:hydrate`) une fois le composant monté,
// donc après les éventuels avertissements de désaccord de Vue. On attend que plus aucun
// îlot ne le porte, en amenant à l'écran le premier encore en attente (client:visible),
// au lieu de faire défiler puis d'attendre un délai fixe (L79 : sous la charge de la porte
// complète, le dernier îlot n'était pas encore chargé au bout des 1,5 s).
async function hydrateAll(page, timeout = 20_000) {
  await page
    .waitForFunction(() => {
      const pending = document.querySelector('astro-island[ssr]');
      if (!pending) return true;
      // L'îlot est en `display: contents` (aucune boîte) : Astro observe ses enfants.
      const box = [...pending.children].find((c) => c.getClientRects().length) ?? pending;
      box.scrollIntoView({ block: 'center' });
      return false;
    }, null, { polling: 100, timeout })
    .catch(() => {}); // délai dépassé : l'assertion ci-dessous dit combien d'îlots restent.
}

for (const path of PAGES) {
  test(`L29 — ${path} : 0 message d'hydratation en console`, { timeout: 60_000 }, async (t) => {
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
    const islands = await page.locator('astro-island').count();
    assert.ok(islands > 0, `${path} : aucun astro-island sur la page`);
    await hydrateAll(page);
    const pending = await page.evaluate(() =>
      [...document.querySelectorAll('astro-island[ssr]')].map((i) => i.getAttribute('component-url')));
    await context.close();
    assert.equal(pending.length, 0, `${path} : ${pending.length}/${islands} îlot(s) non hydraté(s) au bout de 20 s : ${pending.join(', ')}`);
    const hydration = messages.filter((m) => /hydrat/i.test(m));
    assert.deepEqual(hydration, [], hydration.join('\n'));
  });
}
