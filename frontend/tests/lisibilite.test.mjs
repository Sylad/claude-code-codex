// L49 — audit de lisibilité : règles de mesure d'une page et d'ordre des « murs de texte ».
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditPage, classer, auditDist, rapportMarkdown, SEUILS } from '../src/lib/lisibilite.mjs';

const mots = (n) => Array.from({ length: n }, (_, i) => `mot${i}`).join(' ');
const page = (corps) => `<html><body><nav>${mots(500)}</nav><main>${corps}</main><footer>${mots(500)}</footer></body></html>`;

test('R1 — les mots se comptent dans <main> seulement, sans script, style ni SVG', () => {
  const a = auditPage(page(`<h1>Titre</h1><p>${mots(10)}</p><script>var a = ${mots(50)}</script><style>${mots(50)}</style><svg><text>${mots(50)}</text></svg>`));
  assert.equal(a.mots, 10, "le texte des titres ne compte pas dans les mots");
});

test("R1 — entités et balises imbriquées : l'espace insécable sépare, « & » seul n'est pas un mot", () => {
  const a = auditPage(page('<p>un&nbsp;deux <b>trois</b>quatre &amp; cinq</p>'));
  assert.equal(a.mots, 5);
});

test('R2 — un schéma est un SVG role="img" ou un diagramme Mermaid ; les icônes aria-hidden ne comptent pas', () => {
  const a = auditPage(page(
    `<svg role="img" aria-labelledby="x"></svg><svg aria-hidden="true" class="lucide"></svg><svg class="lucide"></svg>` +
    `<div data-mermaid="1"></div><div data-mermaid="2"></div>`));
  assert.equal(a.schemas, 3);
});

test('R3 — une image compte si son alt est non vide ; les fonds décoratifs alt="" ou sans alt, non', () => {
  const a = auditPage(page(`<img src="a.png" alt="Une capture"><img src="b.jpg" alt=""><img src="c.jpg"><img alt="  ">`));
  assert.equal(a.images, 1);
});

test('R4 — le plus long bloc sans intertitre se mesure entre deux titres h1–h6', () => {
  const a = auditPage(page(`<h1>A</h1><p>${mots(30)}</p><h2>B</h2><p>${mots(120)}</p><h3>C</h3><p>${mots(40)}</p>`));
  assert.equal(a.plusLongBloc, 120);
});

test('R4 — sans aucun intertitre, le bloc est toute la page ; avant le premier titre compte aussi', () => {
  assert.equal(auditPage(page(`<p>${mots(80)}</p>`)).plusLongBloc, 80);
  assert.equal(auditPage(page(`<p>${mots(90)}</p><h2>B</h2><p>${mots(5)}</p>`)).plusLongBloc, 90);
});

test('R4 — le texte d\'un titre ne compte pas dans le bloc ; un schéma ne coupe pas un bloc', () => {
  const a = auditPage(page(`<h2>un deux trois</h2><p>${mots(10)}</p><svg role="img"></svg><p>${mots(10)}</p>`));
  assert.equal(a.plusLongBloc, 20);
});

test('R5 — page sans <main> ou vide : zéros, pas d\'exception', () => {
  assert.deepEqual(auditPage('<html><body>rien</body></html>'), { mots: 0, schemas: 0, images: 0, plusLongBloc: 0 });
  assert.deepEqual(auditPage(page('')), { mots: 0, schemas: 0, images: 0, plusLongBloc: 0 });
});

test('R6 — mur de texte : un bloc trop long sans intertitre, OU une longue page presque sans visuel', () => {
  const ok = { mots: 900, schemas: 3, images: 0, plusLongBloc: SEUILS.blocMax - 1 };
  assert.equal(classer(ok).mur, false);
  assert.equal(classer({ ...ok, plusLongBloc: SEUILS.blocMax }).mur, true);
  assert.equal(classer({ ...ok, schemas: 0 }).mur, true, 'longue page sans visuel');
  assert.equal(classer({ mots: SEUILS.motsLongue - 1, schemas: 0, images: 0, plusLongBloc: 50 }).mur, false, 'page courte sans visuel : pas un mur');
});

test('R6 — les raisons sont nommées', () => {
  const c = classer({ mots: 2000, schemas: 0, images: 0, plusLongBloc: 900 });
  assert.deepEqual(c.raisons, ['bloc-long', 'sans-visuel']);
});

test('R7 — la liste à reprendre est ordonnée du pire au moins pire, sans les pages saines', () => {
  const dist = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), 'lisibilite-'));
  try {
    const ecrire = (chemin, corps) => { mkdirSync(join(dist, chemin), { recursive: true }); writeFileSync(join(dist, chemin, 'index.html'), page(corps)); };
    ecrire('petit-mur', `<p>${mots(400)}</p>`);
    ecrire('grand-mur', `<p>${mots(1500)}</p>`);
    ecrire('sain', `<h2>a</h2><p>${mots(100)}</p><svg role="img"></svg>`);
    writeFileSync(join(dist, 'index.html'), page(`<h2>x</h2><p>${mots(50)}</p>`));
    const pages = auditDist(dist);
    assert.deepEqual(pages.map((p) => p.route).sort(), ['/', '/grand-mur/', '/petit-mur/', '/sain/']);
    assert.deepEqual(pages.filter((p) => p.mur).map((p) => p.route), ['/grand-mur/', '/petit-mur/']);
  } finally { rmSync(dist, { recursive: true, force: true }); }
});

test('R7 — égalité de score : ordre alphabétique des routes, donc stable', () => {
  const dist = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), 'lisibilite-'));
  try {
    for (const r of ['b', 'a']) { mkdirSync(join(dist, r)); writeFileSync(join(dist, r, 'index.html'), page(`<p>${mots(500)}</p>`)); }
    assert.deepEqual(auditDist(dist).map((p) => p.route), ['/a/', '/b/']);
  } finally { rmSync(dist, { recursive: true, force: true }); }
});

test('R8 — le rapport Markdown liste les pages à reprendre avec leurs chiffres, et dit quand il n\'y en a aucune', () => {
  const md = rapportMarkdown([
    { route: '/mur/', mots: 1200, schemas: 0, images: 0, plusLongBloc: 1200, mur: true, raisons: ['bloc-long', 'sans-visuel'], score: 1 },
    { route: '/sain/', mots: 100, schemas: 1, images: 0, plusLongBloc: 100, mur: false, raisons: [], score: 0 },
  ]);
  assert.match(md, /\| 1 \| `\/mur\/` \| 1200 \| 0 \| 0 \| 1200 \|/);
  assert.match(md, /`\/sain\/`/);
  assert.match(rapportMarkdown([{ route: '/', mots: 10, schemas: 0, images: 0, plusLongBloc: 10, mur: false, raisons: [], score: 0 }]), /Aucune page/);
});

test('R9 — la commande refuse un dossier sans page construite, code de sortie 1', () => {
  const vide = mkdtempSync(join(process.env.TMPDIR ?? tmpdir(), 'lisibilite-'));
  try {
    const script = fileURLToPath(new URL('../scripts/audit-lisibilite.mjs', import.meta.url));
    const r = spawnSync(process.execPath, [script, vide], { encoding: 'utf8' });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /aucune page/i);
  } finally { rmSync(vide, { recursive: true, force: true }); }
});
