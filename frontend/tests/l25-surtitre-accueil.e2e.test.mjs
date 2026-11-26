// L25 — sur-titre orangé de 12 px de la page d'accueil (src/pages/index.astro), posé sur l'image de fond
// fixe du site. Mesuré au PIRE PIXEL avec la mesure partagée de l'en-tête (contrasteEntete, L24) :
// 6 largeurs × 3 défilements, seuil 4,5:1 (WCAG 1.4.3 : 12 px est un texte normal). Chaque glyphe est
// comparé au fond sous lui ET autour de lui (`ring: 2`, 1 px CSS en capture ×2, comme le texte orangé de
// L74) : c'est le bord de la lettre qui se lit sur l'image. Avant L25, posé nu sur l'image, il tombait à
// 4,46:1 à 768 px (haut de page) ; il porte désormais la pastille sombre de PageHero.
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser, contexteEntete, contrasteEntete, LARGEURS_ENTETE } from './lib/e2e-dist.mjs';

// Le premier paragraphe de l'en-tête de l'accueil (le sur-titre), sans classe propre au correctif :
// le test vise ce que voit le visiteur, pas la façon dont c'est fait.
const ENTETE_ACCUEIL = ['main section.codex-noise > div.relative > p:first-child'];
const RING = 2;

test('accueil : sur-titre ≥ 4,5:1 au pire pixel, fond autour des lettres compris (6 largeurs, 3 défilements)', { concurrency: LARGEURS_ENTETE.length }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  await Promise.all(LARGEURS_ENTETE.map((width) => t.test(`/ @${width}px`, { timeout: 180_000 }, async (tw) => {
    const context = await contexteEntete(env.browser, width);
    tw.after(() => context.close());
    const page = await context.newPage();
    const failures = await contrasteEntete(page, { base: env.base, route: '/', selectors: ENTETE_ACCUEIL, ring: RING, log: (m) => tw.diagnostic(m) });
    assert.deepEqual(failures, []);
  })));
});

// Témoin : le même sur-titre, rendu tel qu'avant L25 (sans pastille, accent plein), rougit à 768 px ;
// la mesure ci-dessus sait donc voir le défaut que le correctif enlève.
test('témoin L25 : le sur-titre sans pastille rougit à 768 px', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await contexteEntete(env.browser, 768);
  t.after(() => context.close());
  const page = await context.newPage();
  const failures = await contrasteEntete(page, {
    base: env.base, route: '/', selectors: ENTETE_ACCUEIL, ring: RING, scrolls: [0], log: (m) => t.diagnostic(m),
    avantMesure: (p) => p.addStyleTag({
      content: `${ENTETE_ACCUEIL[0]} { display: block !important; padding: 0 !important; background: transparent !important; color: var(--color-claude) !important; }`,
    }),
  });
  assert.ok(failures.length > 0, 'sur-titre sans pastille non relevé sous 4,5:1');
});
