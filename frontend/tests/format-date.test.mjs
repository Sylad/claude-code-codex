// L15 — une seule mise en forme des dates en français pour les Nouveautés, le séparateur
// « Déjà vu lors de ta visite du … » et le Plan de travail : « 1er octobre 2026 »
// (jamais « 1 octobre 2026 »), heure « 20 h 42 », espaces insécables.
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDay, formatDayParts, formatLongDate, formatTime, frenchDatesIn } from '../src/lib/format-date.mjs';

const nb = (s) => s.replaceAll(' ', ' ');

test('formatDay (YYYY-MM-DD) : « 1er » le premier du mois, chiffre simple ensuite', () => {
  assert.equal(nb(formatDay('2026-10-01')), '1er octobre 2026');
  assert.equal(nb(formatDay('2026-10-02')), '2 octobre 2026');
  assert.equal(nb(formatDay('2026-09-21')), '21 septembre 2026', '21 n’est pas « 21er »');
  assert.equal(nb(formatDay('2026-01-11')), '11 janvier 2026');
});

// L81 : une date entièrement insécable (« 22 novembre 2026 ») débordait de 27 à 92 px à 320 px texte
// 200 %, ou se coupait au milieu de l'année (« 202|6 ») sous `overflow-wrap: anywhere`. Une date passe
// désormais à la ligne entre ses mots ; un nombre ne se coupe jamais (CSS de `time`).
// L83 : sauf entre le jour et le mois, qu'une insécable garde ensemble (« prochaine avant le 22 |
// décembre 2026 » à 375-390 px laissait le jour seul en fin de ligne) ; espace ordinaire avant l'année.
test('formatDay : insécable entre le jour et le mois, espace ordinaire avant l’année', () => {
  for (const [day, jour, mois] of [['2026-10-01', '1er', 'octobre'], ['2026-12-22', '22', 'décembre'], ['2026-09-21', '21', 'septembre']]) {
    const s = formatDay(day);
    assert.equal(s, `${jour}\u00a0${mois} 2026`, JSON.stringify(s));
  }
  assert.equal(formatLongDate(new Date('2026-09-30T22:30:00Z'), 'Europe/Paris'), '1er\u00a0octobre 2026');
});

// L83 : pour un <time> (DateLongue.astro), « jour mois » à part, espace ordinaire : c'est la boîte en
// ligne qui les garde ensemble, et ils peuvent encore se séparer quand ils ne tiennent pas sur une ligne
// entière (« 23 NOVEMBRE » à chasse fixe, carte de /nouveautes à 320 px texte 200 %).
// L87 : « jour mois » liés par l'insécable, comme dans tout le texte rendu ; jour et mois aussi à part.
test('formatDayParts : « jour mois » (insécable), jour, mois et l’année, même texte que formatDay', () => {
  assert.deepEqual(formatDayParts('2026-12-22'), { jourMois: '22\u00a0décembre', jour: '22', mois: 'décembre', annee: '2026' });
  assert.deepEqual(formatDayParts('2026-10-01'), { jourMois: '1er\u00a0octobre', jour: '1er', mois: 'octobre', annee: '2026' });
  for (const day of ['2026-01-11', '2026-11-23']) {
    const { jourMois, annee } = formatDayParts(day);
    assert.equal(`${jourMois} ${annee}`, formatDay(day));
  }
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
