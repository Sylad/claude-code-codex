// L110 — schémas de l'étude de cas cadence, en français et en anglais : aucun libellé ne déborde de sa boîte
// ni n'en chevauche un autre, à 320, 390, 840 et 1440 px, texte à 100 % et à 200 %. La mesure porte sur la
// largeur rendue de chaque libellé (getBoundingClientRect, tests/lib/libelles-schemas.mjs), sur la version
// affichée : le dessin SVG, ou sa version en liste quand le texte agrandi la fait remplacer le dessin.
// 200 % = police par défaut 32 px réglée par CDP (Page.setFontSizes), comme un vrai réglage du navigateur ;
// polices web bloquées (police de repli, plus large que la police web : le cas le plus serré).
// Lit le site CONSTRUIT : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';
import { LARGEURS, POLICES, mesurerLibelles, mesurerPage } from './lib/libelles-schemas.mjs';

const PAGES = ['/case-studies/cadence/', '/en/case-studies/cadence/'];
const IDS = ['plan-commits', 'parcours-v2', 'chaine-livreur', 'lead-creneaux', 'memoire-fichiers', 'parcours-lot'];

// écarts d'une page à une largeur et une taille de police, préfixés de l'endroit mesuré
async function ecartsDe(env, path, largeur, police, policesWeb) {
  const schemas = await mesurerPage(env, path, largeur, police, policesWeb);
  const ou = `${path} ${largeur} px ${police * 6.25} %`;
  assert.deepEqual(schemas.map((s) => s.id).sort(), [...IDS].sort(), `${ou} : schémas attendus`);
  for (const s of schemas) assert.ok(s.version, `${ou} ${s.id} : ni dessin ni liste affichés`);
  return schemas.flatMap((s) => s.ecarts.map((e) => `${ou} ${s.id} (${s.version}) : ${e}`));
}

for (const policesWeb of [false, true]) {
  test(`L110 — aucun libellé ne déborde ni n'en chevauche un autre, deux langues, 4 largeurs, 100 et 200 % (polices web ${policesWeb ? 'chargées' : 'bloquées'})`, { timeout: 300_000 }, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const ecarts = [];
    for (const path of PAGES) {
      for (const largeur of LARGEURS) {
        for (const police of POLICES) ecarts.push(...(await ecartsDe(env, path, largeur, police, policesWeb)));
      }
    }
    assert.deepEqual(ecarts, [], `libellés qui débordent ou se chevauchent :\n${ecarts.join('\n')}`);
  });
}

// Témoin : la mesure voit un débordement quand il existe (un libellé allongé à la main).
test('L110 — témoin : un libellé allongé dans le dessin est signalé', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${env.base}/case-studies/cadence/`);
  await page.evaluate(() => {
    const t = document.querySelector('figure[data-schema="chaine-livreur"] svg text.sch-m');
    t.textContent = `${t.textContent} — ${t.textContent} — ${t.textContent}`;
  });
  const s = (await mesurerLibelles(page)).find((x) => x.id === 'chaine-livreur');
  await context.close();
  assert.equal(s.version, 'svg');
  assert.ok(s.ecarts.some((e) => /déborde de sa boîte/.test(e)), `débordement non vu : ${JSON.stringify(s.ecarts)}`);
});
