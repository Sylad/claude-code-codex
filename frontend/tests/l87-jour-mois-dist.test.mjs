// L87 — sur le HTML CONSTRUIT de TOUTES les pages (`npx astro build` avant) : aucun jour (« 1er », 1 à
// 31) n'est séparé de son nom de mois par une espace ordinaire, ni dans le texte ni dans un attribut
// (dont les propriétés des îlots Vue). Seuls les scripts, styles et commentaires sont hors champ.
// Avant L87 : 249 paires sur 29 pages (77 sur /nouveautes, 11 sur /livre-de-bord, 6 sur /learning).
// La paire n'est cherchée qu'entre deux mots d'un même nœud de texte : une balise entre le jour et le
// mois (« <b>22</b> novembre ») est signalée à part, la transformation ne la couvrirait pas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { JOUR_MOIS } from '../src/lib/jour-mois.mjs';

function fichiers(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? fichiers(p) : e.name.endsWith('.html') ? [p] : [];
  });
}

const INTACT = /<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi;
const MOIS = 'janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre';
// Une balise et au moins une espace ORDINAIRE entre le jour et le mois (« <b>22</b> novembre ») ; la
// boîte de DateLongue.astro (« 22\u00a0<wbr>novembre ») n'en a pas.
const A_CHEVAL = new RegExp(`(?<![\\p{L}\\p{N}.,:/_-])(1er|0?[1-9]|[12]\\d|3[01])(?=(?:[ \\t\\r\\n\\u00a0]|<[^>]+>)*<)(?=(?:\\u00a0|<[^>]+>)*[ \\t\\r\\n])(?:[ \\t\\r\\n\\u00a0]|<[^>]+>)+(${MOIS})(?![\\p{L}\\p{N}])`, 'giu');

test('L87 — aucune paire jour + mois séparée par une espace ordinaire dans le HTML construit', () => {
  assert.ok(existsSync(join(DIST, 'index.html')), 'dist absent : lancer astro build');
  const pages = fichiers(DIST);
  assert.ok(pages.length >= 30, `${pages.length} page(s) seulement dans dist`);
  const defauts = [];
  for (const f of pages) {
    const html = readFileSync(f, 'utf8').replace(INTACT, '');
    for (const re of [JOUR_MOIS, A_CHEVAL]) {
      for (const m of html.matchAll(re)) {
        const avant = html.slice(Math.max(0, m.index - 30), m.index).replace(/\s+/g, ' ');
        defauts.push(`${relative(DIST, f)} : …${avant}« ${m[0].replace(/\s+/g, ' ')} »${re === A_CHEVAL ? ' (balise entre le jour et le mois)' : ''}`);
      }
    }
  }
  assert.deepEqual(defauts, []);
});

test('L87 — les pages où la QA a mesuré un jour seul portent bien l\'insécable', () => {
  const lire = (r) => readFileSync(join(DIST, r, 'index.html'), 'utf8');
  for (const [route, texte] of [
    ['nouveautes', '31 octobre 2026'], ['nouveautes', '3 novembre 2026'],
    ['livre-de-bord', '(29 octobre)'], ['livre-de-bord', '23 octobre'],
    ['learning', 'du 22 novembre 2026'],
  ]) assert.ok(lire(route).includes(texte), `/${route}/ ne contient pas « ${texte} »`);
});
