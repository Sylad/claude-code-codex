// L222 (plan d'ol-companion) — l'étude de cas suit les livraisons d'octobre et novembre 2026.
// Chaque assertion reprend un fait vérifié dans le dépôt ol-companion (CLAUDE.md, code, Nouveautés).
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

const brut = readFileSync(join(DIST, 'case-studies/ol-companion', 'index.html'), 'utf8');
const texte = brut.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');

test("R1 — plus d'en-têtes imités vers 365scores : l'app se nomme (L267)", () => {
  assert.doesNotMatch(texte, /c'est HTTP 403/);
  assert.doesNotMatch(texte, /SCORES365_HEADERS/);
  assert.match(texte, /User-Agent: ol-companion\/<version> \(\+https:\/\/ol\.sladoire\.dev\)/);
  assert.match(texte, /aucun contournement anti-robot/);
});

test('R2 — le tracker de classement est recalculé journée par journée (L241), plus de photo MIN = MAX', () => {
  assert.doesNotMatch(texte, /Round-complete check/);
  assert.doesNotMatch(texte, /MIN\(played\) === MAX\(played\)/);
  assert.match(texte, /recalcule le classement après chaque journée/);
});

test('R3 — carte L1 : décalage en pixels d\'écran, plus de « +20px »', () => {
  assert.doesNotMatch(texte, /\+20px/);
  assert.match(texte, /pixels d'écran, jamais de mètres/);
});

test('R4 — abonnement .ics, « Ce que ça change », mention football-data (L264, L265, L267)', () => {
  assert.match(texte, /\/api\/calendar\.ics/);
  assert.match(texte, /S'abonner/);
  assert.match(texte, /Ce que ça change/);
  assert.match(texte, /Football data provided by the Football-Data\.org API/);
  assert.doesNotMatch(texte, /football-data\.org \(calendrier officiel\)/);
});

test('R5 — pile à jour : Vite 8, Vitest 5, @nestjs/schedule 12, node:22-alpine', () => {
  assert.match(texte, /Vite 8 · Vitest 5/);
  assert.match(texte, /@nestjs\/schedule 12/);
  assert.match(texte, /node:22-alpine/);
  assert.doesNotMatch(texte, /node:20-alpine|Vite 5|Vitest 2|schedule v5/);
});
