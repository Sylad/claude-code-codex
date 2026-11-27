// L33 — étude de cas cadence, d'après la fiche du lot : schémas SVG inline lisibles à 390 px du lead et de
// ses créneaux et de la mémoire partagée en fichiers versionnés (la chaîne lot → run → porte → revue →
// livraison vérifiée → QA est le schéma parcours-v2, testé par l103) ; capture datée de la bande cadence-hud ;
// liens vers le dépôt et npm ; attendus QA de la route inexistante (404 livré par L28).
// Lit le site CONSTRUIT : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const html = () => readFileSync(join(DIST, 'case-studies', 'cadence', 'index.html'), 'utf8');
// Retire les balises en un seul passage (sans expression régulière qui revient en arrière).
const sansBalises = (s) => {
  let out = '';
  let i = 0;
  for (let lt = s.indexOf('<'); lt >= 0; lt = s.indexOf('<', i)) {
    const gt = s.indexOf('>', lt);
    if (gt < 0) break;
    out += `${s.slice(i, lt)} `;
    i = gt + 1;
  }
  return out + s.slice(i);
};
const plain = (s) => sansBalises(s).replaceAll('&#39;', "'").replace(/\s+/g, ' ');
const figure = (attr, id) => {
  const m = html().match(new RegExp(`<figure[^>]*${attr}="${id}"[^>]*>([\\s\\S]*?)</figure>`));
  assert.ok(m, `figure « ${id} » absente`);
  return m[1];
};
const svgDe = (id) => figure('data-schema', id).match(/<svg[\s\S]*?<\/svg>/)[0];
const ordre = (t, mots, quoi) => {
  let from = 0;
  for (const w of mots) {
    const at = t.indexOf(w, from);
    assert.ok(at >= 0, `${quoi} : « ${w} » absent ou hors ordre`);
    from = at + w.length;
  }
};

test('L33 R1 — le lead et ses créneaux : lead, créneau occupé par un cadence run, créneau libre, retour au lead', () => {
  const svg = plain(svgDe('lead-creneaux'));
  ordre(svg, ['Le lead', 'Choisit le lot suivant', 'Créneau occupé', 'cadence run', 'Créneau libre', 'Une ligne ou une question'], 'dessin');
  assert.match(svgDe('lead-creneaux'), /class="sch-line-accent"/, 'le retour du créneau libéré (pointillés) n’est pas dessiné');
  assert.match(figure('data-schema', 'lead-creneaux'), /<figcaption[^>]*>[^<]*[Pp]ointillés/, 'la légende n’explique pas les pointillés');
});

test('L33 R2 — la mémoire partagée : plan, historique git, journaux de run ; jamais la conversation', () => {
  const svg = plain(svgDe('memoire-fichiers'));
  ordre(svg, ['Le plan', 'raf.yaml', "L'historique", 'git', 'Les journaux', '.cadence/runs', 'session neuve', "rien ne vient d'une conversation"], 'dessin');
  assert.match(svgDe('memoire-fichiers'), /class="sch-line-accent"/, 'le retour vers les fichiers (pointillés) n’est pas dessiné');
});

test('L33 R3 — chaque nouveau schéma est accessible et a sa version en liste', () => {
  for (const id of ['lead-creneaux', 'memoire-fichiers']) {
    const f = figure('data-schema', id);
    assert.match(f, /<svg[^>]*role="img"[^>]*aria-labelledby="[^"]+"/, `${id} : role/aria-labelledby`);
    assert.match(f, /<title[^>]*>[^<]{10,}<\/title>/, `${id} : titre`);
    assert.match(f, /<desc[^>]*>[^<]{60,}<\/desc>/, `${id} : description`);
    assert.match(f, new RegExp(`data-sch-liste="${id}"`), `${id} : version en liste absente`);
    assert.doesNotMatch(f, /(?:fill|stroke)="(?!none|currentColor|url)/, `${id} : couleur en dur`);
  }
});

test('L33 R4 — la bande cadence-hud : image réelle, datée, avec alt et dimensions', () => {
  const f = figure('data-capture', 'bande-hud');
  const img = f.match(/<img[^>]*>/)[0];
  assert.match(img, /alt="[^"]{60,}"/, 'alt trop court');
  assert.match(img, /width="768"/); assert.match(img, /height="146"/);
  const src = img.match(/src="([^"]+)"/)[1];
  assert.ok(existsSync(join(DIST, src.replace(/^\//, ''))), `fichier ${src} absent de dist`);
  const legende = plain(f.match(/<figcaption[\s\S]*?<\/figcaption>/)[0]);
  assert.match(legende, /8 octobre 2026/, 'capture non datée');
  assert.match(legende, /V1/, 'la légende ne dit pas que la capture est de la V1');
});

test('L33 R5 — liens vers le dépôt et le paquet npm', () => {
  const h = html();
  assert.match(h, /href="https:\/\/github\.com\/Sylad\/cadence"/);
  assert.match(h, /href="https:\/\/www\.npmjs\.com\/package\/@sylad\/cadence"/);
});

test('L33 R6 — attendus QA : la route inexistante sert le 404 livré par L28', () => {
  const md = readFileSync(join(import.meta.dirname, '..', '..', 'docs', 'qa', 'expectations.md'), 'utf8');
  const bloc = md.split(/^## /m).find((b) => b.startsWith('/<route inexistante>'));
  assert.ok(bloc, 'section de la route inexistante absente');
  assert.match(bloc, /statut 404/);
  assert.match(bloc, /L28/);
  assert.match(bloc, /Cette page n'existe pas/);
  assert.match(bloc, /Retour à l'accueil/);
  assert.doesNotMatch(bloc, /200 \+ page d'accueil/, 'l’ancien constat du 05-10 est encore présenté comme l’attendu');
});

test('L33 R7 — 390 et 1440 px : textes des nouveaux schémas ≥ 11 px à 390, dans leur boîte, sans défilement latéral', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const largeur of [390, 1440]) {
    const context = await env.browser.newContext({ viewport: { width: largeur, height: 900 } });
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const page = await context.newPage();
    await page.goto(`${env.base}/case-studies/cadence/`);
    const r = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      schemas: ['lead-creneaux', 'memoire-fichiers'].map((id) => {
        const svg = document.querySelector(`figure[data-schema="${id}"] > svg`);
        const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        const rects = [...svg.querySelectorAll('rect')].map((e) => e.getBBox());
        const textes = [...svg.querySelectorAll('text')];
        const hors = textes.filter((e) => {
          const b = e.getBBox();
          const boite = rects.find((rc) => b.x >= rc.x && b.x <= rc.x + rc.width && b.y >= rc.y && b.y <= rc.y + rc.height);
          return !boite || b.x + b.width > boite.x + boite.width - 4;
        }).map((e) => e.textContent);
        return { id, min: Math.min(...textes.map((e) => parseFloat(getComputedStyle(e).fontSize) * k)), hors };
      }),
    }));
    await context.close();
    assert.ok(r.scroll <= 0, `${largeur} px : la page défile de ${r.scroll} px`);
    for (const s of r.schemas) {
      assert.deepEqual(s.hors, [], `${largeur} px, ${s.id} : texte(s) hors de leur boîte`);
      if (largeur === 390) assert.ok(s.min >= 11, `390 px, ${s.id} : plus petit texte rendu à ${s.min.toFixed(2)} px`);
    }
  }
});
