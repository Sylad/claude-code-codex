// L7/t1 — revue UX r2 de /atelier-ia/ (2026-11-22), mesurée sur le site CONSTRUIT
// (`npx astro build` avant ; tests navigateur en « skip » sans playwright-core/Chromium).
//  R1 — 1440 et 1024 px, texte à 200 % (html{font-size:200%}) : `lg:-mx-16` (128 px) dépassait la
//       gouttière de la page (64 px) : figure de x = −64 à 1489, nœuds coupés à gauche.
//  R3 — état d'erreur de MermaidDiagram : zone vide de 200 px (min-h du cadre) au-dessus du message.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';

const FIG = 'figure:has([data-mermaid-inline])';

async function open(env, path, width, { zoom = false, route } = {}) {
  const context = await env.browser.newContext({ viewport: { width, height: 900 } });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  if (route) await context.route(route, (r) => r.abort());
  const page = await context.newPage();
  if (zoom) await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'html{font-size:200% !important}';
      document.head.append(s);
    });
  });
  await page.goto(`${env.base}${path}`, { waitUntil: 'networkidle' });
  await page.locator(FIG).first().scrollIntoViewIfNeeded();
  return { context, page };
}

test('L7/t1 R1 — la figure du schéma de l\'atelier reste dans l\'écran, texte 100 et 200 %', { timeout: 240_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1440, 1024, 390, 320]) {
    for (const zoom of [false, true]) {
      const { context, page } = await open(env, '/atelier-ia/', width, { zoom });
      await page.waitForSelector(`${FIG} [data-mermaid-inline] svg`, { timeout: 20_000 });
      const r = await page.evaluate(() => {
        const f = document.querySelector('figure:has([data-mermaid-inline])').getBoundingClientRect();
        const c = document.querySelector('[data-mermaid-inline]');
        return {
          left: f.left + window.scrollX, right: f.right + window.scrollX,
          vw: document.documentElement.clientWidth, frame: c.clientWidth, scroll: c.scrollWidth,
        };
      });
      const tag = `${width} px, texte ${zoom ? 200 : 100} %`;
      assert.ok(r.left >= 0, `${tag} : figure coupée de ${(-r.left).toFixed(0)} px à gauche`);
      assert.ok(r.right <= r.vw, `${tag} : figure dépasse l'écran de ${(r.right - r.vw).toFixed(0)} px à droite`);
      // Le gain de r1 est gardé : à 100 %, le schéma est entier à 1440 et 1024 px.
      if (!zoom && width >= 1024) assert.ok(r.scroll <= r.frame, `${tag} : schéma ${r.scroll} px pour un cadre de ${r.frame} px`);
      await context.close();
    }
  }
});

test('L7/t1 R3 — en état d\'erreur, pas de zone vide au-dessus du message', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env, '/atelier-ia/', 1440, { route: /\/_astro\/mermaid\.core\./ });
  await page.waitForSelector(`${FIG} [role=alert]`, { timeout: 20_000 });
  const h = await page.evaluate(() => {
    const f = document.querySelector('figure:has([data-mermaid-inline])');
    const c = f.querySelector('[data-mermaid-inline]');
    return c ? c.getBoundingClientRect().height : 0;
  });
  assert.ok(h === 0, `zone vide de ${h} px au-dessus du message d'erreur`);
  await context.close();
});
