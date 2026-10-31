// L54 — Livre de bord : texte des schémas lisible au téléphone, boucle de reprise qui dit qu'elle part
// aussi de la QA. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { SCHEMAS } from '../src/data/livre-de-bord-schemas.ts';

const IDS = Object.keys(SCHEMAS);

test('R1 — à 390 px, le plus petit texte de chaque schéma du Livre de bord est rendu à 11 px ou plus', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const page = await env.browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${env.base}/livre-de-bord/`);
  const sizes = await page.evaluate((ids) => ids.map((id) => {
    const svg = document.querySelector(`.book-entry figure[data-schema="${id}"] svg`);
    const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    const px = [...svg.querySelectorAll('text')].map((x) => parseFloat(getComputedStyle(x).fontSize) * scale);
    return { id, min: Math.min(...px), n: px.length };
  }), IDS);
  await page.close();
  assert.equal(sizes.length, IDS.length);
  for (const { id, min, n } of sizes) {
    assert.ok(n > 0, `${id} : aucun texte mesuré`);
    assert.ok(min >= 11, `${id} : plus petit texte rendu à ${min.toFixed(1)} px à 390 px (11 px attendus)`);
  }
});

test('R2 — à 1440 px, les schémas gardent leur largeur de colonne (pas de bord à bord)', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const page = await env.browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${env.base}/livre-de-bord/`);
  const widest = await page.evaluate(() => Math.max(...[...document.querySelectorAll('.book-entry figure.schema')].map((f) => f.getBoundingClientRect().width)));
  await page.close();
  assert.ok(widest <= 448, `figure de ${widest}px à 1440 px (448 au plus)`);
});

test('R3 — la boucle de reprise dit qu’un défaut de la revue OU de la QA renvoie à la production', () => {
  const b = SCHEMAS['boucle-verification'];
  assert.match(b.legende, /revue/i);
  assert.match(b.legende, /QA/);
  const html = readFileSync(join(DIST, 'livre-de-bord', 'index.html'), 'utf8');
  const fig = html.match(/<figure[^>]*data-schema="boucle-verification"[^>]*>([\s\S]*?)<\/figure>/)[1];
  assert.match(fig.match(/<figcaption[^>]*>([^<]*)/)[1], /QA/);
});
