// L24 — témoin de la mesure partagée de l'en-tête (contrasteEntete, tests/lib/e2e-dist.mjs), appelée
// par page-hero, nouveautes-page et plan-page. Pour chacun de ces trois tests, avec SES sélecteurs et
// une page qu'il mesure : l'en-tête intact passe, un en-tête sans contraste rougit sur chacun de ses
// trois textes, un sélecteur qui ne trouve rien rougit, un texte invisible (aucun glyphe) rougit.
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser, contexteEntete, contrasteEntete, ENTETE_PAGEHERO, ENTETE_NOUVEAUTES, ENTETE_PLAN } from './lib/e2e-dist.mjs';

const CAS = [
  // /about/ fait partie des pages que page-hero.e2e.test.mjs trouve (il écrit <PageHero>).
  { test: 'page-hero', route: '/about/', selectors: ENTETE_PAGEHERO },
  { test: 'nouveautes-page', route: '/nouveautes/', selectors: ENTETE_NOUVEAUTES },
  { test: 'plan-page', route: '/plan-de-travail/', selectors: ENTETE_PLAN },
];
const WIDTH = 390;

// Casse l'en-tête : gris moyen sur l'image sombre, sans la pastille du sur-titre ni l'ombre du chapeau.
const sansContraste = (selectors) => (page) => page.addStyleTag({
  content: selectors.map((s) => `${s}, ${s} *`).join(', ')
    + ' { color: rgb(110 110 110) !important; background: transparent !important; text-shadow: none !important; }',
});

test('témoin L24 : la mesure partagée de l’en-tête rougit sur un en-tête cassé (trois tests)', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const { test: nom, route, selectors } of CAS) {
    await t.test(`${nom} ${route} @${WIDTH}px`, async () => {
      const context = await contexteEntete(env.browser, WIDTH);
      try {
        const page = await context.newPage();
        const run = (opts = {}) => contrasteEntete(page, { base: env.base, route, selectors, ...opts });

        // Contrôle : intact, l'en-tête passe (le rouge qui suit vient bien de la casse).
        assert.deepEqual(await run(), [], `${nom} : en-tête intact déjà sous le seuil`);

        // En-tête sans contraste : chaque texte est relevé, en haut de page au moins.
        const failures = await run({ avantMesure: sansContraste(selectors) });
        for (const sel of selectors) {
          assert.ok(failures.some((f) => f.includes(` ${sel} @${WIDTH}px y0 `)), `${nom} : ${sel} sans contraste non relevé (${failures.join(' ; ')})`);
        }

        // Sélecteur sans résultat : échec, pas « rien à mesurer ».
        await assert.rejects(run({ selectors: [...selectors, `${selectors[0]}.absent-l24`] }), /sélecteur sans résultat/);

        // Texte invisible en haut de page : aucun glyphe reconnu, échec.
        await assert.rejects(
          run({ avantMesure: (p) => p.addStyleTag({ content: `${selectors[1]} { visibility: hidden !important; }` }) }),
          /glyphes non détectés/,
        );
      } finally {
        await context.close();
      }
    });
  }
});
