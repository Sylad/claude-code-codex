// L116 — mesure sur la page rendue : couleurs calculées du trait et de la pointe du schéma « Un mécanisme par
// besoin », du fond du cadre et des boîtes, en sombre (≥ 3:1) et en clair (inchangé : rgb(122, 122, 134)).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser, pageReady } from './lib/e2e-dist.mjs';
import { contraste } from './lib/contraste.mjs';

const rgb = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);

test('L116 — flèches du schéma des besoins : ≥ 3:1 en sombre, clair inchangé', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const colorScheme of ['dark', 'light']) {
    const ctx = await env.browser.newContext({ viewport: { width: 390, height: 900 }, colorScheme });
    const p = await ctx.newPage();
    await p.goto(`${env.base}/case-studies/pourquoi-cadence/`, { waitUntil: 'load' });
    await pageReady(p);
    const m = await p.evaluate(() => {
      const fig = document.querySelector('[data-schema="besoins-mecanismes"]');
      const cs = (s) => getComputedStyle(fig.querySelector(s));
      return {
        traits: [...fig.querySelectorAll('svg line.sch-line')].map((x) => getComputedStyle(x).stroke),
        pointes: [...fig.querySelectorAll('svg path.sch-arrow')].map((x) => getComputedStyle(x).fill),
        fond: getComputedStyle(fig).backgroundColor,
        boite: cs('svg rect.sch-box').fill,
        boiteAccent: cs('svg rect.sch-box-accent').fill,
      };
    });
    assert.equal(m.traits.length, 5);
    assert.equal(m.pointes.length, 5);
    for (const c of [...m.traits, ...m.pointes]) {
      if (colorScheme === 'light') assert.deepEqual(rgb(c), [122, 122, 134], `clair : flèche ${c}`);
      for (const [nom, fond] of [['fond', m.fond], ['boîte', m.boite], ['boîte accent', m.boiteAccent]]) {
        const r = contraste(rgb(c), rgb(fond));
        assert.ok(r >= 3, `${colorScheme} : flèche ${c} sur ${nom} ${fond} = ${r.toFixed(2)}:1`);
      }
    }
    await ctx.close();
  }
});
