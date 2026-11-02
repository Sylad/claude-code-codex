// L156 — étude finance-tracker rafraîchie d'après les livraisons du 26 au 30 octobre 2026 (finance-tracker).
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

const brut = readFileSync(join(DIST, 'case-studies/finance-tracker/index.html'), 'utf8');
const t = brut.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');

test('R1 — plus de tool_choice forcé : sonnet-5-5 le refuse, l\'étude décrit auto + strict + relance', () => {
  assert.doesNotMatch(t, /type: 'tool'/);
  assert.doesNotMatch(t, /tool_choice[^.]{0,20}strict/);
  assert.match(t, /type: 'auto'/);
  assert.match(t, /strict: true/);
  assert.match(t, /relancé une fois/);
});

test('R2 — la phase 2 analyse la santé financière, la catégorisation est un appel à part', () => {
  assert.doesNotMatch(t, /Phase 2 — tool_use CATEGORIZE_TOOL/);
  assert.doesNotMatch(t, /Phase 2 catégorise/);
  assert.match(t, /Phase 2 analyse/);
  assert.match(t, /categorize_transactions/);
  assert.doesNotMatch(t, /<code>auto-catégorisation/);
});

test('R2b — le score de santé est calculé côté backend, jamais attribué à la phase 2 de Claude', () => {
  assert.doesNotMatch(t, /analyze_finances\s*:\s*score/);
  assert.doesNotMatch(t, /Phase 2 analyse \(score/);
  assert.doesNotMatch(t, /analyse la santé financière/);
  assert.match(t, /score[^.]{0,60}calculé côté backend/);
});

test('R3 — les livraisons de fin octobre sont dites : écran d\'erreur, navigation, démo cohérente, règle proposée, À propos/Nouveautés', () => {
  assert.match(t, /écran d'erreur en français/);
  assert.match(t, /bouton Recharger/);
  assert.match(t, /barre du bas/);
  assert.match(t, /À propos et Nouveautés/);
  assert.match(t, /chiffres de la démo/);
  assert.match(t, /règle proposée suit la catégorie choisie/);
});

test('R4 — la phase 1 catégorise déjà ; categorize_transactions n\'est lancé qu\'à la demande', () => {
  assert.match(t, /Phase 1 extrait les transactions et leur attribue une catégorie/);
  assert.match(t, /categorize_transactions[^.]{0,80}à la demande/);
});

test('R5 — la consigne est citée telle que le code la produit', () => {
  assert.match(t, /Tu dois répondre en appelant l'outil [^»]{1,40}, et uniquement lui\./);
  assert.doesNotMatch(t, /réponds en appelant/);
});

test('R6 — la liste d\'établissements est nommée comme dans le dépôt', () => {
  assert.doesNotMatch(t, /KNOWN_LOAN_CREDITORS/);
  assert.match(t, /CREDIT_INSTITUTIONS/);
});
