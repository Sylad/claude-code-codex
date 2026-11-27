// Outils communs aux tests navigateur sur le site CONSTRUIT (frontend/dist) :
// petit serveur statique + Chromium via playwright-core (skip propre s'il manque).
// Repris d'evatosorus (L13).
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

export const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
};

function serveDist() {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (path.includes('..')) { res.writeHead(400).end(); return; }
    let file = join(DIST, path);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    // L28 — comme Cloudflare Pages : une adresse inconnue reçoit le 404.html de la racine, avec le statut 404
    // (sans 404.html, Pages servirait l'accueil en 200 ; ici, réponse vide en 404).
    if (!existsSync(file)) {
      const page404 = join(DIST, '404.html');
      if (!existsSync(page404)) { res.writeHead(404).end(); return; }
      res.writeHead(404, { 'content-type': TYPES['.html'] }).end(readFileSync(page404));
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

// Renvoie { browser, base } ou null (test passé en skip) ; ferme tout en fin de test.
export async function setupBrowser(t) {
  let chromium;
  try {
    const require = createRequire(new URL('../../package.json', import.meta.url));
    ({ chromium } = require('playwright-core'));
  } catch {
    t.skip('playwright-core non installé');
    return null;
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch (e) {
    t.skip(`Chromium indisponible (${String(e.message).split('\n')[0]})`);
    return null;
  }
  const server = await serveDist();
  t.after(async () => {
    await browser.close();
    await new Promise((r) => server.close(r));
  });
  return { browser, base: `http://127.0.0.1:${server.address().port}` };
}

// L80 — page prête à être mesurée, sur signal et non après un délai (sous la charge de la porte,
// la mesure partait avant) : îlots `client:load` hydratés (la barre de navigation : son fond change
// quand on défile), polices chargées, images visibles décodées (dont le fond fixe du site).
export async function pageReady(page, timeout = 60_000) {
  await page.waitForFunction(() => !document.querySelector('astro-island[client="load"][ssr]'), null, { timeout });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const visible = (img) => {
      const r = img.getBoundingClientRect();
      return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    };
    // Une image cassée se voit par ailleurs ; ici on n'attend que la fin du décodage.
    await Promise.all([...document.images].filter(visible).map((img) => img.decode().catch(() => {})));
  });
}

// L80 — après un défilement : l'évènement `scroll` n'est émis qu'à l'image suivante, le composant
// (barre de navigation) se met à jour après, et sa transition de couleur (300 ms) démarre au calcul
// de style suivant. Attendre deux images puis amener à leur fin les animations finies : la page est
// dans l'état qu'un visiteur voit une fois le défilement fini, avant la première capture (mesuré
// sous charge avant L80 : 57 mesures où le fond de la barre changeait entre les deux captures).
export async function settleAfterScroll(page) {
  await page.evaluate(async () => {
    for (let i = 0; i < 2; i++) await new Promise((r) => requestAnimationFrame(r));
    for (const a of document.getAnimations()) {
      if (Number.isFinite(a.effect?.getComputedTiming().endTime)) a.finish();
    }
  });
}

// Contraste au PIRE PIXEL d'un texte posé sur un fond non uni (image de fond).
// Deux captures de la boîte de l'élément : texte transparent (le fond vu derrière les
// lettres), puis texte visible ; les pixels qui changent et sont proches de la couleur
// du texte sont le cœur des glyphes. Pour chacun : contraste couleur du texte / pixel du fond.
// Renvoie { worst, glyphs } (ratio minimal, nombre de pixels de glyphes mesurés).
// `ring` (pixels de capture) : chaque pixel de glyphe se compare aussi au fond de son voisinage
// (carré de côté 2·ring+1) — le fond AUTOUR des lettres, pas seulement dessous ; avec un halo
// (text-shadow), c'est le bord du halo qui compte, pas son cœur (L74).
// Texte semi-transparent (`text-claude/70`, `opacity`) : la couleur vue d'un glyphe est la couleur
// du texte composée avec son alpha (et l'opacité des ancêtres) sur le pixel du fond dessous ; c'est
// elle qui sert à reconnaître le glyphe et à calculer le contraste (revue L74 r1 : sans cela, 0 glyphe
// reconnu, texte ignoré).
export async function worstPixelContrast(page, selector, { ring = 0 } = {}) {
  const el = page.locator(selector).first();
  // L21 : un élément sous le pli (bloc de revue ajouté au-dessus) se mesure une fois amené dans la vue ;
  // la capture découpée ne sait lire que la fenêtre visible.
  await el.scrollIntoViewIfNeeded();
  await settleAfterScroll(page);
  const box = await el.boundingBox();
  const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) };
  const { color, opacity } = await el.evaluate((n) => {
    let o = 1;
    for (let p = n; p; p = p.parentElement) o *= Number(getComputedStyle(p).opacity);
    return { color: getComputedStyle(n).color, opacity: o };
  });
  await el.evaluate((n) => { n.dataset.prevColor = n.style.color; n.style.setProperty('color', 'transparent', 'important'); });
  const bg = await page.screenshot({ clip, animations: 'disabled' });
  await el.evaluate((n) => { n.style.color = n.dataset.prevColor; delete n.dataset.prevColor; });
  const fg = await page.screenshot({ clip, animations: 'disabled' });
  // L80 : les deux captures doivent montrer la même mise en page ; sinon la mesure compare un texte
  // à autre chose que son fond. Le dire plutôt que rendre un ratio faux.
  const after = await el.boundingBox();
  if (['x', 'y', 'width', 'height'].some((k) => Math.abs(after[k] - box[k]) > 0.5)) {
    throw new Error(`${selector} : la boîte a bougé pendant la mesure (${JSON.stringify(box)} → ${JSON.stringify(after)})`);
  }
  return page.evaluate(async ({ bg, fg, color, opacity, ring }) => {
    const load = async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return { data: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
    };
    // La couleur calculée peut être en oklch ou porter un alpha : la ramener en sRGB + alpha via un canvas.
    const probe = document.createElement('canvas').getContext('2d');
    probe.fillStyle = color;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, bl, al] = probe.getImageData(0, 0, 1, 1).data;
    const alpha = (al / 255) * opacity;
    const [A, Bf] = [await load(bg), await load(fg)];
    const [a, b, W, Hh] = [A.data, Bf.data, A.w, A.h];
    const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const lum = (R, G, B) => 0.2126 * lin(R) + 0.7152 * lin(G) + 0.0722 * lin(B);
    let worst = Infinity; let glyphs = 0;
    for (let i = 0; i < a.length; i += 4) {
      const diff = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
      // Couleur vue du texte à ce pixel : composée avec son alpha sur le fond dessous.
      const er = r * alpha + a[i] * (1 - alpha);
      const eg = g * alpha + a[i + 1] * (1 - alpha);
      const eb = bl * alpha + a[i + 2] * (1 - alpha);
      const near = Math.abs(b[i] - er) + Math.abs(b[i + 1] - eg) + Math.abs(b[i + 2] - eb) < 60;
      if (diff < 30 || !near) continue;
      glyphs++;
      const L = lum(er, eg, eb);
      const p = i / 4; const x0 = p % W; const y0 = (p - x0) / W;
      for (let dy = -ring; dy <= ring; dy++) {
        for (let dx = -ring; dx <= ring; dx++) {
          const x = x0 + dx; const y = y0 + dy;
          if (x < 0 || y < 0 || x >= W || y >= Hh) continue;
          const j = (y * W + x) * 4;
          const B = lum(a[j], a[j + 1], a[j + 2]);
          const ratio = (Math.max(L, B) + 0.05) / (Math.min(L, B) + 0.05);
          if (ratio < worst) worst = ratio;
        }
      }
    }
    return { worst, glyphs };
  }, { bg: bg.toString('base64'), fg: fg.toString('base64'), color, opacity, ring });
}

// L88 — la césure (src/lib/cesure.mjs) est recalculée à l'image qui suit un changement de taille du <body> :
// on attend que son dernier calcul porte sur la mise en page courante. Tout test qui mesure des coupures
// de mots mesure la page qu'un visiteur voit, césure faite (L105 : mesurée avant son premier calcul, la
// page de /nouveautes/ montrait « chang|é » coupé environ une fois sur trois).
export async function attendreCesure(page, timeout = 15_000) {
  await page.waitForFunction(() => {
    const r = document.body.getBoundingClientRect();
    return document.documentElement.dataset.cesureMesure === `${r.width}x${r.height}`;
  }, null, { timeout });
}

// L24 — contraste de l'en-tête de page (PageHero : sur-titre, titre, chapeau posés sur l'image de fond
// fixe du site). Une seule mesure pour page-hero, nouveautes-page et plan-page, qui la recopiaient :
// 6 largeurs × 3 défilements, chaque sélecteur doit trouver un élément, et en haut de page ses glyphes
// doivent être reconnus (sinon la mesure ne prouverait rien) ; seuil 4,5:1 au pire pixel.
export const LARGEURS_ENTETE = [320, 390, 768, 1024, 1440, 1920];
export const DEFILEMENTS_ENTETE = [0, 60, 100];
export const SEUIL_ENTETE = 4.5;
// Sélecteurs de chaque page, partagés avec le témoin (tests/l24-contraste-entete.e2e.test.mjs).
export const ENTETE_PAGEHERO = ['main section.codex-grid p:first-of-type', 'main section.codex-grid h1', 'main section.codex-grid h1 ~ p'];
export const ENTETE_NOUVEAUTES = ['.news-hero .news-eyebrow', '.news-hero h1', '.news-hero .news-lede'];
export const ENTETE_PLAN = ['.plan-hero .plan-eyebrow', '.plan-hero h1', '.plan-hero .plan-lede'];

// Contexte d'une largeur : même hauteur et même densité de pixels pour les trois tests.
export const contexteEntete = (browser, width) =>
  browser.newContext({ viewport: { width, height: width > 1000 ? 900 : 844 }, deviceScaleFactor: 2 });

// Mesure l'en-tête de `route` dans `page` (contexte créé par contexteEntete) aux défilements donnés.
// Lève une erreur d'assertion si un sélecteur ne trouve rien ou si, en haut de page, ses glyphes ne sont
// pas reconnus ; renvoie la liste des mesures sous le seuil (vide = conforme). `log` reçoit une ligne par
// mesure (t.diagnostic). `avantMesure(page)` s'exécute après le chargement : le témoin y casse l'en-tête.
// `ring` (L25) : comme worstPixelContrast, compare aussi chaque glyphe au fond AUTOUR de lui (0 par défaut,
// la mesure de L24) ; le sur-titre de l'accueil se mesure avec `ring: 2`, comme le texte orangé de L74.
export async function contrasteEntete(page, { base, route, selectors, log = () => {}, avantMesure, scrolls = DEFILEMENTS_ENTETE, ring = 0 }) {
  const width = page.viewportSize().width;
  const failures = [];
  await page.goto(`${base}${route}`, { waitUntil: 'load' });
  await pageReady(page);
  if (avantMesure) await avantMesure(page);
  for (const scroll of scrolls) {
    await page.evaluate((y) => window.scrollTo(0, y), scroll);
    await settleAfterScroll(page);
    for (const sel of selectors) {
      // Un sélecteur qui ne trouve rien est un échec, pas un « rien à mesurer » silencieux.
      if (!(await page.locator(sel).count())) throw new assert.AssertionError({ message: `${route} ${sel} @${width}px : sélecteur sans résultat` });
      const { worst, glyphs } = await worstPixelContrast(page, sel, { ring });
      log(`${route} ${sel} @${width}px y${scroll} : ${worst.toFixed(2)}:1 (${glyphs} px)`);
      // Défilé, le texte peut passer sous la barre fixe ; en haut de page, il doit être mesuré.
      if (scroll === 0 && glyphs <= 20) throw new assert.AssertionError({ message: `${route} ${sel} @${width}px : glyphes non détectés (${glyphs} px)` });
      if (glyphs > 20 && worst < SEUIL_ENTETE) failures.push(`${route} ${sel} @${width}px y${scroll} : ${worst.toFixed(2)}:1`);
    }
  }
  return failures;
}
