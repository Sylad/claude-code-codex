// L88 (WCAG 1.4.10, revue UX de L87) — à 320 px avec le texte à 200 %, des titres se coupaient au milieu
// d'un mot sans trait d'union (« chang|é » sur /nouveautes, « vérific|ation » et « confia|nce » sur
// /livre-de-bord, « descripti|ons » sur /plan-de-travail, « sélectionn|és » et « newsletters » sur /learning).
// Attendu : aucun mot coupé sans trait à 320, 390 et 768 px, texte de 100 à 200 %, sur toutes les pages ;
// la césure française (hyphens: auto, lang=fr) seulement là où un mot ne tient pas ; rendu inchangé au
// réglage normal. Texte agrandi simulé comme dans la revue : html { font-size: N % }.
// Mesure : tests/lib/mots-casses.mjs. Lit le site CONSTRUIT : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { motsCasses } from './lib/mots-casses.mjs';

function pages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return pages(p);
    return e.name === 'index.html' ? [`/${relative(DIST, dir).split(sep).join('/')}/`.replace(/^\/\/$/, '/')] : [];
  });
}
const ROUTES = pages(DIST);
const LARGEURS = [320, 390, 768];
const TAILLES = [100, 125, 150, 175, 200];
const CITEES = ['/nouveautes/', '/livre-de-bord/', '/plan-de-travail/', '/learning/'];

// La césure est recalculée à l'image qui suit un changement de taille du <body> (src/lib/cesure.mjs) :
// on attend que son dernier calcul porte sur la mise en page courante.
async function attendreCesure(page) {
  await page.waitForFunction(() => {
    const r = document.body.getBoundingClientRect();
    return document.documentElement.dataset.cesureMesure === `${r.width}x${r.height}`;
  }, null, { timeout: 15_000 });
}

// Éléments césurés et césures conditionnelles posées dans le texte affiché (hors <script> : le script de
// césure contient lui-même le caractère U+00AD).
function compterCesures() {
  let shy = 0;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('script, style') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = w.nextNode(); n; n = w.nextNode()) shy += n.data.split('\u00AD').length - 1;
  return { cesure: document.querySelectorAll('[data-cesure]').length, shy };
}

async function ouvrir(page, url) {
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await attendreCesure(page);
  // Le texte des <details> fermés compte aussi (revue L87, m2) : on les ouvre tous.
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  await attendreCesure(page);
}

test('les pages citées par la revue sont dans dist', () => {
  for (const r of CITEES) assert.ok(ROUTES.includes(r), `${r} absent de dist : lancer astro build`);
});

test('la césure automatique n\'est donnée qu\'aux éléments marqués data-cesure', () => {
  const src = fileURLToPath(new URL('../src/', import.meta.url));
  const fichiers = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory()
    ? fichiers(join(d, e.name)) : /\.(css|astro|vue)$/.test(e.name) ? [join(d, e.name)] : []));
  const trouves = [];
  for (const f of fichiers(src)) {
    const texte = readFileSync(f, 'utf8');
    for (const m of texte.matchAll(/hyphens\s*:\s*auto|\bhyphens-auto\b/g)) trouves.push(`${relative(src, f)}@${m.index}`);
  }
  const css = readFileSync(join(src, 'styles/global.css'), 'utf8');
  assert.match(css, /\[data-cesure\]\s*\{\s*-webkit-hyphens:\s*auto;\s*hyphens:\s*auto;\s*\}/);
  assert.equal(trouves.length, 2, `hyphens: auto ailleurs que sous [data-cesure] : ${trouves.join(', ')}`);
});

test('l\'outil de mesure voit une coupure sans trait et accepte une césure', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const page = await env.browser.newPage();
  const bloc = (style, texte, largeur = 70) => `<p style="width:${largeur}px;font-size:20px;overflow-wrap:anywhere;${style}">${texte}</p>`;
  await page.setContent(`<html lang="fr"><body>${bloc('', 'confiance')}</body></html>`);
  assert.equal((await page.evaluate(motsCasses)).length, 1, 'mot coupé de force non vu');
  await page.setContent(`<html lang="fr"><body>${bloc('hyphens:auto', 'vérification descriptions')}</body></html>`);
  assert.deepEqual(await page.evaluate(motsCasses), [], 'une césure au dictionnaire est permise');
  await page.setContent(`<html lang="fr"><body>${bloc('', 'le 23 no\u00ADvembre')}</body></html>`);
  assert.deepEqual(await page.evaluate(motsCasses), [], 'une césure conditionnelle (U+00AD) est permise');
  await page.setContent(`<html lang="fr"><body>${bloc('', 'PersistentVolumeClaim warhammer40k /geoserver/web/')}</body></html>`);
  assert.deepEqual(await page.evaluate(motsCasses), [], 'un identifiant ou un chemin n\'est pas un mot');
  await page.setContent(`<html lang="fr"><body>${bloc('hyphens:auto', 'confiance')}</body></html>`);
  assert.equal((await page.evaluate(motsCasses)).length, 1, 'une coupure hors point de césure reste une faute');
});

test('aucun mot coupé sans trait d\'union à 320, 390 et 768 px, texte de 100 à 200 %', { timeout: 900_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const fautes = [];
  for (const width of LARGEURS) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await ouvrir(page, `${env.base}${route}`);
      for (const taille of TAILLES) {
        await page.evaluate((n) => { document.documentElement.style.fontSize = `${n}%`; }, taille);
        await attendreCesure(page);
        const casses = await page.evaluate(motsCasses);
        if (casses.length) fautes.push(`${route} @${width}px ${taille} % : ${casses.slice(0, 5).join(', ')}${casses.length > 5 ? ` (+${casses.length - 5})` : ''}`);
      }
    }
    await context.close();
  }
  assert.deepEqual(fautes, []);
});

test('réglage normal (texte 100 %, 390 à 1440 px) : aucune césure posée, rendu inchangé', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const marques = [];
  for (const width of [390, 768, 1440]) {
    const context = await env.browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await ouvrir(page, `${env.base}${route}`);
      const n = await page.evaluate(compterCesures);
      if (n.cesure || n.shy) marques.push(`${route} @${width}px : ${n.cesure} élément(s) césuré(s), ${n.shy} césure(s) posée(s)`);
    }
    await context.close();
  }
  assert.deepEqual(marques, []);
});

test('la césure suit la taille du texte : posée à 200 %, retirée au retour à 100 %', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await ouvrir(page, `${env.base}/nouveautes/`);
  const compte = () => page.evaluate(compterCesures);
  const avant = await compte();
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  await attendreCesure(page);
  const grand = await compte();
  assert.ok(grand.cesure > avant.cesure, `200 % : ${grand.cesure} élément(s) césuré(s), pas plus qu'à 100 % (${avant.cesure})`);
  // Le titre cité par la revue (« chang|é ») tient désormais sur ses lignes.
  const h1 = await page.evaluate(() => document.querySelector('h1').textContent.trim());
  assert.match(h1, /changé/);
  await page.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await attendreCesure(page);
  assert.deepEqual(await compte(), avant, 'retour à 100 % : la page revient à son état initial');
  await context.close();
});
