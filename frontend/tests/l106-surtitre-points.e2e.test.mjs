// L106 — sur-titres « A · B · C » (accueil et PageHero) : à 320, 375 et 390 px, aucune ligne ne finit par
// « · ». Avant L106, à 375 px, le sur-titre de l'accueil laissait un « · » seul en fin de première ligne.
// Mesure sur le rendu : pour chaque « · », on compare la ligne (haut du rectangle) du point et celle du
// premier caractère visible qui le suit ; si celui-ci est plus bas, le point finit sa ligne.
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { setupBrowser, pageReady, DIST } from './lib/e2e-dist.mjs';

const LARGEURS = [320, 375, 390];
const SURTITRE_ACCUEIL = 'main section.codex-noise > div.relative > p:first-child';
const SURTITRE_PAGEHERO = 'main section.codex-grid > div > p:first-child';

// Toutes les pages construites dont un sur-titre contient un « · » (l'accueil en tête).
function routesAvecPoint() {
  const routes = [];
  const walk = (dir) => {
    for (const nom of readdirSync(dir)) {
      const f = join(dir, nom);
      if (statSync(f).isDirectory()) walk(f);
      else if (nom === 'index.html') {
        const html = readFileSync(f, 'utf8');
        const surtitre = /<section[^>]*\bcodex-grid\b[^>]*>\s*<div[^>]*>\s*<p[^>]*>([^<]*)</.exec(html);
        if (surtitre && surtitre[1].includes('·')) routes.push(`/${relative(DIST, dir).split(sep).join('/')}/`);
      }
    }
  };
  walk(DIST);
  return routes;
}

// Renvoie les « · » qui finissent une ligne, avec le texte de l'élément.
async function pointsEnFinDeLigne(page, selector) {
  return page.$eval(selector, (el) => {
    const fautes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const chars = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (let i = 0; i < n.data.length; i++) chars.push([n, i]);
    }
    const rect = ([n, i]) => {
      const r = document.createRange();
      r.setStart(n, i);
      r.setEnd(n, i + 1);
      return r.getClientRects()[0];
    };
    chars.forEach(([n, i], k) => {
      if (n.data[i] !== '·') return;
      const point = rect([n, i]);
      const suivant = chars.slice(k + 1).find(([m, j]) => /\S/.test(m.data[j]) && m.data[j] !== ' ');
      if (!point || !suivant) return;
      const r = rect(suivant);
      if (r && r.top > point.top + point.height / 2) fautes.push(el.textContent.trim());
    });
    return fautes;
  });
}

async function verifier(env, route, selector, width, avantMesure) {
  const context = await env.browser.newContext({ viewport: { width, height: 800 } });
  try {
    const page = await context.newPage();
    await page.goto(env.base + route);
    await pageReady(page);
    if (avantMesure) await avantMesure(page);
    return { fautes: await pointsEnFinDeLigne(page, selector) };
  } finally {
    await context.close();
  }
}

test('sur-titres à « · » : aucune ligne ne finit par « · » (accueil + PageHero, 320/375/390 px)', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const cibles = [['/', SURTITRE_ACCUEIL], ...routesAvecPoint().map((r) => [r, SURTITRE_PAGEHERO])];
  assert.ok(cibles.length > 1, 'aucun sur-titre de PageHero à « · » trouvé dans dist');
  const fautes = [];
  for (const [route, selector] of cibles) {
    for (const width of LARGEURS) {
      const { fautes: f } = await verifier(env, route, selector, width);
      for (const texte of f) fautes.push(`${route} @${width}px : « ${texte} »`);
    }
  }
  t.diagnostic(`${cibles.length} sur-titres × ${LARGEURS.length} largeurs`);
  assert.deepEqual(fautes, []);
});

// Témoin : le sur-titre de l'accueil, insécables remplacées par des espaces ordinaires (rendu d'avant L106),
// laisse un « · » en fin de ligne à 375 px ; la mesure voit donc le défaut que le correctif enlève.
test('témoin L106 : sans insécables, le sur-titre de l\'accueil finit une ligne par « · » à 375 px', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { fautes } = await verifier(env, '/', SURTITRE_ACCUEIL, 375, (page) =>
    page.$eval(SURTITRE_ACCUEIL, (el) => { el.textContent = el.textContent.replace(/ /g, ' '); }));
  assert.ok(fautes.length > 0, '« · » en fin de ligne non relevé sans insécables');
});
