// L113 — la mesure des libellés de L110 (tests/lib/libelles-schemas.mjs : un libellé qui déborde de sa boîte ou
// en chevauche un autre, mesuré sur la largeur rendue du texte) sur TOUTES les pages du site construit qui ont
// un figure.schema, en français et en anglais (les pages /en/ sont dans dist comme les autres), à 320, 390, 840
// et 1440 px, texte à 100 % et à 200 %, polices web bloquées (police de repli) et chargées.
// Les pages sont trouvées dans dist, pas listées à la main : une page qui reçoit un schéma est mesurée d'office.
// L'étude de cas cadence (FR et EN) reste mesurée par l110-schemas-libelles ; elle n'est pas mesurée deux fois.
// Lit le site CONSTRUIT : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { LARGEURS, POLICES, mesurerPage } from './lib/libelles-schemas.mjs';

const MESUREES_PAR_L110 = ['/case-studies/cadence/', '/en/case-studies/cadence/'];

function pagesHtml(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return pagesHtml(p);
    return e.name === 'index.html' ? [p] : [];
  });
}

/** Adresse → identifiants des schémas que porte la page construite. */
function pagesAvecSchemas() {
  const pages = new Map();
  for (const f of pagesHtml(DIST)) {
    const html = readFileSync(f, 'utf8');
    const ids = [...html.matchAll(/<figure class="schema"[^>]*data-schema="([^"]+)"/g)].map((m) => m[1]);
    if (!ids.length) continue;
    const dossier = relative(DIST, f).split(sep).slice(0, -1).join('/');
    pages.set(dossier ? `/${dossier}/` : '/', ids.sort());
  }
  return pages;
}

const PAGES = pagesAvecSchemas();

test('L113 — les pages à schémas sont trouvées dans le site construit', () => {
  for (const p of ['/case-studies/pourquoi-cadence/', '/livre-de-bord/', ...MESUREES_PAR_L110]) {
    assert.ok(PAGES.has(p), `${p} : aucun figure.schema trouvé (pages vues : ${[...PAGES.keys()].join(', ')})`);
  }
});

// `cible` : [adresse, identifiants des schémas attendus]
async function ecartsDe(env, [path, ids], largeur, police, policesWeb) {
  const schemas = await mesurerPage(env, path, largeur, police, policesWeb);
  const ou = `${path} ${largeur} px ${police * 6.25} %`;
  assert.deepEqual(schemas.map((s) => s.id).sort(), ids, `${ou} : schémas attendus`);
  for (const s of schemas) assert.ok(s.version, `${ou} ${s.id} : ni dessin ni liste affichés`);
  return schemas.flatMap((s) => s.ecarts.map((e) => `${ou} ${s.id} (${s.version}) : ${e}`));
}

for (const policesWeb of [false, true]) {
  test(`L113 — aucun libellé ne déborde ni n'en chevauche un autre, toutes les pages à schémas, 4 largeurs, 100 et 200 % (polices web ${policesWeb ? 'chargées' : 'bloquées'})`, { timeout: 600_000 }, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const ecarts = [];
    for (const cible of PAGES) {
      if (MESUREES_PAR_L110.includes(cible[0])) continue;
      for (const largeur of LARGEURS) {
        for (const police of POLICES) ecarts.push(...(await ecartsDe(env, cible, largeur, police, policesWeb)));
      }
    }
    assert.deepEqual(ecarts, [], `libellés qui débordent ou se chevauchent :\n${ecarts.join('\n')}`);
  });
}
