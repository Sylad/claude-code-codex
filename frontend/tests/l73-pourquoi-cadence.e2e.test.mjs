// L73 (D-2) — page « Pourquoi cadence » (/case-studies/pourquoi-cadence/) sur le site CONSTRUIT :
// les cinq besoins qui ont fait naître cadence, sa définition en une phrase, des preuves chiffrées
// toutes datées et sourcées dans le dépôt cadence, les liens vers le dépôt et le paquet npm, rien de
// privé. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { PRIVATE_PATTERNS } from '../src/lib/livre-de-bord.ts';

const PAGE = join(DIST, 'case-studies', 'pourquoi-cadence', 'index.html');
const read = (...p) => readFileSync(join(DIST, ...p), 'utf8');
const main = (html) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const text = (html) => main(html).replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const page = () => read('case-studies', 'pourquoi-cadence', 'index.html');
const RACINE = fileURLToPath(new URL('../../', import.meta.url));
const NOUVEAUTE = join(RACINE, 'docs/nouveautes/2026-11-19-pourquoi-notre-methode-de-travail-existe-cinq-besoins-et-leurs.md');

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
    // L87 : le jour est lié à son mois par une insécable (src/lib/jour-mois.mjs).
    assert.match(t, /\b\d{1,2}(er)?[ \u00a0](janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) 20\d\d\b/, `${id} sans date`);
    assert.match(t, /Source :\s+docs\/[\w./-]+\.md/, `${id} sans source`);
  }
});

test('R5 — les chiffres attendus y sont, tels que le dépôt cadence les écrit', () => {
  const t = text(page());
  for (const n of ['×3,8', '8 sur 8', '52 min', '199 min', '304 contre 301', 'Cadence 1.62', '3 sur 3', '0 sur 3', '+7 %',
    '1 990 s', '2 470 s', '18 contre 12', '0 contre 2', '2 contre 1', '2 sur 2', '4 sur 4']) {
    assert.ok(t.includes(n), `chiffre « ${n} » absent`);
  }
  // revue L73, M1 : le cumul de la 2.0.0 (deux bras identiques sur les demandes isolées) n'est plus présenté
  for (const n of ['2 871 s', '2 878 s', '39 contre 24', 'première version']) assert.ok(!t.includes(n), `« ${n} » ne doit plus figurer`);
  assert.ok(t.includes('deux bras identiques'), 'les demandes isolées opposaient deux bras identiques : à dire');
  assert.match(t, /juge[^.]*à l'aveugle[^.]*préféré[^.]*Claude seul/, 'le juge aveugle préfère Claude seul sur la séquence : à dire');
});

// revue L73, m6 : chaque nombre d'une carte est cherché dans le fichier du dépôt cadence qu'elle cite,
// quand ce dépôt est à côté (CADENCE_REPO, sinon ../cadence ou ../../cadence depuis la racine du dépôt).
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CADENCE_REPO = [process.env.CADENCE_REPO, join(ROOT, '..', 'cadence'), join(ROOT, '..', '..', 'cadence')]
  .find((d) => d && existsSync(join(d, 'docs', 'v2')));

test('R12 — chaque nombre d’une carte figure dans le fichier source qu’elle cite', (t) => {
  if (!CADENCE_REPO) { t.skip('dépôt cadence absent à côté'); return; }
  const html = page();
  const cartes = [...html.matchAll(/data-(?:chiffre|limite)="([^"]+)"[^>]*data-nombres="([^"]+)"[^>]*data-source="([^"]+)"/g)];
  assert.ok(cartes.length >= 8, `${cartes.length} cartes avec nombres et source`);
  for (const [, id, nombres, source] of cartes) {
    const f = join(CADENCE_REPO, source);
    assert.ok(existsSync(f), `${id} : ${source} introuvable dans le dépôt cadence`);
    const src = readFileSync(f, 'utf8').replace(/(\d)[\s\u202f\u00a0](?=\d{3}\b)/g, '$1');
    for (const n of nombres.split(' ')) {
      const re = new RegExp(`(^|[^\\d,.])${n.replace(/[.,]/g, '[.,]')}(?![\\d])`);
      assert.match(src, re, `${id} : ${n} absent de ${source}`);
    }
  }
});

test('R6 — la page dit aussi ce que les mesures ne prouvent pas (honnêteté)', () => {
  const html = page();
  assert.match(html, /data-limites/);
  const t = text(html);
  assert.ok(t.includes('×1,76'), 'le banc perdu sans référence à lire (×1,76) est dit');
  assert.ok(t.includes('80 contre 88'), 'le critère perdu le 18 novembre est dit');
  assert.match(t, /garde[^.]*rouge/, 'la 2.0.0 publiée malgré la garde rouge du banc est dite');
  assert.ok(t.includes('préférence d'), 'la cohérence n’est jugée que par la préférence d’un relecteur');
});

test('R13 — aucune citation de Sylvain introuvable dans le dépôt cadence ; besoins sourcés', () => {
  const t = text(page());
  assert.ok(!t.includes("je n'ai pas fait cadence pour rien"));
  assert.match(main(page()), /href="https:\/\/github\.com\/Sylad\/cadence\/blob\/main\/docs\/v2\/2026-11-08-banc-sequence-design\.md"/);
});

test('R7 — liens vers le dépôt et le paquet npm @sylad/cadence', () => {
  const m = main(page());
  assert.match(m, /href="https:\/\/github\.com\/Sylad\/cadence"/);
  assert.match(m, /href="https:\/\/www\.npmjs\.com\/package\/@sylad\/cadence"/);
  assert.ok(text(page()).includes('npm install -g @sylad/cadence'));
});

test('R8 — rien de privé : machines, chemins, compte pro, e-mail, origine de la demande, données de finance', () => {
  const t = text(page());
  const hits = PRIVATE_PATTERNS.filter((re) => re.test(t)).map(String);
  assert.deepEqual(hits, []);
  for (const mot of [/relevés? bancaires?/i, /\bsalaire\b/i, /\bmobi-blue\b/i]) assert.doesNotMatch(t, mot);
  // Le contexte de la demande (champ `origine` du registre) reste hors de la page : lu au moment du
  // test, jamais recopié ici (dépôt public). Ni l'un de ses morceaux, ni l'un de ses mots longs.
  const origine = JSON.parse(readFileSync(join(RACINE, '.cadence/demandes/D-2.json'), 'utf8')).origine || '';
  assert.ok(origine.length > 0, 'champ origine de D-2 lu');
  const bas = t.toLowerCase();
  const morceaux = origine.split(/[;:,]/).map((m) => m.trim().toLowerCase()).filter((m) => m.length >= 12);
  const mots = [...new Set(origine.toLowerCase().match(/[\p{L}-]{10,}/gu) || [])];
  const repris = [...morceaux, ...mots].filter((m) => bas.includes(m));
  assert.equal(repris.length, 0, `${repris.length} morceau(x) du champ origine de D-2 repris sur la page`);
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

// Retour du lead (19-11) : au téléphone, « 4 954 s » se coupait en fin de ligne. Un nombre ne se
// sépare ni de son unité (s, min, %, px) ni de ses milliers : espace insécable dans la source rendue.
const NBSP = '\u00a0';
const NOMBRE_UNITE = /(?<![\d,.])\d+(?:\s\d{3})*\s(?:s|min|px|%)(?!\p{L})/gu;

test('R14 — aucun nombre séparé de son unité ou de ses milliers par une espace sécable', () => {
  const brut = main(page()).replace(/<[^>]+>/g, ' ');
  const coupables = [...brut.matchAll(/\d[ \t\n](?:\d{3}(?!\d)|(?:s|min|px)(?!\p{L})|%)/gu)].map((m) => m[0]);
  assert.deepEqual(coupables, [], 'espace ordinaire entre un nombre et son unité ou ses milliers');
  // la garde voit bien les nombres de la page : ils y sont, tenus par des insécables
  const tenus = [...brut.matchAll(NOMBRE_UNITE)].map((m) => m[0]);
  for (const n of ['4 954 s', '6 957 s', '1 990 s', '2 470 s', '199 min', '52 min', '7 %', '1440 px', '390 px'].map((x) => x.replaceAll(' ', NBSP))) {
    assert.ok(tenus.includes(n), `« ${n} » absent ou mal tenu`);
  }
});

test('R15 — à 390 px, chaque nombre et son unité tiennent sur une seule ligne', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 390, height: 900 } });
  const p = await context.newPage();
  await p.goto(`${env.base}/case-studies/pourquoi-cadence/`, { waitUntil: 'load' });
  const { vus, coupes } = await p.evaluate((src) => {
    const re = new RegExp(src, 'gu');
    const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
    let vus = 0;
    const coupes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      for (const m of n.data.matchAll(re)) {
        const r = document.createRange();
        r.setStart(n, m.index);
        r.setEnd(n, m.index + m[0].length);
        const tops = [...r.getClientRects()].filter((b) => b.width > 0).map((b) => Math.round(b.top));
        if (!tops.length) continue;
        vus += 1;
        if (Math.max(...tops) - Math.min(...tops) > 1) coupes.push(m[0]);
      }
    }
    return { vus, coupes };
  }, NOMBRE_UNITE.source);
  assert.ok(vus >= 10, `${vus} nombres avec unité mesurés`);
  assert.deepEqual(coupes, [], 'nombre coupé de son unité en fin de ligne');
  await context.close();
});

test('R16 — la Nouveauté du 19-11 dit ce que dit la page : séquence 2.0.0 chiffrée, limites, aucun cumul', () => {
  const corps = readFileSync(NOUVEAUTE, 'utf8').split(/^---$/m).slice(2).join('---').replace(/[\s\u00a0\u202f]+/g, ' ');
  const t = text(page()).replace(/[\u00a0\u202f]|&nbsp;|&#160;/g, ' ');
  // la séquence AetherWX, avec ses chiffres favorables ET défavorables, présents aussi sur la page
  for (const f of ['1 990 s contre 2 470 s', '18 contre 12', '0 contre 2', '2 contre 1']) {
    assert.ok(corps.includes(f), `Nouveauté : « ${f} » absent`);
    assert.ok(t.includes(f), `page : « ${f} » absent`);
  }
  assert.match(corps, /juge à l'aveugle[^.]*Claude seul/, 'le juge à l’aveugle pour Claude seul est dit');
  assert.match(corps, /demande différée/);
  // le cumul retiré de la page (M1 de la r1) ne revient pas par la Nouveauté
  for (const re of [/même temps/, /×\s?1,00/, /2 ?871/, /39 contre 24/, /glissée/]) assert.doesNotMatch(corps, re);
  // les cinq limites de la page sont dites
  for (const re of [/garde rouge/, /sans document à lire/, /coûte la lecture/, /deux fois sur trois/, /relecteur/]) assert.match(corps, re);
});

// Revue UX r3 (19-11), constat 2 (Nielsen 4 et 6) : la rubrique « Case studies » contient la page.
// Une carte « Pourquoi cadence » dans les récits transverses, juste après la carte cadence ; le
// nombre d'apps de l'index ne bouge pas (R10 de cadence-case-study).
test('R17 — l’index /case-studies/ a une carte « Pourquoi cadence » qui lie la page, à côté de la carte cadence', () => {
  const html = main(read('case-studies', 'index.html'));
  const cartes = [...html.matchAll(/<article[\s\S]*?<\/article>/g)].map((m) => m[0]);
  const i = cartes.findIndex((c) => /href="\/case-studies\/pourquoi-cadence\/?"/.test(c));
  assert.ok(i >= 0, 'aucune carte de l’index ne lie /case-studies/pourquoi-cadence/');
  const carte = cartes[i];
  assert.match(carte.replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'"), /Pourquoi cadence/);
  assert.match(carte, /<h3[\s\S]*?href="\/case-studies\/pourquoi-cadence\/?"[\s\S]*?<\/h3>/, 'le titre de la carte est le lien');
  const cadence = cartes.findIndex((c) => /<h3[\s\S]*?href="\/case-studies\/cadence"/.test(c));
  assert.ok(cadence >= 0, 'carte cadence absente');
  assert.equal(Math.abs(i - cadence), 1, 'la carte n’est pas à côté de la carte cadence');
  assert.match(text(read('case-studies', 'index.html')), /8 apps construites avec Claude Code/);
});

// Revue UX r3, constat 3 : à 320 px « Revue code et écran » touchait presque le bord droit de sa
// boîte. Chaque libellé du schéma garde à droite au moins la marge qu'il a à gauche (10 unités du
// viewBox), à toutes les largeurs.
test('R18 — schéma : chaque libellé a à droite la même marge intérieure qu’à gauche (320, 390, 1440 px)', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [320, 390, 1440]) {
    const context = await env.browser.newContext({ viewport: { width, height: 900 } });
    const p = await context.newPage();
    await p.goto(`${env.base}/case-studies/pourquoi-cadence/`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const serres = await p.evaluate(() => [...document.querySelectorAll('[data-schema="besoins-mecanismes"] g')].flatMap((g) => {
      const rects = [...g.querySelectorAll('rect')].map((r) => r.getBBox());
      return [...g.querySelectorAll('text')].flatMap((t) => {
        const b = t.getBBox();
        const r = rects.find((r) => b.x >= r.x && b.x < r.x + r.width);
        const gauche = b.x - r.x;
        const droite = r.x + r.width - (b.x + b.width);
        return droite + 0.5 < gauche ? [`${t.textContent} (gauche ${gauche.toFixed(1)}, droite ${droite.toFixed(1)})`] : [];
      });
    }));
    assert.deepEqual(serres, [], `@${width}px : libellé trop près du bord droit`);
    await context.close();
  }
});
