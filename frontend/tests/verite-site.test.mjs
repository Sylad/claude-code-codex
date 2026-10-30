// L52 — relecture de vérité : le rapport docs/verite-site.md couvre toutes les pages, classe chaque ligne.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = fileURLToPath(new URL('../', import.meta.url));
const rapport = readFileSync(join(racine, '../docs/verite-site.md'), 'utf8');
const CLASSES = ['faux', 'dépassé', 'non sourcé', 'ok'];

function pages(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return pages(p);
    return p.endsWith('.astro') ? [p] : [];
  });
}
const routes = pages(join(racine, 'src/pages')).map((p) => '/' + relative(join(racine, 'src/pages'), p).replace(/\.astro$/, '').replace(/(^|\/)index$/, '') );

const sections = new Map();
let courante = null;
for (const l of rapport.split('\n')) {
  const h = l.match(/^## `([^`]+)`/);
  if (h) { courante = h[1]; sections.set(courante, []); } else if (courante && l.startsWith('- ')) sections.get(courante).push(l);
}

test('R1 — chaque page du site a sa section « ## `/route` » dans le rapport', () => {
  assert.ok(routes.length > 20, 'les pages du site sont bien listées');
  for (const r of routes) assert.ok(sections.has(r || '/'), `section manquante pour ${r || '/'}`);
});

test('R2 — chaque ligne du rapport porte une classe parmi faux / dépassé / non sourcé / ok, et une source', () => {
  let n = 0;
  for (const [route, lignes] of sections) {
    for (const l of lignes) {
      n++;
      const m = l.match(/^- \*\*(faux|dépassé|non sourcé|ok)\*\* — (.+)/);
      assert.ok(m, `${route} : ligne sans classe valide : ${l.slice(0, 60)}`);
      assert.match(m[2], /\(source : [^)]+\)/, `${route} : ligne sans source : ${l.slice(0, 60)}`);
    }
  }
  assert.ok(n >= 10);
});

test("R3 — le rapport ne contient pas de section pour une page qui n'existe pas", () => {
  for (const r of sections.keys()) assert.ok(routes.includes(r === '/' ? '' : r) || r === '/', `page inconnue : ${r}`);
});

test('R4 — le rapport donne un décompte par classe cohérent avec ses lignes', () => {
  for (const c of CLASSES) {
    const reel = [...sections.values()].flat().filter((l) => l.startsWith(`- **${c}**`)).length;
    const m = rapport.match(new RegExp(`\\| ${c} \\| (\\d+) \\|`));
    assert.ok(m, `décompte manquant pour ${c}`);
    assert.equal(Number(m[1]), reel, `décompte de ${c}`);
  }
});
