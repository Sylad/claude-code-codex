// L106 (seconde moitié) — la pastille du sur-titre épouse son texte. Sur deux lignes (320 à 390 px), la
// pastille de l'accueil gardait toute la largeur disponible (à 390 px : bord droit à 370 px, texte fini
// bien avant ; à 375 px : texte jusqu'à 297 px). Règle : le bord droit de la boîte est au plus 12 px
// (padding compris) après la fin de la ligne la plus longue, à 320, 375, 390 et 1440 px ; sur une ligne,
// la boîte ne change pas (largeur = texte + padding, hauteur d'une ligne).
// Mesure indépendante du correctif : les lignes viennent de Range.getClientRects() caractère par caractère
// (espaces exclus : une espace en fin de ligne ne se voit pas), la boîte de getBoundingClientRect().
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { setupBrowser, pageReady, DIST } from './lib/e2e-dist.mjs';

const LARGEURS = [320, 375, 390, 1440];
const ECART_MAX = 12;
const SURTITRE_ACCUEIL = 'main section.codex-noise > div.relative > p:first-child';
const SURTITRE_PAGEHERO = 'main section.codex-grid > div > p:first-child';

// Toutes les pages construites qui ont un sur-titre de PageHero : chacune est mesurée à 320 et 390 px.
function routesPageHero() {
  const routes = [];
  const walk = (dir) => {
    for (const nom of readdirSync(dir)) {
      const f = join(dir, nom);
      if (statSync(f).isDirectory()) walk(f);
      else if (nom === 'index.html' && /<section[^>]*\bcodex-grid\b[^>]*>\s*<div[^>]*>\s*<p\b/.test(readFileSync(f, 'utf8'))) {
        routes.push(`/${relative(DIST, dir).split(sep).join('/')}/`.replace(/^\/\/$/, '/'));
      }
    }
  };
  walk(DIST);
  return routes;
}

// Écart entre le bord droit de la boîte et celui de la ligne la plus longue, nombre de lignes.
async function mesurer(page, selector) {
  return page.$eval(selector, (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let droite = -Infinity;
    const lignes = new Set();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (let i = 0; i < n.data.length; i++) {
        if (/\s/.test(n.data[i])) continue;
        const r = document.createRange();
        r.setStart(n, i);
        r.setEnd(n, i + 1);
        for (const rect of r.getClientRects()) {
          droite = Math.max(droite, rect.right);
          lignes.add(Math.round(rect.top));
        }
      }
    }
    const boite = el.getBoundingClientRect();
    return { ecart: boite.right - droite, lignes: lignes.size, largeur: boite.width, hauteur: boite.height, texte: el.textContent.trim() };
  });
}

async function ouvrir(env, route, width, avantMesure) {
  const context = await env.browser.newContext({ viewport: { width, height: 800 } });
  const page = await context.newPage();
  await page.goto(env.base + route);
  await pageReady(page);
  if (avantMesure) await avantMesure(page);
  // Le script recalcule à l'image suivante d'un changement de taille : deux images suffisent.
  await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
  return { context, page };
}

test('sur-titres : bord droit de la pastille ≤ 12 px après la ligne la plus longue (320/375/390/1440 px)', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const cibles = [['/', SURTITRE_ACCUEIL, LARGEURS], ...routesPageHero().map((r) => [r, SURTITRE_PAGEHERO, [320, 390]])];
  const fautes = [];
  let surDeuxLignes = 0;
  for (const [route, selector, largeurs] of cibles) {
    for (const width of largeurs) {
      const { context, page } = await ouvrir(env, route, width);
      try {
        const m = await mesurer(page, selector);
        t.diagnostic(`${route} @${width}px : ${m.lignes} ligne(s), écart ${m.ecart.toFixed(1)} px`);
        if (m.lignes > 1) surDeuxLignes++;
        if (!Number.isFinite(m.ecart) || m.ecart > ECART_MAX) fautes.push(`${route} @${width}px (${m.lignes} lignes) : écart ${m.ecart.toFixed(1)} px`);
        // Le texte ne déborde jamais de la pastille (padding de 8 px au moins à droite).
        if (m.ecart < 4) fautes.push(`${route} @${width}px : texte collé au bord (${m.ecart.toFixed(1)} px)`);
      } finally {
        await context.close();
      }
    }
  }
  // Sans au moins un sur-titre sur deux lignes, la mesure ne prouverait rien.
  assert.ok(surDeuxLignes >= 3, `seulement ${surDeuxLignes} mesure(s) sur deux lignes`);
  assert.deepEqual(fautes, []);
});

// Sur une ligne (1440 px), la pastille garde le rendu d'avant : pas de largeur posée par le script, et
// même boîte que la pastille rendue sans lui (inline-block, largeur du contenu).
test('sur-titre de l\'accueil sur une ligne : boîte inchangée à 1440 px', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await ouvrir(env, '/', 1440);
  try {
    const avec = await mesurer(page, SURTITRE_ACCUEIL);
    assert.equal(avec.lignes, 1);
    const style = await page.$eval(SURTITRE_ACCUEIL, (el) => el.style.width);
    assert.equal(style, '', 'largeur posée sur une ligne');
    await page.$eval(SURTITRE_ACCUEIL, (el) => { el.removeAttribute('data-epouse'); el.style.width = ''; });
    const sans = await mesurer(page, SURTITRE_ACCUEIL);
    assert.equal(avec.largeur, sans.largeur);
    assert.equal(avec.hauteur, sans.hauteur);
  } finally {
    await context.close();
  }
});

// Témoin : l'ancien style (inline-block à pleine largeur, largeur posée annulée) rougit à 375 et 390 px.
test('témoin L106 : sans ajustement, la pastille de l\'accueil déborde de plus de 12 px à 375 et 390 px', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [375, 390]) {
    const { context, page } = await ouvrir(env, '/', width, (p) => p.addStyleTag({ content: `${SURTITRE_ACCUEIL} { width: auto !important; }` }));
    try {
      const m = await mesurer(page, SURTITRE_ACCUEIL);
      t.diagnostic(`témoin @${width}px : ${m.lignes} lignes, écart ${m.ecart.toFixed(1)} px`);
      assert.ok(m.lignes > 1 && m.ecart > ECART_MAX, `@${width}px : écart ${m.ecart.toFixed(1)} px non relevé`);
    } finally {
      await context.close();
    }
  }
});

// La largeur suit la fenêtre : 390 → 1440 (une ligne, plus de largeur posée) → 375 (deux lignes, ajustée).
test('sur-titre de l\'accueil : la pastille suit un changement de largeur de fenêtre', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await ouvrir(env, '/', 390);
  const deuxImages = () => page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
  try {
    await page.setViewportSize({ width: 1440, height: 800 });
    await deuxImages();
    const large = await mesurer(page, SURTITRE_ACCUEIL);
    assert.equal(large.lignes, 1);
    assert.ok(large.ecart <= ECART_MAX, `@1440px après 390 : écart ${large.ecart.toFixed(1)} px`);
    await page.setViewportSize({ width: 375, height: 800 });
    await deuxImages();
    const etroit = await mesurer(page, SURTITRE_ACCUEIL);
    assert.ok(etroit.lignes > 1 && etroit.ecart <= ECART_MAX, `@375px après 1440 : ${etroit.lignes} lignes, écart ${etroit.ecart.toFixed(1)} px`);
  } finally {
    await context.close();
  }
});
