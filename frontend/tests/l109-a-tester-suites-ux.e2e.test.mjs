// L109 — suites de la revue UX de L35 sur « Nouveautés à tester » (/ecosystem), mesurées sur le site
// CONSTRUIT (`npx astro build` avant ; « skip » sans playwright-core/Chromium) :
// 1) aucune carte étirée par la grille : sous son contenu, une carte n'a que son propre rembourrage ;
// 2) le compteur dit ce qu'il compte (« N skills relevées, M déjà au catalogue ») ;
// 3) le lang de chaque extrait est celui que son texte donne, jamais fr supposé.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setupBrowser } from './lib/e2e-dist.mjs';
import { langueDuTexte } from '../src/lib/nouveautes-a-tester.mjs';

const FLUX = { 'github-anthropics-skills': 'skill', 'github-mcp-servers': 'mcp' };
const total = (f) => JSON.parse(readFileSync(new URL(`../src/data/feeds/${f}.json`, import.meta.url), 'utf8')).length;

for (const width of [768, 1024, 1440, 390]) {
  test(`L109 — nouveautés à tester à ${width} px : cartes à leur hauteur, compteur explicite, lang déduit`, { timeout: 120_000 }, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const context = await env.browser.newContext({ viewport: { width, height: 900 } });
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const page = await context.newPage();
    await page.goto(`${env.base}/ecosystem/`, { waitUntil: 'networkidle' });
    const section = page.locator('[data-a-tester]');

    // 1) Hauteur : bas de la carte − bas de son dernier enfant ≤ rembourrage bas + 1 px.
    const cartes = await section.locator('[data-flux]').evaluateAll((els) =>
      els.map((c) => {
        const r = c.getBoundingClientRect();
        const dernier = c.lastElementChild.getBoundingClientRect();
        const cs = getComputedStyle(c);
        return { cle: c.dataset.flux, vide: r.bottom - dernier.bottom - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth), top: r.top };
      }),
    );
    assert.equal(cartes.length, 2);
    for (const c of cartes) assert.ok(c.vide <= 1, `${c.cle} étirée : ${c.vide.toFixed(1)} px vides sous son contenu`);
    if (width >= 768) assert.ok(Math.abs(cartes[0].top - cartes[1].top) <= 1, 'les deux cartes ne sont plus côte à côte');

    // 2) Compteur : relevés, puis déjà au catalogue, et les nombres se tiennent.
    for (const [cle, nature] of Object.entries(FLUX)) {
      const bloc = section.locator(`[data-flux="${cle}"]`);
      const texte = await bloc.locator('[data-releve]').innerText();
      const m = /· (\d+) (skills? relevées?|serveurs? relevés?), (\d+|aucune?) déjà au catalogue$/.exec(texte);
      assert.ok(m, `${cle} : compteur muet sur ce qu'il compte (${texte})`);
      assert.equal(Number(m[1]), total(cle), cle);
      assert.ok(nature === 'skill' ? m[2].startsWith('skill') : m[2].startsWith('serveur'), cle);
      const deja = /^aucun/.test(m[3]) ? 0 : Number(m[3]);
      const aTester = await bloc.locator('[data-a-tester-entree]').count();
      assert.equal(deja + aTester, total(cle), `${cle} : ${deja} au catalogue + ${aTester} à tester ≠ ${total(cle)}`);
    }

    // 3) lang de chaque extrait = langue déduite de son texte ; au moins un extrait anglais n'est pas lang=fr.
    const extraits = await section.locator('[data-a-tester-entree] p.leading-relaxed').evaluateAll((ps) => ps.map((p) => ({ lang: p.getAttribute('lang') ?? 'absent', texte: p.textContent })));
    assert.ok(extraits.length > 0, 'aucun extrait');
    for (const x of extraits) assert.equal(x.lang, langueDuTexte(x.texte), x.texte);
    // Sur les flux d'aujourd'hui, seuls des résumés français sont hors catalogue ; un extrait anglais et
    // un français sont vérifiés dans tests/l35-nouveautes-a-tester.test.mjs (L109).
    await context.close();
  });
}
