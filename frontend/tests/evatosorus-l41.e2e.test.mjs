// L41 (plan d'evatosorus) — l'étude de cas suit les livraisons du 17 au 22 novembre 2026.
// Chaque assertion reprend un fait vérifié dans le dépôt evatosorus (CLAUDE.md, code, Nouveautés, build).
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

const brut = readFileSync(join(DIST, 'case-studies/evatosorus', 'index.html'), 'utf8');
const texte = brut.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');

test('R1 — date de mise à jour et relevé de pages du 22 novembre 2026 (build : 1 536 pages, 1 513 fiches)', () => {
  assert.match(texte, /Mis à jour le 22 novembre 2026/);
  assert.match(texte, /1536 pages HTML au 22 novembre 2026/);
  assert.match(texte, /1 513 fiches d'espèces au 22 novembre 2026/);
  assert.doesNotMatch(texte, /1533 pages/);
});

test('R2 — seed de 26 espèces (species.seed.ts), dont deux décrites en 2026', () => {
  assert.match(texte, /seed manuel de 26 espèces/);
  assert.match(texte, /species\.seed\.ts — 26 espèces/);
  assert.doesNotMatch(texte, /24 espèces curées|seed manuel de 24/);
});

test('R3 — carte : sites des espèces du seed comptés en espèces distinctes, plus « occurrences PaleoBioDB »', () => {
  assert.doesNotMatch(texte, /place les occurrences PaleoBioDB/);
  assert.match(texte, /26 espèces au 22 novembre 2026 \(3 du Trias, 6 du Jurassique, 17 du Crétacé\)/);
  assert.match(texte, /espèces distinctes/);
  assert.match(texte, /bouton Réessayer/);
  assert.match(texte, /liste des sites par pays/);
});

test('R4 — veille trimestrielle (L29) : page Découvertes, fiches revues et sourcées, prochaine passe', () => {
  assert.match(texte, /Veille du contenu/);
  assert.match(texte, /tous les trois mois/);
  assert.match(texte, /prochaine en février 2027/);
  assert.match(texte, /Spinosaurus mirabilis \(Niger\) et Nagatitan \(Thaïlande\)/);
  assert.match(texte, /Tyrannosaure, Spinosaure, les deux Nanotyrannus, Aberratiodontus/);
  assert.match(texte, /Aucune image n'entre par la veille sans validation humaine/);
});

test('R5 — pile alignée sur frontend/package.json d\'evatosorus : Astro 7.4, Vite 8', () => {
  assert.match(texte, /Astro 7\.4 \(Vite 8\)/);
  assert.doesNotMatch(texte, /Astro 6 statique|Vite 7/);
});

test('R6 — passe de lisibilité (L26, L32, L11, L52)', () => {
  assert.match(texte, /description lue par les lecteurs d'écran/);
  assert.match(texte, /couleur de leur période/);
  assert.match(texte, /ne descendent plus sous 12 px/);
});

test('R7 — captures reprises des Nouveautés d\'evatosorus, présentes et décrites', () => {
  for (const img of ['01-fiche-revue-tyrannosaure.png', '02-carte-especes.png']) {
    const src = `/case-studies/evatosorus/${img}`;
    assert.ok(brut.includes(`src="${src}"`), img);
    assert.ok(existsSync(join(DIST, src.slice(1))), `${img} absente de dist`);
    const alt = brut.match(new RegExp(`src="${src}" alt="([^"]+)"`));
    assert.ok(alt && alt[1].length >= 30, `${img} : alt manquant ou trop court`);
  }
});
