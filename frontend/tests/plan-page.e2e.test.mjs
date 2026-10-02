// L15 — page « Plan de travail » (/plan-de-travail/) : en cours, prévu, récemment livré,
// générée AU BUILD depuis docs/plan/raf.yaml. Titres publics et états seulement : AUCUN
// texte privé du plan (titre brut, note, verdict UX, raison, sous-tâche, public: d'un lot
// masqué) ne doit sortir dans le site construit — vérifié sur TOUS les fichiers de dist,
// y compris sous forme échappée (HTML, JSON).
//
// Lit le site CONSTRUIT : lancer `npx astro build` avant. Tests navigateur en « skip »
// sans playwright-core ni Chromium. CCC_E2E_SHOTS=<dossier> enregistre des captures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { DIST, setupBrowser, worstPixelContrast } from './lib/e2e-dist.mjs';
import { MIN_NEEDLE, listFiles, normalize, privateTexts, scanForLeaks, splitNeedles } from './lib/plan-leaks.mjs';
import { newsTitlesByLot, parsePublicPlan, publicTitleOf } from '../src/lib/plan-public.ts';

const { parse } = createRequire(new URL('../package.json', import.meta.url))('yaml');
const RAF_TEXT = readFileSync(new URL('../../docs/plan/raf.yaml', import.meta.url), 'utf8');
const RAF = parse(RAF_TEXT);
const NEWS = JSON.parse(readFileSync(new URL('../public/nouveautes-data/nouveautes.json', import.meta.url), 'utf8')).entries;
const PAGE = join(DIST, 'plan-de-travail', 'index.html');
const html = () => readFileSync(PAGE, 'utf8');

// Règle de publication importée du code (pas recopiée).
const newsTitles = newsTitlesByLot(NEWS);
const publicTitle = (l) => publicTitleOf(l, newsTitles);
const published = RAF.lots.filter((l) => publicTitle(l) !== null);
// Ce que la page AFFICHE : sortie de publicPlan() (8 derniers livrés, lots au même titre
// fondus), pas la liste brute des lots publiables.
const PLAN = parsePublicPlan(RAF_TEXT, NEWS);
const shownIds = (status) => PLAN[status].map((l) => l.id);

test('dist/plan-de-travail/index.html est construit, titré « Plan de travail »', () => {
  assert.ok(existsSync(PAGE), 'page absente : lancer `npx astro build`');
  assert.match(html(), /<title>Plan de travail · claude-code-codex<\/title>/);
  assert.match(html(), /<h1[^>]*>\s*Ce qui se prépare\s*<\/h1>/);
});

test('trois sections titrées, une phrase d’explication chacune ; lots en cours et prévus dans l’ordre du plan', () => {
  const page = normalize(html());
  for (const h of ['En cours', 'Prévu', 'Récemment livré']) assert.match(page, new RegExp(`<h2[^>]*>${h}</h2>`), `section « ${h} » absente`);
  const intros = [...page.matchAll(/<p class="plan-intro[^"]*"[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').trim());
  assert.equal(intros.length, 3);
  for (const i of intros) assert.equal((i.match(/[.!?](\s|$)/g) ?? []).length, 1, `« ${i} » : une phrase attendue`);
  for (const status of ['doing', 'todo', 'done']) {
    const ids = [...page.matchAll(new RegExp(`<li[^>]*data-status="${status}"[^>]*data-id="([^"]+)"`, 'g'))].map((m) => m[1]);
    assert.deepEqual(ids, shownIds(status), status);
  }
  const ids = [...page.matchAll(/data-id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids.filter((id) => !published.some((l) => l.id === id)), [], 'lot masqué publié');
});

test('AUCUN texte privé du plan dans le site construit (forme échappée comprise)', (t) => {
  const { needles, skipped, shortTitles } = splitNeedles(privateTexts(RAF, NEWS));
  assert.ok(needles.some(([k]) => k.endsWith('note')), 'aucune note dans raf.yaml : le test ne prouverait rien');
  if (skipped.length) t.diagnostic(`${skipped.length} note(s), verdict(s) ou raison(s) de moins de ${MIN_NEEDLE} caractères non cherchés : ${skipped.map(([k]) => k).join(', ')}`);
  assert.deepEqual(shortTitles, [], `titre privé de moins de ${MIN_NEEDLE} caractères : impossible à chercher sans faux positif, relever le plancher en conscience`);
  const files = listFiles(DIST);
  assert.ok(files.length > 30, `dist presque vide (${files.length} fichiers)`);
  assert.deepEqual(scanForLeaks(DIST, needles), []);
});

test('le détecteur de fuites échoue bien sur une fuite plantée (HTML, JSON, JS échappés)', () => {
  const dir = join(homedir(), 'projects', 'developpeur', 'tmp', `codex-plan-leak-${process.pid}`);
  mkdirSync(dir, { recursive: true });
  try {
    const { needles } = splitNeedles(privateTexts(RAF, NEWS));
    const note = RAF.lots.flatMap((l) => (l.notes ?? []).map((n) => n.text)).find((t) => /[éèà'’«]/.test(t));
    const task = RAF.lots.flatMap((l) => l.tasks ?? []).find((t) => t.title?.length > 20)?.title;
    const raw = RAF.lots.find((l) => publicTitle(l) === null && l.title.length > 20).title;
    assert.ok(note && task && raw, 'il faut une note accentuée, une sous-tâche et un lot masqué pour planter');
    const html = (s) => s.replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/é/g, '&#233;').replace(/«/g, '&laquo;').replace(/"/g, '&quot;');
    const json = (s) => JSON.stringify(s).replace(/[^\x20-\x7e]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
    writeFileSync(join(dir, 'a.html'), `<p>${html(note)}</p>`);
    writeFileSync(join(dir, 'b.json'), `{"x":${json(task)}}`);
    writeFileSync(join(dir, 'c.js'), `const t=${json(raw).replace(/\//g, '\\/')};`);
    writeFileSync(join(dir, 'd.html'), '<p>Rien de privé ici.</p>');
    const leaks = scanForLeaks(dir, needles);
    for (const f of ['/a.html', '/b.json', '/c.js']) assert.ok(leaks.some((x) => x.endsWith(f)), `fuite plantée dans ${f} non détectée (${leaks.join(' ; ')})`);
    assert.ok(!leaks.some((x) => x.endsWith('/d.html')), 'faux positif');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('note courte (« ok ») : ignorée et comptée, ne fait pas échouer la suite ; titre court : signalé', () => {
  const plan = { lots: [
    { id: 'L1', title: 'Un titre brut assez long', notes: [{ date: '2026-10-02', text: 'ok' }], ux: { verdict: 'conforme' }, tasks: [{ id: 't1', title: 'Court' }] },
  ] };
  const { needles, skipped, shortTitles } = splitNeedles(privateTexts(plan, []));
  assert.deepEqual(skipped.map(([k]) => k), ['L1 note', 'L1 verdict UX']);
  assert.deepEqual(shortTitles.map(([k]) => k), ['L1/t1 titre']);
  assert.deepEqual(needles.map(([k]) => k), ['L1 titre brut']);
});

test('dates en français par le formateur commun (« 1er octobre 2026 »), jamais coupées', () => {
  const page = normalize(html());
  assert.ok(!/>1 (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/.test(page), '« 1 octobre » au lieu de « 1er »');
  if (PLAN.done.some((l) => String(l.finished).endsWith('-01'))) assert.match(page, />1er /);
  assert.match(html(), /<time datetime="\d{4}-\d{2}-\d{2}" class="whitespace-nowrap"/);
});

test('sous chaque lot, l’état du groupe n’est pas répété ; aucun identifiant de lot visible', () => {
  const page = html();
  const items = [...page.matchAll(/<li class="plan-lot[^"]*"[\s\S]*?<\/li>/g)].map((m) => normalize(m[0].replace(/<[^>]+>/g, ' ')));
  for (const t of items) assert.doesNotMatch(t, /\b(En cours|Prévu|Livré)\b/, `état répété : ${t.trim()}`);
  const main = page.slice(page.indexOf('<main'), page.indexOf('</main>'));
  const text = normalize(main.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' '));
  assert.doesNotMatch(text, /\bL\d+\b/, 'identifiant de lot visible');
  for (const l of [...PLAN.doing, ...PLAN.todo, ...PLAN.done]) {
    assert.match(page, new RegExp(`<li[^>]*data-id="${l.id}" id="lot-${l.id}"`), `${l.id} : ligne absente`);
    if (l.also) assert.match(page, new RegExp(`<li[^>]*data-id="${l.id}"[^>]*data-also="${l.also.join(' ')}"`), `${l.id} : fusion non signalée`);
  }
});

test('bandeau sans décompte nul ; section vide annoncée honnêtement', () => {
  const page = normalize(html());
  assert.doesNotMatch(page, /<span>0 /, 'décompte nul affiché');
  const has = page.includes('Les prochains travaux seront annoncés ici.');
  assert.equal(has, PLAN.todo.length === 0);
});

test('un titre public n’apparaît qu’une fois par section', () => {
  const page = normalize(html());
  for (const status of ['doing', 'todo', 'done']) {
    const titles = [...page.matchAll(new RegExp(`<li[^>]*data-status="${status}"[\\s\\S]*?<p class="plan-lot-title[^"]*"[^>]*>([^<]*)<`, 'g'))].map((m) => m[1]);
    assert.equal(new Set(titles).size, titles.length, `${status} : titre en double`);
  }
});

// ── Navigateur ──────────────────────────────────────────────────────────────
const cardContrasts = (page) => page.evaluate(() => {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (s) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1); const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data; return [r, g, b, a / 255]; };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const over = ([r, g, b, a], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)];
  const out = [];
  for (const card of document.querySelectorAll('.plan-section, .plan-summary')) {
    const bg = over(rgba(getComputedStyle(card).backgroundColor), [255, 255, 255]);
    for (const el of [card, ...card.querySelectorAll('h2, p, span, li, time, a')]) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const fg = over(rgba(getComputedStyle(el).color), bg);
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      out.push({ sel: `${card.className.split(' ')[0]} ${el.tagName}`, ratio: (a + 0.05) / (b + 0.05) });
    }
  }
  return out;
});

test('reflow 320/390/1440 px : aucun défilement horizontal, contraste des cartes ≥ 4,5:1', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const shots = process.env.CCC_E2E_SHOTS;
  if (shots) mkdirSync(shots, { recursive: true });
  for (const width of [320, 390, 1440]) {
    const context = await env.browser.newContext({ viewport: { width, height: width > 1000 ? 900 : 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${env.base}/plan-de-travail/`, { waitUntil: 'load' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 0, `${width}px : débordement horizontal de ${overflow}px`);
    const results = await cardContrasts(page);
    assert.ok(results.length > 0, 'aucun texte mesuré');
    for (const { sel, ratio } of results) assert.ok(ratio >= 4.5, `${width}px ${sel} : ${ratio.toFixed(2)}:1`);
    if (shots) await page.screenshot({ path: join(shots, `plan-${width}.png`), fullPage: true });
    await context.close();
  }
});

test('en-tête de la page ≥ 4,5:1 au pire pixel de l’image de fond (1440, 390 et 320 px)', { timeout: 90_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [1440, 390, 320]) {
    const context = await env.browser.newContext({ viewport: { width, height: width > 1000 ? 900 : 844 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(`${env.base}/plan-de-travail/`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    for (const sel of ['.plan-hero .plan-eyebrow', '.plan-hero h1', '.plan-hero .plan-lede']) {
      const { worst, glyphs } = await worstPixelContrast(page, sel);
      t.diagnostic(`${sel} @${width}px : ${worst.toFixed(2)}:1 (${glyphs} px)`);
      assert.ok(glyphs > 20, `${sel} @${width}px : glyphes non détectés`);
      if (worst < 4.5) failures.push(`${sel} @${width}px : ${worst.toFixed(2)}:1`);
    }
    await context.close();
  }
  assert.deepEqual(failures, []);
});
