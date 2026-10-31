// L60 — suite de L54 : schéma bord à bord sans 100vw, texte ≥ 11 px à 360 px, boucle partie de la QA,
// date du relevé RTK dite une fois, chaque <img> de dist pointe un fichier existant.
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { SCHEMAS } from '../src/data/livre-de-bord-schemas.ts';

const IDS = Object.keys(SCHEMAS);

// Chromium sans --hide-scrollbars : barre de défilement classique (≈ 15 px), le cas qui faisait défiler à 100vw.
async function classicScrollbarPage(env, width) {
  const require = createRequire(new URL('../package.json', import.meta.url));
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.goto(`${env.base}/livre-de-bord/`);
  return { page, close: () => browser.close() };
}

for (const width of [320, 360, 390]) {
  test(`R1 — à ${width} px avec barre de défilement classique, aucun schéma ne fait défiler la page ni ne sort à gauche`, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const { page, close } = await classicScrollbarPage(env, width);
    try {
      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const figs = [...document.querySelectorAll('.book-entry figure.schema')].map((f) => {
          const r = f.getBoundingClientRect();
          return { left: r.left, right: r.right };
        });
        return { scroll: de.scrollWidth, client: de.clientWidth, bar: innerWidth - de.clientWidth, figs };
      });
      assert.ok(m.bar > 0, 'la barre de défilement n’est pas classique : le test ne mesure rien');
      assert.ok(m.figs.length >= IDS.length - 1, `${m.figs.length} schémas mesurés`);
      assert.ok(m.scroll <= m.client, `la page défile de ${m.scroll - m.client} px`);
      for (const f of m.figs) {
        assert.ok(f.left >= 0, `schéma rogné à gauche (left = ${f.left})`);
        assert.ok(f.right <= m.client + 0.5, `schéma dépasse à droite (right = ${f.right}, client = ${m.client})`);
      }
    } finally { await close(); }
  });
}

test('R2 — à 360 px (barre classique), le plus petit texte de chaque schéma est rendu à 11 px ou plus et reste dans sa boîte', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { page, close } = await classicScrollbarPage(env, 360);
  try {
    const res = await page.evaluate((ids) => ids.map((id) => {
      const svg = document.querySelector(`.book-entry figure[data-schema="${id}"] svg`);
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const texts = [...svg.querySelectorAll('text')];
      const px = texts.map((x) => parseFloat(getComputedStyle(x).fontSize) * scale);
      const boxes = [...svg.querySelectorAll('rect.sch-box, rect.sch-box-accent')].map((r) => r.getBBox());
      const debord = texts.filter((x) => !x.getAttribute('transform')).filter((x) => {
        const b = x.getBBox();
        const box = boxes.find((r) => b.y >= r.y && b.y + b.height <= r.y + r.height + 1);
        return !box || b.x + b.width > box.x + box.width - 6;
      }).map((x) => x.textContent);
      return { id, min: Math.min(...px), debord };
    }), IDS);
    for (const { id, min, debord } of res) {
      assert.ok(min >= 11, `${id} : plus petit texte à ${min.toFixed(1)} px à 360 px`);
      assert.deepEqual(debord, [], `${id} : texte qui touche ou dépasse le bord de sa boîte`);
    }
  } finally { await close(); }
});

test('R3 — la boucle de reprise part de l’étape QA (elle a sa flèche de retour depuis la QA)', async (t) => {
  const b = SCHEMAS['boucle-verification'];
  assert.equal(b.steps[b.boucle.de].titre, 'QA');
  const env = await setupBrowser(t);
  if (!env) return;
  const page = await env.browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${env.base}/livre-de-bord/`);
  const r = await page.evaluate(() => {
    const svg = document.querySelector('figure[data-schema="boucle-verification"] svg');
    const rects = [...svg.querySelectorAll('rect')].map((x) => { const b = x.getBBox(); return { y: b.y, height: b.height }; });
    const d = svg.querySelector('[data-boucle] path.sch-line-accent').getAttribute('d');
    return { startY: parseFloat(d.match(/^M[\d.]+[ ,]([\d.]+)/)[1]), qa: rects[3], pts: rects.length };
  });
  await page.close();
  assert.equal(r.startY, r.qa.y + r.qa.height / 2);
});

test('R4 — /case-studies : la date du relevé RTK n’est dite qu’une fois dans le bloc', () => {
  const html = readFileSync(join(DIST, 'case-studies', 'index.html'), 'utf8');
  const bloc = html.match(/Preuve de collab[\s\S]*?Source : /)[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.equal(bloc.match(/31\/10\/2026/g)?.length, 1, bloc);
});

function pages(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? pages(p) : p.endsWith('.html') ? [p] : [];
  });
}

test('R5 — chaque <img> de dist pointe un fichier existant (big-blue-tower.jpg ne manque plus)', () => {
  const manque = [];
  let n = 0;
  for (const file of pages(DIST)) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/<img\b[^>]*?\bsrc="([^"]+)"/g)) {
      const src = m[1].split(/[?#]/)[0];
      if (/^(https?:)?\/\/|^data:/.test(src)) continue;
      n++;
      const target = src.startsWith('/') ? join(DIST, src) : join(dirname(file), src);
      if (!existsSync(target)) manque.push(`${file.replace(DIST, '')} → ${src}`);
    }
  }
  assert.ok(n > 0, 'aucune <img> locale trouvée : le test ne mesure rien');
  assert.deepEqual(manque, []);
});
