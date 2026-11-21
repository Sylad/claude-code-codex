// L176 finance-tracker — étude rafraîchie d'après les livraisons du 18 au 20 novembre 2026 (finance-tracker).
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

const brut = readFileSync(join(DIST, 'case-studies/finance-tracker/index.html'), 'utf8');
const t = brut.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');

test('R1 — l\'étude est datée du 21 novembre 2026, en tête et dans l\'eyebrow ; plus de mise à jour au 31 octobre', () => {
  assert.match(t, /Case study · mise à jour 21 novembre 2026/);
  assert.match(t, /Mise à jour 21 novembre 2026/);
  assert.doesNotMatch(t, /[Mm]ise à jour 31 octobre 2026/);
  assert.match(t, /97 Nouveautés/);
});

test('R2 — les chiffres du dépôt sont datés du même jour', () => {
  assert.match(t, /24 modules/);
  assert.match(t, /environ 1 780 cas de test au 21 novembre 2026/);
  assert.doesNotMatch(t, /1 620 cas de test/);
});

test('R3 — graphique d\'amortissement : Réel arrêté au dernier prélèvement, trous visibles, prélèvement décalé compté une fois', () => {
  assert.match(t, /dernier prélèvement connu/);
  assert.match(t, /aucun prélèvement trouvé ce mois-là/);
  assert.match(t, /Chaque prélèvement compte une fois/);
  assert.match(t, /n'est pas compté dans le capital/);
  assert.match(t, /buildAmortizationSeries/);
});

test('R4 — mois en entier dans le texte, en court sur l\'axe seulement ; montants en euros', () => {
  assert.match(t, /« juillet 2026 »/);
  assert.match(t, /« Juil 26 »/);
  assert.match(t, /monthLabel/);
  assert.match(t, /monthAxisLabel/);
  assert.match(t, /« 6 000 € » au lieu de « 6k »/);
});

test('R5 — page introuvable sans onglet allumé, onglet du navigateur nommé d\'après le relevé', () => {
  assert.match(t, /Page introuvable/);
  assert.match(t, /aucun onglet de la barre du bas ne s'allume/);
  assert.match(t, /Octobre 2026 — Historique — Finance Tracker/);
  assert.match(t, /Relevé introuvable/);
});
