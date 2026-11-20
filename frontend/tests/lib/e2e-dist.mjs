// Outils communs aux tests navigateur sur le site CONSTRUIT (frontend/dist) :
// petit serveur statique + Chromium via playwright-core (skip propre s'il manque).
// Repris d'evatosorus (L13).
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

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
    if (!existsSync(file)) { res.writeHead(404).end(); return; }
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
