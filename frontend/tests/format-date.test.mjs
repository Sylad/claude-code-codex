// L15 — une seule mise en forme des dates en français pour les Nouveautés, le séparateur
// « Déjà vu lors de votre visite du … » et le Plan de travail : « 1er octobre 2026 »
// (jamais « 1 octobre 2026 »), heure « 20 h 42 », espaces insécables.
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDay, formatLongDate, formatTime, frenchDatesIn } from '../src/lib/format-date.mjs';

const nb = (s) => s.replaceAll(' ', ' ');

test('formatDay (YYYY-MM-DD) : « 1er » le premier du mois, chiffre simple ensuite', () => {
  assert.equal(nb(formatDay('2026-10-01')), '1er octobre 2026');
  assert.equal(nb(formatDay('2026-10-02')), '2 octobre 2026');
  assert.equal(nb(formatDay('2026-09-21')), '21 septembre 2026', '21 n’est pas « 21er »');
  assert.equal(nb(formatDay('2026-01-11')), '11 janvier 2026');
});

// L81 : une date entièrement insécable (« 22 novembre 2026 ») débordait de 27 à 92 px à 320 px texte
// 200 %, ou se coupait au milieu de l'année (« 202|6 ») sous `overflow-wrap: anywhere`. Une date passe
// désormais à la ligne entre ses mots, espaces ordinaires ; un nombre ne se coupe jamais (CSS de `time`,
// tests/l12-gabarit-ux.e2e.test.mjs).
test('formatDay : espaces ordinaires entre les mots, la date peut passer à la ligne entre eux', () => {
  for (const day of ['2026-10-01', '2026-11-22', '2026-09-21']) {
    const s = formatDay(day);
    assert.doesNotMatch(s, /[\u00a0\u202f]/, `insécable dans « ${s} »`);
    assert.equal(s.split(' ').length, 3, s);
  }
  assert.deepEqual(formatDay('2026-10-01').split(' '), ['1er', 'octobre', '2026']);
});

test('formatLongDate (instant) : dans le fuseau demandé', () => {
  assert.equal(nb(formatLongDate(new Date('2026-09-30T22:30:00Z'), 'Europe/Paris')), '1er octobre 2026');
  assert.equal(nb(formatLongDate(new Date('2026-09-30T22:30:00Z'), 'UTC')), '30 septembre 2026');
});

test('formatTime : « 20 h 42 », « 8 h 05 », insécables', () => {
  assert.equal(nb(formatTime(new Date('2026-10-01T18:42:00Z'), 'Europe/Paris')), '20 h 42');
  assert.equal(nb(formatTime(new Date('2026-10-01T06:05:00Z'), 'Europe/Paris')), '8 h 05');
  assert.equal(nb(formatTime(new Date('2026-10-01T22:00:00Z'), 'Europe/Paris')), '0 h 00');
  assert.doesNotMatch(formatTime(new Date('2026-10-01T18:42:00Z'), 'UTC'), / /);
});

test('L8 — frenchDatesIn : dates ISO d’un texte libre en forme longue, noms de fichier et options intacts', () => {
  assert.equal(nb(frenchDatesIn('Testé 2026-06-04 : REJECT. Revue radar 2026-09-18.')),
    'Testé 4 juin 2026 : REJECT. Revue radar 18 septembre 2026.');
  assert.equal(frenchDatesIn('docs/mesures/x-2026-10-10.md et git log --since=2026-09-09'),
    'docs/mesures/x-2026-10-10.md et git log --since=2026-09-09');
  assert.equal(nb(frenchDatesIn('(v4.24.0, 2026-10-01)')), '(v4.24.0, 1er octobre 2026)');
});
