// L114 — /ecosystem, bascules de filtre (Plugin, Serveur MCP, Skill, Outil / SDK) : le visiteur voit
// l'effet de son clic sans défiler. Constat de la revue UX de L109 (27-11) : à 390 px, les bascules
// arrivent en bas de l'écran et le compteur « n / N entrées », placé dessous, restait hors de la vue
// (861-877 px pour un écran de 844). Critère de la fiche : après CHAQUE clic (premier et second), le
// compteur est entièrement dans la vue et affiche le bon nombre, et le bouton cliqué n'a pas bougé.
// Mesuré sur le site CONSTRUIT (`npx astro build` avant), à 390 × 844 et 1440 × 900, tous catalogues.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';

const BASCULES = 'main button[aria-pressed]';

for (const [width, height] of [[390, 844], [1440, 900]]) {
  test(`L114 — à ${width} px, l'effet de chaque clic sur une bascule est dans la vue`, { timeout: 120_000 }, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const context = await env.browser.newContext({ viewport: { width, height } });
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const page = await context.newPage();
    await page.goto(`${env.base}/ecosystem/`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every((i) => !i.hasAttribute('ssr')));

    const bascules = page.locator(BASCULES);
    const n = await bascules.count();
    assert.ok(n >= 4, `${n} bascules`);
    const constats = [];
    for (let i = 0; i < n; i++) {
      const b = bascules.nth(i);
      for (const clic of ['premier', 'second']) {
        await b.scrollIntoViewIfNeeded();
        const avant = await b.evaluate((el) => el.getBoundingClientRect().top);
        await b.click();
        const m = await b.evaluate((el) => {
          const ile = el.closest('astro-island');
          const statut = [...ile.querySelectorAll('[role="status"]')].find((s) => /entrées/.test(s.textContent));
          const r = statut.getBoundingClientRect();
          const total = ile.querySelectorAll(':scope ul > li:has(h3)').length;
          return {
            nom: el.textContent.replace(/\s+/g, ' ').trim(),
            haut: el.getBoundingClientRect().top,
            compteur: { top: r.top, bottom: r.bottom, texte: statut.textContent.trim() },
            cartes: total,
            vue: innerHeight,
          };
        });
        const ou = `${m.nom}, ${clic} clic`;
        if (m.compteur.top < 0 || m.compteur.bottom > m.vue) {
          constats.push(`${ou} : compteur à ${Math.round(m.compteur.top)}..${Math.round(m.compteur.bottom)} hors de la vue (${m.vue})`);
        }
        if (Math.abs(m.haut - avant) > 0.5) constats.push(`${ou} : le bouton a sauté de ${Math.round(m.haut - avant)} px`);
        const [affiche] = m.compteur.texte.match(/^\d+/) ?? [];
        if (Number(affiche) !== m.cartes) constats.push(`${ou} : compteur « ${m.compteur.texte} » pour ${m.cartes} cartes`);
      }
    }
    assert.deepEqual(constats, []);
    await context.close();
  });
}
