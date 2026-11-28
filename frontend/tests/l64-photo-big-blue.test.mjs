// L64 — photo de la tour Big-Blue sur l'étude AetherWX : copies publiées légères (≤ 300 Ko), sans
// métadonnées (EXIF/GPS, XMP, profil ICC), dimensions conformes aux attributs width/height de l'<img>,
// texte alternatif descriptif, chargement différé ; dans un navigateur, la boîte de l'image est réservée
// avant le chargement (pas de décalage) et la photo s'affiche sans débordement à 320, 390 et 1440 px.
// Les tests sur dist demandent `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const DOSSIER = '/case-studies/aetherwx-encyclopedia/';
const COPIES = {
  'big-blue-tower-480.jpg': [480, 639],
  'big-blue-tower.jpg': [720, 959],
  'big-blue-tower-960.jpg': [960, 1278],
};

// Parcourt les segments d'un JPEG : marqueurs APPn présents et taille du cadre (SOFn).
function lireJpeg(buf) {
  assert.equal(buf.readUInt16BE(0), 0xffd8, 'pas un JPEG');
  const app = [];
  let taille = null;
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`segment illisible à ${i}`);
    const m = buf[i + 1];
    if (m === 0xda) break; // début des données : plus de métadonnées après
    const len = buf.readUInt16BE(i + 2);
    const corps = buf.subarray(i + 4, i + 2 + len);
    if (m >= 0xe0 && m <= 0xef) app.push({ m, entete: corps.subarray(0, 12).toString('latin1') });
    if ((m >= 0xc0 && m <= 0xc3) || (m >= 0xc5 && m <= 0xcb) || (m >= 0xcd && m <= 0xcf)) {
      taille = [corps.readUInt16BE(3), corps.readUInt16BE(1)];
    }
    i += 2 + len;
  }
  return { app, taille };
}

for (const [nom, [w, h]] of Object.entries(COPIES)) {
  test(`L64 — ${nom} : ${w}×${h}, ≤ 300 Ko, aucune métadonnée (EXIF, GPS, XMP, ICC)`, () => {
    const f = join(PUBLIC, DOSSIER, nom);
    assert.ok(existsSync(f), `${f} absent`);
    assert.ok(statSync(f).size <= 300 * 1024, `${nom} pèse ${statSync(f).size} octets`);
    const buf = readFileSync(f);
    const { app, taille } = lireJpeg(buf);
    assert.deepEqual(taille, [w, h]);
    // Seul le segment JFIF (APP0) est permis : APP1 = EXIF/XMP (GPS compris), APP2 = ICC, APP13 = IPTC.
    assert.deepEqual(app.filter((s) => s.m !== 0xe0).map((s) => `APP${s.m - 0xe0} ${s.entete}`), []);
    assert.ok(!buf.includes(Buffer.from('Exif\0')), 'trace EXIF');
  });
}

function imgDeLaPage() {
  const page = join(DIST, 'case-studies/aetherwx-encyclopedia/index.html');
  if (!existsSync(page)) return null;
  const html = readFileSync(page, 'utf8');
  const m = html.match(/<img\b[^>]*big-blue-tower[^>]*>/);
  assert.ok(m, 'aucune <img> de la tour Big-Blue dans la page construite');
  const attr = (n) => m[0].match(new RegExp(`\\b${n}="([^"]*)"`))?.[1];
  return { attr, html };
}

test('L64 — l\'<img> de la page construite : src, srcset existants, width/height du src, alt descriptif, lazy', (t) => {
  const r = imgDeLaPage();
  if (!r) return t.skip('dist absent : lancer astro build');
  const { attr, html } = r;
  assert.equal(attr('src'), `${DOSSIER}big-blue-tower.jpg`);
  assert.equal(attr('width'), '720');
  assert.equal(attr('height'), '959');
  assert.equal(attr('loading'), 'lazy');
  const srcset = attr('srcset').split(',').map((s) => s.trim().split(/\s+/));
  assert.equal(srcset.length, 3);
  for (const [url, wd] of srcset) {
    const nom = url.replace(DOSSIER, '');
    assert.ok(existsSync(join(DIST, url)), `${url} absent de dist`);
    assert.equal(wd, `${COPIES[nom][0]}w`, `largeur annoncée de ${nom}`);
  }
  const alt = attr('alt');
  assert.ok(alt.length >= 80 && /Big-Blue/.test(alt), `alt trop pauvre : ${alt}`);
  // Légende à jour : Big-Blue est le poste de dev, le cluster est sur dark-blue.
  const fig = html.match(/<figure[^>]*data-photo="big-blue"[\s\S]*?<\/figure>/)[0];
  assert.match(fig, /poste de développement/);
  assert.match(fig, /dark-blue/);
});

for (const width of [320, 390, 1440]) {
  test(`L64 — à ${width} px : boîte réservée avant chargement, photo chargée, sans débordement`, { timeout: 120_000 }, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const page = await env.browser.newPage({ viewport: { width, height: 900 } });
    // Les images bloquées : la hauteur réservée ne doit venir que de width/height.
    await page.route('**/big-blue-tower*', (route) => route.abort());
    await page.goto(`${env.base}/case-studies/aetherwx-encyclopedia/`, { timeout: 60_000 });
    const sel = 'figure[data-photo="big-blue"] img';
    const avant = await page.$eval(sel, (img) => img.getBoundingClientRect().toJSON());
    assert.ok(avant.width > 200, `largeur ${avant.width}`);
    assert.ok(Math.abs(avant.height / avant.width - 959 / 720) < 0.01, `ratio réservé ${avant.height / avant.width}`);
    await page.unroute('**/big-blue-tower*');
    await page.reload();
    await page.$eval(sel, (img) => img.scrollIntoView());
    await page.waitForFunction((s) => document.querySelector(s)?.complete && document.querySelector(s).naturalWidth > 0, sel, { timeout: 30_000 });
    const apres = await page.$eval(sel, (img) => ({ ...img.getBoundingClientRect().toJSON(), nat: img.naturalWidth }));
    assert.ok(Math.abs(apres.height - avant.height) < 1, `décalage ${avant.height} → ${apres.height}`);
    assert.ok(apres.left >= 0 && apres.right <= width, `déborde : ${apres.left}–${apres.right}`);
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(debord <= 0, `défilement horizontal de ${debord} px`);
  });
}
