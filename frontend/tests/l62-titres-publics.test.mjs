// L62 — la porte de la vague vérifie le titre des Nouveautés des lots visibles AVANT `raf done` : ce titre
// devient le titre public du lot à sa livraison, et la page Plan fait échouer le build s'il est non conforme
// (≤ 80 caractères, aucun nom de technique…). Trois builds rouges le 31-10 (L50, L58, L61).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { newsTitleProblems, parsePublicPlan } from '../src/lib/plan-public.ts';

const { parse } = createRequire(new URL('../package.json', import.meta.url))('yaml');
const RAF_TEXT = readFileSync(new URL('../../.cadence/raf.yaml', import.meta.url), 'utf8');
const NEWS = JSON.parse(readFileSync(new URL('../public/nouveautes-data/nouveautes.json', import.meta.url), 'utf8')).entries;

const LONG = 'Les schémas de l’étude sont lisibles sur téléphone : le texte garde sa taille et le schéma défile de côté';
const lot = (over) => ({ id: 'L1', title: 'brut', visible: true, status: 'doing', ...over });
const entry = (title, lots = ['L1']) => ({ title, lots });

test('L62 — R1 : un titre de Nouveauté de plus de 80 caractères, sur un lot visible en cours, est signalé', () => {
  const p = newsTitleProblems([lot({})], [entry(LONG)]);
  assert.equal(p.length, 1);
  assert.match(p[0], /L1/);
  assert.match(p[0], /> 80/);
});

test('L62 — R2 : un nom de technique dans le titre est signalé, lot en cours, prévu ou livré', () => {
  for (const status of ['doing', 'todo', 'done']) {
    const p = newsTitleProblems([lot({ status })], [entry('Le fichier JSON est relu')]);
    assert.equal(p.length, 1, status);
    assert.match(p[0], /technique/);
  }
});

test('L62 — R3 : un titre conforme ne produit aucun problème', () => {
  assert.deepEqual(newsTitleProblems([lot({})], [entry('Les schémas restent lisibles sur téléphone')]), []);
});

test('L62 — R4 : un lot non visible, abandonné, au `public:` explicite ou de processus n’est pas vérifié (le build n’utilise pas ce titre)', () => {
  const bad = [entry(LONG)];
  assert.deepEqual(newsTitleProblems([lot({ visible: false })], bad), []);
  assert.deepEqual(newsTitleProblems([lot({ status: 'dropped' })], bad), []);
  assert.deepEqual(newsTitleProblems([lot({ public: 'Titre public sobre' })], bad), []);
  assert.deepEqual(newsTitleProblems([lot({ title: 'Revue UX — accueil', status: 'done' })], bad), []);
});

test('L62 — R5 : seule la Nouveauté la plus récente du lot compte (celle que le build publie)', () => {
  const entries = [entry('Titre récent et sobre'), entry(LONG)];
  assert.deepEqual(newsTitleProblems([lot({})], entries), []);
  assert.equal(newsTitleProblems([lot({})], [entries[1], entries[0]]).length, 1);
});

test('L62 — R6 : un lot sans Nouveauté, ou une entrée sans lots, ne produit rien et ne plante pas', () => {
  assert.deepEqual(newsTitleProblems([lot({})], []), []);
  assert.deepEqual(newsTitleProblems([lot({})], [{ title: LONG }, { lots: ['L1'] }, null]), []);
  assert.deepEqual(newsTitleProblems([null, 'x', {}], [entry(LONG)]), []);
});

test('L62 — R7 : une Nouveauté qui cite deux lots visibles signale les deux', () => {
  const p = newsTitleProblems([lot({ id: 'L1' }), lot({ id: 'L2' })], [entry(LONG, ['L1', 'L2'])]);
  assert.equal(p.length, 2);
});

test('L62 — R8 : le plan et les Nouveautés versionnés du dépôt sont conformes, lots en cours compris', () => {
  const plan = parse(RAF_TEXT);
  assert.deepEqual(newsTitleProblems(plan.lots, NEWS), []);
  // même verdict que la page Plan, qui lève au build sur un lot livré non conforme
  assert.doesNotThrow(() => parsePublicPlan(RAF_TEXT, NEWS));
});
