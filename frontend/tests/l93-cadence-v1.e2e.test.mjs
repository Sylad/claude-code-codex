// L93 (D-3) — /case-studies/cadence dit que sa méthode des vagues et ses chiffres d'octobre sont ceux de
// la V1 (versions 1.x), et raconte « Le problème de la V1 » : ce qui était lent et coûteux, les mesures
// (temps, jetons) et les décisions de cadence 2 (cadence run, banc, modèles par rôle, contexte allégé),
// chaque chiffre sourcé dans le dépôt cadence ; lien vers /case-studies/pourquoi-cadence sans recopie.
// Critères tirés de la consigne du lot, pas du code. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST } from './lib/e2e-dist.mjs';

const read = (...p) => readFileSync(join(DIST, ...p), 'utf8');
const page = () => read('case-studies', 'cadence', 'index.html');
const main = (html) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const plain = (frag) =>
  frag.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ');
const text = (html) => plain(main(html));

/** Le texte du chapitre « Le problème de la V1 », de son h2 au h2 suivant. */
function chapitre(html) {
  const m = main(html);
  const debut = m.search(/<h2[^>]*>\s*Le problème de la V1\s*<\/h2>/);
  assert.ok(debut >= 0, 'chapitre « Le problème de la V1 » absent');
  const suite = m.slice(debut + 10).search(/<h2[\s>]/);
  return m.slice(debut, suite < 0 ? undefined : debut + 10 + suite);
}

test('R1 — la page dit clairement que la V1 = versions 1.x, les vagues orchestrate', () => {
  const t = text(page());
  assert.match(t, /V1 \(versions 1\.x\)/, 'la définition « V1 (versions 1.x) » manque');
  const hero = t.slice(0, t.indexOf('La méthode'));
  assert.match(hero, /V1/, 'le chapeau ne nomme pas la V1');
  assert.match(hero, /vague/, 'le chapeau ne dit pas que la V1 est celle des vagues');
});

test('R2 — les chiffres d’octobre et la méthode des vagues sont marqués V1', () => {
  const html = page();
  const eyebrows = [...html.matchAll(/<h2[^>]*>\s*([^<]+?)\s*<\/h2>/g)].map((m) => m[1]);
  assert.ok(eyebrows.some((e) => /^Les chiffres mesurés de la V1/.test(e)), `section des chiffres non marquée V1 : ${eyebrows.join(' | ')}`);
  // la pièce « vagues orchestrate » porte la marque V1
  const piece = html.match(/<li[^>]*>(?:(?!<\/li>)[\s\S])*?Les vagues orchestrate[\s\S]*?<\/li>/);
  assert.ok(piece && /V1/.test(piece[0]), 'la pièce « Les vagues orchestrate » n’est pas marquée V1');
  assert.match(text(html), /parcours d'un lot dans une vague \(V1\)/);
});

test('R3 — le chapitre « Le problème de la V1 » est placé avant « Pour aller plus loin » et a une ancre', () => {
  const html = page();
  const eyebrows = [...html.matchAll(/<h2[^>]*>\s*([^<]+?)\s*<\/h2>/g)].map((m) => m[1]);
  const v1 = eyebrows.indexOf('Le problème de la V1');
  assert.ok(v1 > eyebrows.findIndex((e) => e.startsWith('Les échecs')), 'chapitre avant les échecs');
  assert.ok(v1 < eyebrows.indexOf('Pour aller plus loin'), 'chapitre après « Pour aller plus loin »');
  assert.match(main(html), /id="le-probleme-de-la-v1"/);
  assert.match(main(html), /href="#le-probleme-de-la-v1"/, 'aucun renvoi vers le chapitre depuis la méthode');
});

test('R4 — le chapitre donne les mesures de temps et de jetons de la V1', () => {
  const t = plain(chapitre(page()));
  for (const n of ['×3,8', '199 min', '52 min', '×4,5', '5,7 M', '1,27 M', '1.62']) {
    assert.ok(t.includes(n), `« ${n} » absent du chapitre`);
  }
  // le coût d'un lot de la V1, en temps et en jetons
  assert.match(t, /25 min/);
  assert.match(t, /266 k/);
});

test('R5 — les décisions de cadence 2 sont là, chacune avec son effet mesuré ou « pas encore mesuré »', () => {
  const html = chapitre(page());
  const t = plain(html);
  for (const d of ['cadence run', 'banc', 'modèle', 'contexte']) assert.ok(t.toLowerCase().includes(d), `décision « ${d} » absente`);
  const items = [...html.matchAll(/data-v2-decision="([^"]+)"[\s\S]*?(?=data-v2-decision=|$)/g)];
  assert.ok(items.length >= 4, `${items.length} décisions`);
  for (const [bloc, id] of items) {
    assert.match(bloc, /Effet mesuré\.|Pas encore mesuré\./, `décision ${id} sans effet dit`);
    assert.match(bloc, /href="https:\/\/github\.com\/Sylad\/cadence\/blob\/main\/[^"]+"/, `décision ${id} sans source`);
  }
});

test('R6 — chaque chiffre du chapitre garde sa source et sa date', () => {
  const html = chapitre(page());
  const cartes = [...html.matchAll(/data-v1-chiffre="([^"]+)"[\s\S]*?Source : <a href="([^"]+)"/g)];
  assert.ok(cartes.length >= 3, `${cartes.length} cartes de mesures V1`);
  for (const [bloc, id, href] of cartes) {
    assert.match(href, /^https:\/\/github\.com\/Sylad\/cadence\/blob\/main\//, `${id} : source hors du dépôt cadence`);
    assert.match(bloc, /20\d\d/, `${id} : sans date`);
  }
});

// Chaque nombre d'un élément du chapitre est cherché dans le fichier du dépôt cadence qu'il cite, quand ce
// dépôt est à côté (CADENCE_REPO, sinon ../cadence ou ../../cadence depuis la racine du dépôt).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CADENCE_REPO = [process.env.CADENCE_REPO, join(ROOT, '..', 'cadence'), join(ROOT, '..', '..', 'cadence')]
  .find((d) => d && existsSync(join(d, 'docs', 'v2')));

test('R7 — chaque nombre cité figure dans le fichier source du dépôt cadence', (t) => {
  if (!CADENCE_REPO) { t.skip('dépôt cadence absent à côté'); return; }
  const html = chapitre(page());
  const el = [...html.matchAll(/data-nombres="([^"]+)"[^>]*data-source="([^"]+)"/g)];
  assert.ok(el.length >= 8, `${el.length} éléments avec nombres et source`);
  for (const [, nombres, source] of el) {
    const f = join(CADENCE_REPO, source);
    assert.ok(existsSync(f), `${source} introuvable dans le dépôt cadence`);
    const src = readFileSync(f, 'utf8').replace(/(\d)[\s  ](?=\d{3}\b)/g, '$1');
    for (const n of nombres.split(' ')) {
      const re = new RegExp(`(^|[^\\d,.])${n.replace(/[.,]/g, '[.,]')}(?![\\d])`);
      assert.match(src, re, `${n} absent de ${source}`);
    }
  }
});

test('R8 — lien vers /case-studies/pourquoi-cadence, sans en recopier les phrases', () => {
  const html = page();
  assert.match(chapitre(html), /href="\/case-studies\/pourquoi-cadence\/?"/);
  const pourquoi = text(read('case-studies', 'pourquoi-cadence', 'index.html'));
  const mine = text(html);
  const phrases = pourquoi.split(/(?<=[.!?:])\s+/).filter((s) => s.length > 60);
  assert.deepEqual(phrases.filter((s) => mine.includes(s)), []);
  // les verdicts du juge et des tests cachés de l'essai restent sur Pourquoi cadence
  assert.equal(mine.includes('304 contre 301'), false, 'le détail de l’essai est recopié');
});

test('R9 — ton honnête : ce qui n’est pas encore mesuré est dit', () => {
  const t = plain(chapitre(page()));
  assert.match(t, /Pas encore mesuré\./);
  assert.match(t, /n'a pas été refait pour cadence run/);
});
