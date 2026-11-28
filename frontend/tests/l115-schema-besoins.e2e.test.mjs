// L115 — schéma « Un mécanisme par besoin » de /case-studies/pourquoi-cadence/ : L113 avait réduit l'écart
// entre les boîtes à 12 unités, les flèches n'étaient plus qu'une pointe (trait ≈ 2,6 px à 320 px), et les
// libellés rendaient 10,4 px à 320 px alors que la page en promet au moins 11. On mesure le dessin rendu :
// écart de 20 unités entre les boîtes, trait visible avant la pointe, libellés ≥ 11 px rendus, aucune boîte
// de texte qui en chevauche une autre ni qui sort de sa boîte, avec la police web et en police de repli.
// 305 px = un écran de 320 px avec une barre de défilement classique de 15 px (dessin de 272 px de large).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser, pageReady } from './lib/e2e-dist.mjs';

const LARGEURS = [305, 320, 390, 1440];

test('L115 — flèches avec un trait, libellés ≥ 11 px, sans chevauchement (police web et de repli)', { timeout: 240_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const repli of [false, true]) {
    for (const width of LARGEURS) {
      const ctx = await env.browser.newContext({ viewport: { width, height: 900 } });
      const p = await ctx.newPage();
      if (repli) await p.route(/\.woff2?(\?|$)/, (r) => r.abort());
      await p.goto(`${env.base}/case-studies/pourquoi-cadence/`, { waitUntil: 'load' });
      await pageReady(p);
      const m = await p.evaluate(() => {
        const svg = document.querySelector('[data-schema="besoins-mecanismes"] svg');
        const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        const textes = [...svg.querySelectorAll('text')];
        const px = Math.min(...textes.map((x) => parseFloat(getComputedStyle(x).fontSize) * k));
        const lignes = [...svg.querySelectorAll('g')].map((g) => {
          const [gauche, droite] = [...g.querySelectorAll('rect')].map((r) => r.getBBox());
          const pointe = g.querySelector('path').getBBox();
          return { ecart: droite.x - (gauche.x + gauche.width), trait: pointe.x - (gauche.x + gauche.width) };
        });
        const boites = textes.map((x) => ({ s: x.textContent, r: x.getBoundingClientRect() }));
        const chevauchent = [];
        for (let i = 0; i < boites.length; i++) for (let j = i + 1; j < boites.length; j++) {
          const a = boites[i].r, b = boites[j].r;
          if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) chevauchent.push(`${boites[i].s} × ${boites[j].s}`);
        }
        const dehors = [...svg.querySelectorAll('g')].flatMap((g) => {
          const rects = [...g.querySelectorAll('rect')].map((r) => r.getBBox());
          return [...g.querySelectorAll('text')].filter((x) => {
            const b = x.getBBox();
            return !rects.some((r) => b.x >= r.x && b.x + b.width <= r.x + r.width + 0.01);
          }).map((x) => x.textContent);
        });
        return { k, px, lignes, chevauchent, dehors };
      });
      const ou = `@${width}px${repli ? ' (police de repli)' : ''}`;
      assert.ok(m.px >= 11, `${ou} : libellé du schéma à ${m.px.toFixed(2)} px`);
      for (const l of m.lignes) {
        assert.ok(l.ecart >= 20, `${ou} : écart de ${l.ecart} unités entre les boîtes`);
        // trait visible avant la pointe : au moins 12 unités, soit ≈ 9,6 px quand le dessin fait 272 px
        assert.ok(l.trait >= 12, `${ou} : trait de ${l.trait} unités avant la pointe`);
        assert.ok(l.trait * m.k >= 9, `${ou} : trait de ${(l.trait * m.k).toFixed(1)} px avant la pointe`);
      }
      assert.deepEqual(m.chevauchent, [], `${ou} : libellés qui se chevauchent`);
      assert.deepEqual(m.dehors, [], `${ou} : libellé hors de sa boîte`);
      await ctx.close();
    }
  }
});
