// L95 (WCAG 1.4.4, revue UX de L93) — 14 textes de 11 px étaient fixés en px (`text-[11px]`) : lignes
// « Source » et « V1 · source » de l'étude cadence, sources de « Pourquoi cadence », intertitres du tableau
// de l'encyclopédie AetherWX, numéros des sommaires (/theory, guides), titre du schéma en plein écran.
// Ils ne grandissaient pas avec la taille de police du navigateur.
// Attendu, d'après la spec du lot :
//   - à 100 % (police par défaut 16 px), le rendu reste à 11 px (0,6875rem) ;
//   - à 200 % (police par défaut 32 px, réglage réel du navigateur via CDP Page.setFontSizes, pas un
//     `html { font-size }` posé par le test), chacun de ces textes grandit avec le texte (22 px) ;
//   - à 1440 et 390 px, rien ne se chevauche ni ne se coupe.
// Oracle : tout élément porteur de texte qui mesure 11 px à 100 %, sur toutes les pages construites,
// quel que soit son code. Lit le site CONSTRUIT : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, setupBrowser, pageReady } from './lib/e2e-dist.mjs';

function pages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return pages(p);
    return e.name === 'index.html' ? [`/${relative(DIST, dir).split(sep).join('/')}/`.replace(/^\/\/$/, '/')] : [];
  });
}
const ROUTES = pages(DIST);
const LARGEURS = [1440, 390];
// Pages qui portent les occurrences relevées (au moins un texte de 11 px chacune, à 1440 px).
const CITEES = [
  '/case-studies/cadence/', '/case-studies/pourquoi-cadence/', '/case-studies/aetherwx-encyclopedia/',
  '/theory/', '/argocd-k8s-pour-les-nuls/',
];

async function police(cdp, page, px) {
  await cdp.send('Page.setFontSizes', { fontSizes: { standard: px, fixed: Math.round(px * 13 / 16) } });
  await page.waitForFunction((v) => getComputedStyle(document.documentElement).fontSize === `${v}px`, px);
  await page.evaluate(async () => { for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(r)); });
}

// Marque les éléments qui portent eux-mêmes du texte et mesurent 11 px ; renvoie leur nombre.
function marquer() {
  let n = 0;
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('script, style, svg')) continue;
    const texte = [...el.childNodes].some((c) => c.nodeType === 3 && c.data.trim());
    if (texte && getComputedStyle(el).fontSize === '11px') { el.dataset.l95 = String(n++); }
  }
  return n;
}

// Pour chaque élément marqué : taille, coupure (débordement de sa boîte, ou d'un ancêtre qui masque),
// chevauchement avec un voisin (frères de l'élément et de son parent, hors éléments positionnés).
function mesurer() {
  const hors = (e) => ['absolute', 'fixed'].includes(getComputedStyle(e).position);
  const inter = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2
    && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
  const nom = (el) => `${el.tagName.toLowerCase()} « ${el.textContent.trim().slice(0, 40)} »`;
  return [...document.querySelectorAll('[data-l95]')].map((el) => {
    const r = el.getBoundingClientRect();
    const res = { nom: nom(el), taille: getComputedStyle(el).fontSize, visible: r.width > 0 && r.height > 0, defauts: [] };
    if (!res.visible) return res;
    const cs = getComputedStyle(el);
    if (cs.display !== 'inline' && el.scrollWidth > el.clientWidth + 1) res.defauts.push(`déborde (${el.scrollWidth} > ${el.clientWidth})`);
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const o = getComputedStyle(a);
      if (![o.overflowX, o.overflowY].some((v) => v === 'hidden' || v === 'clip')) continue;
      const b = a.getBoundingClientRect();
      if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1) res.defauts.push(`coupé par ${a.tagName.toLowerCase()}`);
    }
    if (!hors(el)) {
      const voisins = new Set([...(el.parentElement?.children ?? []), ...(el.parentElement?.parentElement?.children ?? [])]);
      for (const v of voisins) {
        if (v === el || v === el.parentElement || v.contains(el) || hors(v)) continue;
        const vr = v.getBoundingClientRect();
        if (vr.width && vr.height && inter(r, vr)) res.defauts.push(`chevauche ${nom(v)}`);
      }
    }
    return res;
  });
}

async function ouvrir(env, largeur) {
  const context = await env.browser.newContext({ viewport: { width: largeur, height: 900 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  return { context, page, cdp };
}

test('les pages citées sont dans dist', () => {
  for (const r of CITEES) assert.ok(ROUTES.includes(r), `${r} absent de dist : lancer astro build`);
});

test('aucune taille de police fixée à 11 px dans les sources', () => {
  const src = fileURLToPath(new URL('../src/', import.meta.url));
  const fichiers = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory()
    ? fichiers(join(d, e.name)) : /\.(css|astro|vue|ts|mjs)$/.test(e.name) ? [join(d, e.name)] : []));
  const trouves = fichiers(src).flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/text-\[11px\]|font-size\s*:\s*11px/g)]
    .map((m) => `${relative(src, f)}@${m.index}`));
  assert.deepEqual(trouves, []);
});

test('textes de 11 px : 22 px à 200 %, ni chevauchés ni coupés, à 1440 et 390 px', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const echecs = [];
  const parPage = {};
  for (const largeur of LARGEURS) {
    const { context, page, cdp } = await ouvrir(env, largeur);
    for (const route of ROUTES) {
      await police(cdp, page, 16);
      await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
      await pageReady(page);
      await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      const n = await page.evaluate(marquer);
      if (largeur === 1440) parPage[route] = n;
      if (!n) continue;
      await police(cdp, page, 32);
      for (const m of await page.evaluate(mesurer)) {
        if (m.taille !== '22px') echecs.push(`${route} @${largeur} : ${m.nom} reste à ${m.taille} à 200 %`);
        for (const d of m.defauts) echecs.push(`${route} @${largeur} : ${m.nom} ${d}`);
      }
    }
    await context.close();
  }
  for (const r of CITEES) assert.ok(parPage[r] > 0, `${r} : aucun texte de 11 px trouvé à 100 %`);
  assert.deepEqual(echecs, []);
});

test('titre du schéma en plein écran : 11 px à 100 %, 22 px à 200 %, sans chevaucher « Fermer »', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const largeur of LARGEURS) {
    const { context, page, cdp } = await ouvrir(env, largeur);
    await police(cdp, page, 16);
    await page.goto(`${env.base}/atelier-ia/`, { waitUntil: 'load' });
    await pageReady(page);
    const fig = page.locator('figure:has([data-mermaid-inline])').first();
    await fig.scrollIntoViewIfNeeded();
    await page.waitForSelector('figure [data-mermaid-inline] svg', { timeout: 20_000 });
    await fig.getByRole('button', { name: /Agrandir/ }).first().click();
    await page.waitForSelector('[role=dialog]');
    const n = await page.evaluate(() => {
      const titre = [...document.querySelectorAll('[role=dialog] span')].find((s) => /plein écran/.test(s.textContent));
      if (!titre) return 0;
      titre.dataset.l95 = '0';
      return getComputedStyle(titre).fontSize === '11px' ? 1 : -1;
    });
    assert.equal(n, 1, `@${largeur} : titre « plein écran » absent ou pas à 11 px à 100 %`);
    await police(cdp, page, 32);
    const [m] = await page.evaluate(mesurer);
    const fermer = await page.evaluate(() => {
      const a = document.querySelector('[data-l95]').getBoundingClientRect();
      const b = document.querySelector('[role=dialog] button').getBoundingClientRect();
      return Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
    });
    assert.equal(m.taille, '22px', `@${largeur} : ${m.nom} à ${m.taille} à 200 %`);
    assert.deepEqual(m.defauts, [], `@${largeur}`);
    assert.equal(fermer, false, `@${largeur} : le titre chevauche le bouton Fermer`);
    await context.close();
  }
});
