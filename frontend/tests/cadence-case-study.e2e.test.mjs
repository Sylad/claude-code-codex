// L19 — étude de cas cadence (/case-studies/cadence/) sur le site CONSTRUIT : sections du gabarit,
// chiffres tirés du dépôt cadence, liens sans doublon avec le Livre de bord, entrée dans l'index
// des études de cas et lien depuis l'accueil, rien de privé. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { PRIVATE_PATTERNS } from '../src/lib/livre-de-bord.ts';

const read = (...p) => readFileSync(join(DIST, ...p), 'utf8');
const PAGE = join(DIST, 'case-studies', 'cadence', 'index.html');
const main = (html) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const text = (html) => main(html).replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

test('R1 — la page est construite, titrée, avec un seul h1', () => {
  assert.ok(existsSync(PAGE), 'page absente : lancer `npx astro build`');
  const html = read('case-studies', 'cadence', 'index.html');
  assert.match(html, /<title>Cadence[^<]*<\/title>/);
  assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1);
});

test('R2 — les sections demandées par le lot y sont, dans l’ordre', () => {
  const html = read('case-studies', 'cadence', 'index.html');
  const eyebrows = [...html.matchAll(/<h2[^>]*>\s*([^<]+?)\s*<\/h2>/g)].map((m) => m[1]);
  const want = ['Le problème de départ', 'La méthode', 'Les chiffres mesurés', 'Les échecs', 'Pour aller plus loin'];
  let from = 0;
  for (const w of want) {
    const at = eyebrows.findIndex((e, i) => i >= from && e.startsWith(w));
    assert.ok(at >= 0, `section « ${w} » absente ou hors ordre (${eyebrows.join(' | ')})`);
    from = at + 1;
  }
});

test('R3 — la méthode couvre les sept pièces nommées par le lot', () => {
  const t = text(read('case-studies', 'cadence', 'index.html'));
  for (const piece of ['plan raf', 'Nouveautés', 'rituels de session', 'livraison vérifiée', 'vagues orchestrate', 'lead', 'livreur']) {
    assert.ok(t.includes(piece), `« ${piece} » absent de la méthode`);
  }
});

test('R4 — les chiffres cités sont ceux du dépôt cadence (CHANGELOG, docs/mesures)', () => {
  const t = text(read('case-studies', 'cadence', 'index.html'));
  for (const n of ['28 septembre 2026', '61 %', '263 lots', '136', '96', '4 211', '565']) {
    assert.ok(t.includes(n), `chiffre « ${n} » absent`);
  }
});

test('L46 — aucune version courante de cadence n’est figée dans le chapeau, le pied ni la carte de l’index', () => {
  const page = text(read('case-studies', 'cadence', 'index.html'));
  const index = text(read('case-studies', 'index.html'));
  const figee = /(?:à la version|version) \d+\.\d+(?:\.\d+)?\b/;
  assert.doesNotMatch(page, figee, 'version figée sur la page cadence');
  assert.doesNotMatch(index, figee, 'version figée dans l’index');
});

test('R5 — les échecs disent ce qu’ils ont changé (au moins trois, chacun avec sa conséquence)', () => {
  const html = read('case-studies', 'cadence', 'index.html');
  const items = [...html.matchAll(/data-echec="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)];
  assert.ok(items.length >= 3, `${items.length} échecs`);
  for (const [, id, body] of items) assert.match(body, /Ce que ça a changé/, `échec ${id} sans conséquence`);
});

test('R6 — liens : Livre de bord, Nouveautés et dépôt cadence ; pas de recopie du Livre de bord', () => {
  const html = read('case-studies', 'cadence', 'index.html');
  const m = main(html);
  assert.match(m, /href="\/livre-de-bord\/?"/);
  assert.match(m, /href="\/nouveautes\/?"/);
  assert.match(m, /href="https:\/\/github\.com\/Sylad\/cadence"/);
  const livre = text(read('livre-de-bord', 'index.html'));
  const mine = text(html);
  // aucune phrase de plus de 80 caractères du Livre de bord n'est reprise telle quelle
  const phrases = livre.split(/(?<=[.!?])\s+/).filter((s) => s.length > 80);
  const copies = phrases.filter((s) => mine.includes(s));
  assert.deepEqual(copies, []);
});

test('R7 — l’index des études de cas porte une carte vers la page', () => {
  const html = read('case-studies', 'index.html');
  assert.match(html, /<a[^>]+href="\/case-studies\/cadence"[^>]*>/);
  assert.ok(text(html).includes('Cadence'));
});

test('R8 — l’accueil renvoie vers la page', () => {
  assert.match(main(read('index.html')), /href="\/case-studies\/cadence"/);
});

test('R9 — aucun motif privé dans la page (machines, chemins, compte pro, e-mail)', () => {
  const t = text(read('case-studies', 'cadence', 'index.html'));
  const hits = PRIVATE_PATTERNS.filter((re) => re.test(t)).map(String);
  assert.deepEqual(hits, []);
});

test('R10 — le nombre d’apps de l’index ne bouge pas : cadence est un récit transverse', () => {
  const t = text(read('case-studies', 'index.html'));
  assert.match(t, /8 apps construites avec Claude Code/);
});

test('R11 — le code en ligne est rendu en <code> : aucun backtick littéral dans la page', () => {
  const html = read('case-studies', 'cadence', 'index.html');
  assert.equal(main(html).includes('`'), false);
  assert.match(main(html), /<code[^>]*>raf now<\/code>/);
});

test('R12 — la limite assumée distingue le relevé relu (10 octobre) du relevé non relu (30 octobre)', () => {
  const t = text(read('case-studies', 'cadence', 'index.html'));
  assert.equal(t.includes('relu à la main sur un échantillon seulement'), false);
  assert.match(t, /relevé du 10 octobre[^.]*relu[^.]*échantillon/);
  assert.match(t, /relevé du 30 octobre[^.]*pas été relu/);
});

test('R13 — « 565 Ko → 5 Ko » cite docs/whats-new.md, où le chiffre se trouve', () => {
  const t = text(read('case-studies', 'cadence', 'index.html'));
  assert.equal(t.includes('CHANGELOG 1.19.0'), false);
  assert.match(t, /docs\/whats-new\.md \(1\.19\.0\)/);
});

test('R14 — la note « Chiffres relevés… » est en text-ink-muted posée sur un fond opaque bg-paper-elevated (contraste ≥ 4,5:1), pas en text-ink/50', () => {
  const html = read('case-studies', 'cadence', 'index.html');
  const p = html.match(/<p[^>]*class="([^"]*)"[^>]*>\s*Chiffres relevés dans le dépôt cadence/);
  assert.ok(p, 'note de bas de page introuvable');
  assert.match(p[1], /text-ink-muted/);
  assert.match(p[1], /(^|\s)bg-paper-elevated(\s|$)/);
  assert.doesNotMatch(p[1], /text-ink\/50/);
});

test('R16 — le paragraphe « Limite assumée » est posé sur un fond opaque bg-paper-elevated, pas sur l’image de fond', () => {
  const html = read('case-studies', 'cadence', 'index.html');
  const p = html.match(/<p[^>]*class="([^"]*)"[^>]*>\s*Limite assumée/);
  assert.ok(p, 'paragraphe « Limite assumée » introuvable');
  assert.match(p[1], /text-ink-muted/);
  assert.match(p[1], /(^|\s)bg-paper-elevated(\s|$)/);
});

test('R15 — le lien « Lire l’étude → » de la carte cadence est en text-claude sans opacité', () => {
  const html = read('case-studies', 'index.html');
  const a = html.match(/<a[^>]*href="\/case-studies\/cadence"[^>]*class="([^"]*)"[^>]*>\s*Lire l/)
    ?? html.match(/<a[^>]*class="([^"]*)"[^>]*href="\/case-studies\/cadence"[^>]*>\s*Lire l/);
  assert.ok(a, 'lien introuvable');
  assert.match(a[1], /(^|\s)text-claude(\s|$)/);
  assert.doesNotMatch(a[1], /text-claude\/\d+/);
});
