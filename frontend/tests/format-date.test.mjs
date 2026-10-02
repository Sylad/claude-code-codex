// L15 — une seule mise en forme des dates en français pour les Nouveautés, le séparateur
// « Déjà vu lors de votre visite du … » et le Plan de travail : « 1er octobre 2026 »
// (jamais « 1 octobre 2026 »), heure « 20 h 42 », espaces insécables.
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDay, formatLongDate, formatTime } from '../src/lib/format-date.mjs';

const nb = (s) => s.replaceAll(' ', ' ');

test('formatDay (YYYY-MM-DD) : « 1er » le premier du mois, chiffre simple ensuite', () => {
  assert.equal(nb(formatDay('2026-10-01')), '1er octobre 2026');
  assert.equal(nb(formatDay('2026-10-02')), '2 octobre 2026');
  assert.equal(nb(formatDay('2026-09-21')), '21 septembre 2026', '21 n’est pas « 21er »');
  assert.equal(nb(formatDay('2026-01-11')), '11 janvier 2026');
});

test('formatDay : espaces insécables, la date ne se coupe jamais en son milieu', () => {
  assert.doesNotMatch(formatDay('2026-10-01'), / /);
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
