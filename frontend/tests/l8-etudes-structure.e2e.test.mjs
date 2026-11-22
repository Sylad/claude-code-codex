// L8 — revue UX des études de cas (tmp/ux-codex-L8.md), contrôles tirés du rapport, sur le site CONSTRUIT
// (`npx astro build` avant) — lecture statique de dist, sans navigateur :
//  R1 (majeur 2) : tout lien interne de l'index des études et de chaque étude répond (aucune 404) ;
//                  une ancre vise un id qui existe sur la page cible.
//  R2 (majeur 4) : plan de titres sans saut (h1 → h2 → h3), et chaque section a un vrai h2.
//  R3 (majeur 5) : une seule date d'étude par page, « Mis à jour le <date> » (format-date.mjs), en tête,
//                  sur TOUTES les études ; aucune date ISO (aaaa-mm-jj) ni « Mise à jour <date> » affichée.
//  R4 (mineur 6) : aucun backtick Markdown affiché brut hors <code>/<pre>.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { ISO_DATE_ISOLEE } from '../src/lib/format-date.mjs';

const dir = join(DIST, 'case-studies');
const ETUDES = existsSync(dir)
  ? readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(dir, e.name, 'index.html'))).map((e) => e.name)
  : [];
const PAGES = ['case-studies', ...ETUDES.map((e) => `case-studies/${e}`)];
const html = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const main = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));

const entites = (s) => s.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;|&#34;/g, '"')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;| | /g, ' ');
/** Texte visible de <main>, sans <code>, <pre>, <script>, <style> (et sans ce qu'ils contiennent). */
const texteHorsCode = (h) => entites(main(h)
  .replace(/<(script|style|pre|code|template)\b[\s\S]*?<\/\1>/g, ' ')
  .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');

test('les études de cas sont trouvées', () => {
  assert.ok(ETUDES.length >= 20, `${ETUDES.length} études trouvées : lancer astro build`);
});

/** Fichier de dist servi pour un chemin (même règle que le serveur statique des tests et que Pages). */
function servi(path) {
  const f = join(DIST, decodeURIComponent(path));
  if (existsSync(f) && statSync(f).isFile()) return f;
  if (existsSync(join(f, 'index.html'))) return join(f, 'index.html');
  return null;
}

test('R1 — tout lien interne de l\'index et des études répond (aucune 404), ancres comprises', () => {
  const morts = [];
  let n = 0;
  for (const p of PAGES) {
    const h = html(p);
    for (const [, href] of h.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)) {
      const url = entites(href);
      if (/^(https?:|mailto:|tel:|\/\/)/.test(url)) continue;
      const abs = new URL(url, `http://x/${p}/`);
      n++;
      const f = servi(abs.pathname);
      if (!f) { morts.push(`/${p}/ → ${url} (404)`); continue; }
      const id = decodeURIComponent(abs.hash.slice(1));
      if (id && f.endsWith('.html') && !readFileSync(f, 'utf8').includes(`id="${id}"`)) {
        morts.push(`/${p}/ → ${url} (ancre #${id} absente)`);
      }
    }
  }
  assert.ok(n >= 40, `${n} liens internes seulement : dist incomplet ?`);
  assert.deepEqual(morts, []);
});

test('R2 — plan de titres sans saut de niveau, et au moins un h2 par étude', () => {
  const ecarts = [];
  for (const e of ETUDES) {
    const niveaux = [...main(html(`case-studies/${e}`)).matchAll(/<h([1-6])\b/g)].map((m) => Number(m[1]));
    if (!niveaux.includes(2)) ecarts.push(`${e} : aucun h2`);
    let prec = 1;
    for (const n of niveaux) {
      if (n > prec + 1) { ecarts.push(`${e} : saut h${prec} → h${n}`); break; }
      prec = n;
    }
  }
  assert.deepEqual(ecarts, []);
});

test('R2 — les intitulés de section des pages Test bench sont des h2, plus des paragraphes stylés', () => {
  const ecarts = [];
  for (const e of ETUDES) {
    const m = main(html(`case-studies/${e}`));
    // L'ancien intitulé : <p class="font-mono text-xs uppercase tracking-[0.2em] text-claude">…</p>
    for (const [p] of m.matchAll(/<p\b[^>]*class="[^"]*uppercase tracking-\[0\.2em\] text-claude(?=[\s"])[^"]*"[^>]*>[\s\S]*?<\/p>/g)) {
      ecarts.push(`${e} : ${p.replace(/<[^>]+>/g, '').trim().slice(0, 40)}`);
    }
  }
  assert.deepEqual(ecarts, []);
  for (const [e, titre] of [['hermes-agent', 'Pourquoi le tester'], ['hermes-agent', 'Leçons à reprendre (8)'],
    ['token-savior', 'Pourquoi le tester'], ['ruflo', 'Pourquoi le tester'], ['drona23-token-efficient', 'Pourquoi le browser']]) {
    assert.match(main(html(`case-studies/${e}`)), new RegExp(`<h2\\b[^>]*>\\s*${titre.replace(/[()]/g, '\\$&')}\\s*</h2>`), `${e} : h2 « ${titre} »`);
  }
});

const MOIS = 'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre';
const DATE_MAJ = new RegExp(`^Mis à jour le (1er|[12]?\\d|3[01]) (${MOIS}) 20\\d\\d$`);

test('R3 — chaque étude porte une seule date, « Mis à jour le <date> », en tête, avant la première section', () => {
  const ecarts = [];
  for (const e of ETUDES) {
    const h = main(html(`case-studies/${e}`));
    const dates = [...h.matchAll(/<(\w+)[^>]*data-testid="date-maj"[^>]*>([\s\S]*?)<\/\1>/g)];
    if (dates.length !== 1) { ecarts.push(`${e} : ${dates.length} date(s) d'étude`); continue; }
    const t = entites(dates[0][2].replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
    if (!DATE_MAJ.test(t)) ecarts.push(`${e} : « ${t} »`);
    const h2 = h.indexOf('<h2');
    if (h2 >= 0 && dates[0].index > h2) ecarts.push(`${e} : date après la première section`);
  }
  assert.deepEqual(ecarts, []);
});

test('R3 — aucune date ISO ni « Mise à jour <date> » affichée dans l\'index et les études', () => {
  const ecarts = [];
  for (const p of PAGES) {
    const t = texteHorsCode(html(p));
    // Une date ISO dans un nom de fichier ou une option de commande (docs/mesures/x-2026-10-10.md,
    // --since=2026-09-09) n'est pas une date affichée au lecteur : même exclusion que le formateur.
    for (const m of t.matchAll(ISO_DATE_ISOLEE)) ecarts.push(`${p} : ${t.slice(Math.max(0, m.index - 30), m.index + 12)}`);
    if (/[Mm]ise à jour \d/.test(t)) ecarts.push(`${p} : « Mise à jour <date> »`);
  }
  assert.deepEqual(ecarts, []);
});

test('R4 — aucun backtick Markdown affiché brut hors code', () => {
  const ecarts = [];
  for (const p of PAGES) {
    const n = (texteHorsCode(html(p)).match(/`/g) ?? []).length;
    if (n) ecarts.push(`${p} : ${n} backticks`);
  }
  assert.deepEqual(ecarts, []);
});

test('mineur 7 — chaque étude finit par un retour à l’index des études', () => {
  const sans = ETUDES.filter((e) => !/<nav aria-label="Suite de lecture"[^>]*>\s*<a href="\/case-studies\/"/.test(html(`case-studies/${e}`)));
  assert.deepEqual(sans, []);
});

test('mineur 9 — aucun emoji ⭐ en guise d’icône dans l’index et les études', () => {
  const avec = PAGES.filter((p) => texteHorsCode(html(p)).includes('⭐'));
  assert.deepEqual(avec, []);
});
