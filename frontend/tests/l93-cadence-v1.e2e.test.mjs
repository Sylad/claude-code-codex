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

// R7 — chaque nombre est vérifié À SA PLACE, des deux côtés (correction r1 de la revue L93 : l'ancien R7
// cherchait un chiffre isolé n'importe où dans le fichier source, « 0 » ou « 4 » y figurent toujours) :
//  - côté page : dans le texte de l'élément qui l'affiche (la carte V1, la cause, ou pour une ligne
//    « Source » la carte de décision qui la contient, lignes « Source » exclues) ;
//  - côté source : dans l'un des `data-passages` de l'élément, extraits recopiés mot pour mot du fichier du
//    dépôt cadence (CADENCE_REPO, sinon ../cadence ou ../../cadence depuis la racine du dépôt), chacun
//    retrouvé tel quel dans ce fichier.
// Un nombre se lit entier : « 4 » ne se trouve ni dans « 4,6 » ni dans « 24 » ni dans « 2.0.4 ».
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CADENCE_REPO = [process.env.CADENCE_REPO, join(ROOT, '..', 'cadence'), join(ROOT, '..', '..', 'cadence')]
  .find((d) => d && existsSync(join(d, 'docs', 'v2')));

const entites = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');
/** Même forme des deux côtés : sans gras markdown, espaces et retours à la ligne réduits, milliers collés. */
export const normalise = (s) => s.replace(/\*\*/g, '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ')
  .replace(/(\d) (?=\d{3}\b)/g, '$1').trim();
/** Le nombre `n`, entier : ni chiffre ni décimale collés avant ou après. */
export const nombreRe = (n) => new RegExp(`(^|[^\\d,.]|[.,](?!\\d))${n.replace(/[.,]/g, '[.,]')}(?![\\d]|[.,]\\d)`);

/** Les éléments du chapitre qui portent des nombres : { nombres, source, passages, lieu } (lieu = texte affiché). */
export function elementsChiffres(html) {
  const sansSources = (b) => b.replace(/<li data-nombres[\s\S]*?<\/li>|<li data-source[\s\S]*?<\/li>/g, ' ');
  const attrs = (tag) => Object.fromEntries([...tag.matchAll(/data-(nombres|source|passages)="([^"]*)"/g)]
    .map(([, k, v]) => [k, entites(v)]));
  const out = [];
  // cartes V1 et causes : l'élément est son propre lieu
  for (const m of html.matchAll(/<(div|li) (data-v1-(?:chiffre|cause)="[^"]+"[^>]*)>([\s\S]*?)<\/\1>/g)) {
    const a = attrs(m[2]);
    if (a.nombres) out.push({ ...a, lieu: plain(m[3]) });
  }
  // décisions : chaque ligne « Source » a pour lieu le texte de la décision qui la contient
  for (const [bloc] of html.matchAll(/data-v2-decision="[^"]+"[\s\S]*?(?=<li data-v2-decision=|$)/g)) {
    const lieu = plain(sansSources(bloc.replace(/^[^>]*>/, '')));
    for (const m of bloc.matchAll(/<li (data-nombres="[^"]+"[^>]*)>/g)) out.push({ ...attrs(m[1]), lieu });
  }
  return out;
}

/** Les écarts d'un élément contre le texte de son fichier source (liste vide = conforme). */
export function ecartsNombres({ nombres, source, passages, lieu }, texteSource) {
  const src = normalise(texteSource);
  const pas = JSON.parse(passages || '[]').map(normalise);
  const ecarts = pas.filter((p) => !src.includes(p)).map((p) => `${source} : passage introuvable « ${p} »`);
  const lieuN = normalise(lieu);
  for (const n of nombres.split(' ')) {
    if (!nombreRe(n).test(lieuN)) ecarts.push(`${n} : absent du texte affiché de l'élément`);
    if (!pas.some((p) => nombreRe(n).test(p))) ecarts.push(`${n} : dans aucun passage cité de ${source}`);
  }
  return ecarts;
}

test('R7 — chaque nombre cité est à sa place : dans sa carte, et dans un passage mot pour mot de sa source', (t) => {
  if (!CADENCE_REPO) { t.skip('dépôt cadence absent à côté'); return; }
  const el = elementsChiffres(chapitre(page()));
  assert.ok(el.length >= 12, `${el.length} éléments avec nombres et source`);
  const ecarts = [];
  for (const e of el) {
    const f = join(CADENCE_REPO, e.source);
    assert.ok(existsSync(f), `${e.source} introuvable dans le dépôt cadence`);
    ecarts.push(...ecartsNombres(e, readFileSync(f, 'utf8')));
  }
  assert.deepEqual(ecarts, []);
});

test('R7b — la règle de R7 rougit sur l’ancienne phrase « plus aucun rouge de temps (la 2.0.10) »', () => {
  // L'ancienne carte du banc (avant r1) : « 0 » déclaré, cherché n'importe où dans le CHANGELOG. Même avec
  // le passage exact du CHANGELOG (étape L737), le « 0 » n'est dit nulle part dans la carte : rouge.
  const ancienne = {
    nombres: '1,5 4 9 0',
    source: 'CHANGELOG.md',
    passages: JSON.stringify(['replayed on the 9 identical-arm reports, 0 time reds (4 before)', '"total time ≤ 1.5 × A" flagged red 4 passes out of 9']),
    lieu: "Le critère « temps total ≤ 1,5 × Claude seul » sortait rouge 4 fois sur 9 entre deux bras identiques : l'écart naturel de chaque banc est maintenant compté, et ces 9 passages ne donnent plus aucun rouge de temps (la 2.0.10). Un vrai ×2 sur un banc stable reste rouge.",
  };
  const source = '"total time ≤ 1.5 × A" flagged red 4 passes out of 9 where both arms were identical. replayed on the 9 identical-arm reports, 0 time reds (4 before), while a real × 2';
  assert.deepEqual(ecartsNombres(ancienne, source), ['0 : absent du texte affiché de l\'élément']);
  // et sans passage, comme l'ancien R7 qui cherchait dans tout le fichier : chaque nombre est rouge
  assert.equal(ecartsNombres({ ...ancienne, passages: '[]' }, source).filter((e) => /aucun passage/.test(e)).length, 4);
  // un chiffre ne se trouve plus à l'intérieur d'un autre nombre
  for (const [n, s] of [['4', '4,6 fois'], ['4', '24 min'], ['0', 'la 2.0.10'], ['11', '11,1 %'], ['5', '−5,0 %']]) {
    assert.equal(nombreRe(n).test(s), false, `« ${n} » trouvé dans « ${s} »`);
  }
  for (const [n, s] of [['4', '4 fois sur 9'], ['11,9', '11.9 min'], ['5,0', '(−5,0 %)'], ['2.0.0', 'la 2.0.0 (10']]) {
    assert.equal(nombreRe(n).test(s), true, `« ${n} » non trouvé dans « ${s} »`);
  }
});

test('R7c — la carte du banc dit ce que la 2.0.10 laisse vraiment : 3 rouges de temps sur 9, pas 0', () => {
  const t = plain(chapitre(page()));
  assert.doesNotMatch(t, /plus aucun rouge de temps/);
  assert.match(t, /ces 9 passages donnent encore 3 rouges de temps/);
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

// R10 — le texte n'affirme que ce que les cartes montrent (revue UX L93, constat 1 : « Cinq causes, chacune
// mesurée » alors que la carte C2 n'a aucun nombre). Le nombre de causes que le texte dit mesurées doit être
// celui des cartes de cause qui portent un nombre sourcé ; « chacune mesurée » ou « chacune avec sa mesure »
// exige que toutes en portent un.
const MOTS = { une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7 };
/** Les écarts entre ce que le texte affirme des mesures des causes et les cartes de cause (vide = conforme). */
export function ecartsCausesMesurees(html) {
  const cartes = [...html.matchAll(/<li (data-v1-cause="[^"]+"[^>]*)>/g)].map((m) => m[1]);
  const mesurees = cartes.filter((a) => /data-nombres="[^"]+"/.test(a)).length;
  const t = plain(html).toLowerCase();
  const ecarts = [];
  if (/chacune (?:mesurée|avec sa mesure)/.test(t) && mesurees < cartes.length) {
    ecarts.push(`« chacune mesurée » dit, mais ${cartes.length - mesurees} carte(s) de cause sans nombre`);
  }
  for (const m of t.matchAll(/\b(?:(une|deux|trois|quatre|cinq|six|sept) mesurées?|en mesure (une|deux|trois|quatre|cinq|six|sept))\b/g)) {
    const n = MOTS[m[1] ?? m[2]];
    if (n !== mesurees) ecarts.push(`« ${m[0]} » dit, mais ${mesurees} carte(s) de cause portent un nombre`);
  }
  return ecarts;
}

test('R10 — le chapitre ne dit pas plus de causes mesurées que de cartes chiffrées', () => {
  const html = chapitre(page());
  assert.deepEqual(ecartsCausesMesurees(html), []);
  // une cause sans nombre le dit sur sa carte
  for (const [, id, attrs, corps] of html.matchAll(/<li data-v1-cause="([^"]+)"([^>]*)>([\s\S]*?)<\/li>/g)) {
    if (!/data-nombres=/.test(attrs)) assert.match(plain(corps), /Décrite, pas mesurée\./, `${id} sans nombre ne le dit pas`);
  }
});

test('R10b — la règle de R10 rougit sur l’ancienne phrase « Cinq causes, chacune mesurée »', () => {
  const carte = (id, n) => `<li data-v1-cause="${id}"${n ? ` data-nombres="${n}"` : ''} class="x"><p>${id}</p></li>`;
  const cartes = [carte('C1', '101'), carte('C2', ''), carte('C3', '4'), carte('C4', '27'), carte('C5', '12')].join('');
  const ancien = `<h3>Cinq causes, chacune mesurée</h3><p>cinq causes, chacune avec sa mesure :</p><ul>${cartes}</ul>`;
  assert.equal(ecartsCausesMesurees(ancien).length, 1);
  assert.equal(ecartsCausesMesurees(`<h3>Cinq causes, cinq mesurées</h3><ul>${cartes}</ul>`).length, 1);
  assert.deepEqual(ecartsCausesMesurees(`<h3>Cinq causes, quatre mesurées</h3><p>Il en mesure quatre</p><ul>${cartes}</ul>`), []);
});

test('R11 — chaque décision de cadence 2 dit à quelle cause (C1 à C5) elle répond, ou qu’elle n’en vient pas', () => {
  const html = chapitre(page());
  const ids = new Set([...html.matchAll(/data-v1-cause="([^"]+)"/g)].map((m) => m[1]));
  const blocs = [...html.matchAll(/<li data-v2-decision="([^"]+)" data-causes="([^"]*)"[\s\S]*?(?=<li data-v2-decision=|$)/g)];
  assert.ok(blocs.length >= 4, `${blocs.length} décisions avec data-causes`);
  const couvertes = new Set();
  for (const [bloc, id, causes] of blocs) {
    const repond = bloc.match(/<p data-repond[^>]*>([\s\S]*?)<\/p>/);
    assert.ok(repond, `${id} : aucune ligne « Répond à »`);
    const dit = plain(repond[1]).trim();
    if (causes) {
      for (const c of causes.split(' ')) {
        assert.ok(ids.has(c), `${id} : cause ${c} inconnue`);
        assert.ok(new RegExp(`\\b${c}\\b`).test(dit), `${id} : ${c} non affichée (« ${dit} »)`);
        couvertes.add(c);
      }
    } else {
      assert.match(dit, /aucune des cinq/, `${id} : sans cause et sans le dire`);
    }
  }
  // la phrase d'intro ne prétend pas que chaque décision répond à une cause si l'une n'en a pas
  if (blocs.some(([, , c]) => !c)) assert.doesNotMatch(plain(html), /Chaque décision répond à une cause/);
  assert.deepEqual([...ids].filter((c) => !couvertes.has(c)), [], 'cause sans décision qui y répond');
});

test('R12 — chaque lien du chapitre qui ouvre un nouvel onglet le signale par ↗, comme les cartes « Sept pièces »', () => {
  const liens = [...chapitre(page()).matchAll(/<a [^>]*target="_blank"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.ok(liens.length >= 16, `${liens.length} liens en nouvel onglet`);
  assert.deepEqual(liens.map((m) => plain(m[1]).trim()).filter((t) => !t.startsWith('↗')), []);
});
