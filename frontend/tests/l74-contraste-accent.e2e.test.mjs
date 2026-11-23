// L74 — le texte en couleur accent (orangé : surtitres h2 de 12 px, liens, codes, chiffres…) posé
// sur l'image de fond FIXE doit rester ≥ 4,5:1 (WCAG 1.4.3) partout, y compris quand le défilement
// l'amène en haut de la fenêtre, là où l'image est la plus claire. Avant L74 : 2,11–2,37:1 sur
// /case-studies/cadence et /case-studies/pourquoi-cadence (revue UX de L73).
//
// Méthode : TOUTES les pages construites (trouvées dans dist), à 1440 et 390 px. Dans <main> et le pied
// de page, chaque texte de couleur orangée qui n'est pas sur une surface opaque (carte, bouton) est
// trouvé par sa couleur CALCULÉE (pas par ses classes : un lien colore aussi via `[&_a]:text-claude`) ;
// un exemplaire par forme (balise + classes sur 3 niveaux). Chacun est amené à 72, 180 et 320 px du haut
// de la fenêtre, et mesuré au PIRE PIXEL : chaque pixel de glyphe contre le fond sous lui ET autour de
// lui (1 px CSS, `ring: 2` en capture ×2) — un halo ou une ombre ne compte que s'il couvre le bord.
// Lit le site CONSTRUIT : lancer `npx astro build` avant. « skip » sans playwright-core/Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DIST, setupBrowser, worstPixelContrast } from './lib/e2e-dist.mjs';

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const routes = walk(DIST)
  .filter((f) => f.endsWith('index.html'))
  .map((f) => `/${relative(DIST, f).split(sep).join('/').replace(/index\.html$/, '')}`);

// Marque (data-l74) un exemplaire de chaque forme de texte orangé hors surface opaque ; renvoie leur nombre.
function marquer() {
  const pr = document.createElement('canvas').getContext('2d');
  const rgba = (c) => { pr.clearRect(0, 0, 1, 1); pr.fillStyle = c; pr.fillRect(0, 0, 1, 1); return pr.getImageData(0, 0, 1, 1).data; };
  const seen = new Set();
  let i = 0;
  for (const el of document.querySelectorAll('main *, body > footer *')) {
    if (![...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) continue;
    if (el.closest('svg, pre, [aria-hidden="true"]') || !el.getClientRects().length) continue;
    const [r, g, b] = rgba(getComputedStyle(el).color);
    if (!(r > 200 && g > 90 && g < 200 && b < 160 && r - b > 60)) continue; // orangés (accent et voisins)
    let p = el;
    let opaque = false;
    while (p && p !== document.body) {
      if (rgba(getComputedStyle(p).backgroundColor)[3] >= 200) { opaque = true; break; }
      p = p.parentElement;
    }
    if (opaque) continue;
    const forme = [];
    for (let q = el, k = 0; q && k < 3; k++, q = q.parentElement) forme.push(`${q.tagName}.${[...q.classList].join('.')}`);
    const cle = forme.join('<');
    if (seen.has(cle)) continue;
    seen.add(cle);
    el.dataset.l74 = String(i++);
  }
  return i;
}

test('L74 — texte orangé sur le fond fixe ≥ 4,5:1 au pire pixel, toutes les pages, 1440 et 390 px, en haut de fenêtre', { timeout: 900_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  assert.ok(routes.length >= 30, `${routes.length} pages dans dist : lancer astro build`);
  const failures = [];
  const mesures = { total: 0 };
  let pire = { worst: Infinity };
  // Porte rouge de L81 : ce test, 2 × ~40 pages l'une après l'autre, était avec PageHero le chemin critique
  // de la suite (~320 s sous charge) et la porte dépassait son délai. Les deux largeurs tournent en
  // parallèle, chacune dans son contexte (comme PageHero) : mêmes pages, formes, positions, seuil.
  await Promise.all([1440, 390].map(async (width) => {
    const H = width > 1000 ? 900 : 844;
    const context = await env.browser.newContext({ viewport: { width, height: H }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const n = await page.evaluate(marquer);
      for (let k = 0; k < n; k++) {
        const sel = `[data-l74="${k}"]`;
        const loc = page.locator(sel);
        const nom = await loc.evaluate((e) => `${e.tagName.toLowerCase()} « ${e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)} »`);
        for (const off of [72, 180, 320]) {
          await page.evaluate(({ s, o }) => {
            const e = document.querySelector(s);
            window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - o);
          }, { s: sel, o: off });
          const box = await loc.boundingBox();
          // Sous la barre fixe (64 px), hors fenêtre, ou trop grand pour une capture : rien à mesurer ici.
          if (!box || box.y < 64 || box.height > 400 || box.y + box.height > H) continue;
          const { worst, glyphs } = await worstPixelContrast(page, sel, { ring: 2 });
          // Un texte orangé marqué dont aucun glyphe n'est reconnu n'est pas un succès (revue L74 r1 :
          // le texte semi-transparent passait ainsi sans être mesuré). Un seul caractère court (puce « · »)
          // ne donne que quelques pixels de glyphe : ils comptent comme une mesure.
          if (glyphs === 0) {
            failures.push(`${route} @${width}px à ${off} px du haut : ${nom} non mesuré (${glyphs} pixels de glyphe)`);
            continue;
          }
          mesures.total++;
          if (worst < pire.worst) pire = { worst, ou: `${route} @${width}px à ${off} px : ${nom}` };
          mesures[route] = (mesures[route] ?? 0) + 1;
          if (worst < 4.5) failures.push(`${route} @${width}px à ${off} px du haut : ${nom} ${worst.toFixed(2)}:1`);
        }
      }
    }
    await context.close();
  }));
  t.diagnostic(`${mesures.total} mesures sur ${routes.length} pages, pire ${pire.worst.toFixed(2)}:1 (${pire.ou})`);
  // Les deux pages du constat doivent avoir été réellement mesurées (un sélecteur muet n'est pas un succès).
  for (const r of ['/case-studies/cadence/', '/case-studies/pourquoi-cadence/']) {
    assert.ok((mesures[r] ?? 0) >= 12, `${r} : ${mesures[r] ?? 0} mesures seulement`);
  }
  assert.ok(mesures.total > 500, `${mesures.total} mesures seulement`);
  assert.deepEqual(failures, []);
});

// Revue L74 r1 : « → Case study » (liens orangés des cartes de /case-studies/, surface opaque
// bg-paper-elevated, donc hors du test ci-dessus) mesurait 4,31:1 en text-claude/80.
test('L74 — liens « Case study » des cartes de /case-studies/ ≥ 4,5:1 au pire pixel, 1440 et 390 px', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  let mesures = 0;
  let pire = Infinity;
  for (const width of [1440, 390]) {
    const context = await env.browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(`${env.base}/case-studies/`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const n = await page.evaluate(() => {
      let i = 0;
      for (const a of document.querySelectorAll('main a')) {
        if (/case study/i.test(a.textContent) && a.getClientRects().length) a.dataset.l74cs = String(i++);
      }
      return i;
    });
    assert.ok(n >= 5, `${n} liens « Case study » trouvés à ${width} px`);
    for (let k = 0; k < n; k++) {
      const sel = `[data-l74cs="${k}"]`;
      await page.locator(sel).scrollIntoViewIfNeeded();
      const { worst, glyphs } = await worstPixelContrast(page, sel);
      if (glyphs === 0) { failures.push(`@${width}px lien ${k} non mesuré (${glyphs} pixels de glyphe)`); continue; }
      mesures++;
      pire = Math.min(pire, worst);
      if (worst < 4.5) failures.push(`@${width}px lien ${k} : ${worst.toFixed(2)}:1`);
    }
    await context.close();
  }
  t.diagnostic(`${mesures} mesures, pire ${pire.toFixed(2)}:1`);
  assert.deepEqual(failures, []);
});
