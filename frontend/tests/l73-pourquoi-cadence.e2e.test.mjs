// L73 (D-2) — page « Pourquoi cadence » (/case-studies/pourquoi-cadence/) sur le site CONSTRUIT :
// les cinq besoins qui ont fait naître cadence, sa définition en une phrase, des preuves chiffrées
// toutes datées et sourcées dans le dépôt cadence, les liens vers le dépôt et le paquet npm, rien de
// privé. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { PRIVATE_PATTERNS } from '../src/lib/livre-de-bord.ts';

const PAGE = join(DIST, 'case-studies', 'pourquoi-cadence', 'index.html');
const read = (...p) => readFileSync(join(DIST, ...p), 'utf8');
const main = (html) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const text = (html) => main(html).replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const page = () => read('case-studies', 'pourquoi-cadence', 'index.html');

test('R1 — la page est construite, titrée « Pourquoi cadence », avec un seul h1', () => {
  assert.ok(existsSync(PAGE), 'page absente : lancer `npx astro build`');
  const html = page();
  assert.match(html, /<title>Pourquoi cadence[^<]*<\/title>/);
  assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1);
});

test('R2 — les cinq besoins, dans l’ordre de Sylvain', () => {
  const html = page();
  const besoins = [...html.matchAll(/data-besoin="(\d)"/g)].map((m) => m[1]);
  assert.deepEqual(besoins, ['1', '2', '3', '4', '5']);
  const t = text(html);
  for (const mot of ['oublié', 'images', 'régression', 'maintenable', 'équipe']) {
    assert.ok(t.includes(mot), `besoin « ${mot} » absent`);
  }
});

test('R3 — cadence en une phrase : plan relié aux commits, une session par demande, registre, porte, revue', () => {
  const html = page();
  const m = html.match(/data-definition[^>]*>([\s\S]*?)<\/p>/);
  assert.ok(m, 'phrase de définition absente');
  const def = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  for (const piece of ['plan versionné', 'commits', 'une session par demande', 'registre des demandes', 'porte de tests', 'revue']) {
    assert.ok(def.includes(piece), `« ${piece} » absent de la définition : ${def}`);
  }
  assert.equal((def.match(/\./g) ?? []).length <= 1, true, 'la définition tient en une phrase');
});

test('R4 — chaque chiffre est daté et sourcé dans le dépôt cadence', () => {
  const html = page();
  const chiffres = [...html.matchAll(/<div[^>]*data-chiffre="([^"]+)"[^>]*>([\s\S]*?)<\/div>/g)];
  assert.ok(chiffres.length >= 4, `${chiffres.length} chiffres`);
  for (const [, id, corps] of chiffres) {
    const t = corps.replace(/<[^>]+>/g, ' ');
    assert.match(t, /\b\d{1,2}(er)? (septembre|octobre|novembre) 2026\b/, `${id} sans date`);
    assert.match(t, /Source :\s+docs\/[\w./-]+\.md/, `${id} sans source`);
  }
});

test('R5 — les chiffres attendus y sont, tels que le dépôt cadence les écrit', () => {
  const t = text(page());
  for (const n of ['×3,8', '8 sur 8', '52 min', '199 min', '3 sur 3', '0 sur 3', '+7 %', '2 871 s', '2 878 s', '39 contre 24', '0 contre 2', '2 sur 2', '4 sur 4']) {
    assert.ok(t.includes(n), `chiffre « ${n} » absent`);
  }
});

test('R6 — la page dit aussi ce que les mesures ne prouvent pas (honnêteté)', () => {
  const html = page();
  assert.match(html, /data-limites/);
  const t = text(html);
  assert.ok(t.includes('×1,76'), 'le banc perdu sans référence à lire (×1,76) est dit');
  assert.ok(t.includes('80 contre 88'), 'le critère perdu le 18 novembre est dit');
});

test('R7 — liens vers le dépôt et le paquet npm @sylad/cadence', () => {
  const m = main(page());
  assert.match(m, /href="https:\/\/github\.com\/Sylad\/cadence"/);
  assert.match(m, /href="https:\/\/www\.npmjs\.com\/package\/@sylad\/cadence"/);
  assert.ok(text(page()).includes('npm install -g @sylad/cadence'));
});

test('R8 — rien de privé : machines, chemins, compte pro, e-mail, données de finance', () => {
  const t = text(page());
  const hits = PRIVATE_PATTERNS.filter((re) => re.test(t)).map(String);
  assert.deepEqual(hits, []);
  for (const mot of [/relevés? bancaires?/i, /\bsalaire\b/i, /\bmobi-blue\b/i]) assert.doesNotMatch(t, mot);
});

test('R9 — l’étude de cas cadence renvoie vers la page', () => {
  assert.match(main(read('case-studies', 'cadence', 'index.html')), /href="\/case-studies\/pourquoi-cadence\/?"/);
});

test('R10 — le code en ligne est rendu en <code> : aucun backtick littéral', () => {
  assert.equal(main(page()).includes('`'), false);
});

test('R11 — au téléphone (390 px) et au bureau (1440 px), aucun défilement latéral', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [390, 1440]) {
    const context = await env.browser.newContext({ viewport: { width, height: 900 } });
    const p = await context.newPage();
    await p.goto(`${env.base}/case-studies/pourquoi-cadence/`, { waitUntil: 'load' });
    const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    assert.ok(m.sw <= m.cw, `@${width}px : scrollWidth ${m.sw} > ${m.cw}`);
    // texte du schéma lisible : taille rendue = taille SVG × (largeur affichée / largeur du viewBox) ≥ 11 px
    const px = await p.evaluate(() => {
      const svg = document.querySelector('[data-schema="besoins-mecanismes"] svg');
      const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const sizes = [...svg.querySelectorAll('text')].map((t) => parseFloat(getComputedStyle(t).fontSize) * k);
      return Math.min(...sizes);
    });
    assert.ok(px >= 11, `@${width}px : texte du schéma à ${px.toFixed(1)} px`);
    // aucun texte ne déborde de son cadre
    const deborde = await p.evaluate(() => [...document.querySelectorAll('[data-schema="besoins-mecanismes"] g')].flatMap((g) => {
      const rects = [...g.querySelectorAll('rect')].map((r) => r.getBBox());
      return [...g.querySelectorAll('text')].filter((t) => {
        const b = t.getBBox();
        return !rects.some((r) => b.x >= r.x && b.x + b.width <= r.x + r.width);
      }).map((t) => t.textContent);
    }));
    assert.deepEqual(deborde, [], `@${width}px : texte hors de son cadre`);
    await context.close();
  }
});
