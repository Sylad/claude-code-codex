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

// Revue r0 de L222 : chaque affirmation clé est gardée, pour qu'aucune ne disparaisse ni ne redevienne fausse en silence.
test('R6 — pile Frontend alignée sur frontend/package.json d\'ol-companion (TanStack, Recharts)', () => {
  assert.match(texte, /TanStack Router 1\.170 · TanStack Query 5\.107/);
  assert.match(texte, /Recharts 2\.15/);
  assert.doesNotMatch(texte, /Router 1\.78|Query 5\.59|Recharts 2\.13/);
});

test('R7 — carte L1 : 15 clubs écartés, l\'OL ne bouge jamais, motifs exacts (la victoire est un aplat)', () => {
  assert.match(texte, /Les 15 clubs trop proches/);
  assert.match(texte, /l'OL ne bouge jamais/);
  assert.match(texte, /victoire en aplat/);
  assert.match(texte, /pas encore joué/);
  assert.doesNotMatch(texte, /chacune avec son motif/);
});

test('R8 — signature SSE : les tirs en font partie', () => {
  assert.match(texte, /\[statusGroup, scores, gameTime, events\.length, shots\.length\]\.join\('\|'\)/);
});

test('R9 — .ics : football-data seul, 503 plutôt qu\'un calendrier vide', () => {
  assert.match(texte, /ne contient que la Ligue 1, et ne vient que de football-data\.org/);
  assert.match(texte, /répond 503, jamais un calendrier vide/);
});

test('R10 — écussons du CDN 365scores : classement, calendrier, dernier résultat et carte', () => {
  assert.match(texte, /pour le classement, le calendrier, le dernier résultat et les popups de la carte L1/);
  assert.match(texte, /dépassait la limite de débit/);
});

test('R11 — nombre de tests recompté, méthode écrite', () => {
  assert.match(texte, /≈ 1 950 cas de test au 22 novembre 2026 : 1 947 lignes/);
  assert.match(texte, /257 fichiers/);
  assert.doesNotMatch(texte, /1 970/);
});

test("R12 — rien n'est dit publiquement d'un accord écrit avec 365scores", () => {
  assert.doesNotMatch(texte, /accord écrit/);
});
