// L38 — module pur des études de cas à jour : date de mise à jour, légende de capture, chiffre daté / non relevé.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DATE_MAJ, dateMajLabel, legendeCapture, chiffreDate, messageCapture } from '../src/lib/etude-fraicheur.mjs';

const nb = (s) => s.replace(/[  ]/g, ' ');

test('R1 — la date de mise à jour s\'écrit au format du site', () => {
  assert.equal(DATE_MAJ, '2026-11-03');
  assert.equal(nb(dateMajLabel()), '3 novembre 2026');
});

test('R3 — un chiffre relevé porte sa date et sa source dans la même phrase', () => {
  const s = nb(chiffreDate({ valeur: 68, unite: 'layers de données', libelleAbsent: 'Nombre de layers de données', date: '2026-11-03', source: 'qa/layers.manifest.json', pourquoi: 'x' }));
  assert.equal(s, '68 layers de données au 3 novembre 2026 (qa/layers.manifest.json)');
});

test('R3 — zéro est un chiffre relevé, pas un chiffre absent', () => {
  const s = nb(chiffreDate({ valeur: 0, unite: 'pods', libelleAbsent: 'Nombre de pods', date: '2026-11-03', source: 's', pourquoi: 'x' }));
  assert.match(s, /^0 pods au 3 novembre 2026 \(s\)$/);
});

test('R5 — chiffre sans relevé : message affiché, ni « undefined » ni « NaN »', () => {
  const base = { unite: 'layers de données', libelleAbsent: 'Nombre de layers de données', date: '2026-11-03', source: 'qa/layers.manifest.json',
    pourquoi: 'le manifeste du harnais QA (qa/layers.manifest.json) n’était pas accessible' };
  for (const valeur of [undefined, null, NaN, Infinity, -1, 1.5, '68', '']) {
    const s = nb(chiffreDate({ ...base, valeur }));
    assert.equal(s, 'Nombre de layers de données non relevé au 3 novembre 2026 : le manifeste du harnais QA (qa/layers.manifest.json) n’était pas accessible. Il sera ajouté à la prochaine mise à jour.', String(valeur));
    assert.doesNotMatch(s, /undefined|NaN|null/);
  }
});

test('R5 — un chiffre absent sans raison ou une date invalide font échouer le build au lieu de deviner', () => {
  assert.throws(() => chiffreDate({ valeur: undefined, unite: 'u', libelleAbsent: 'N', date: '2026-11-03', source: 's' }), /pourquoi/);
  assert.throws(() => chiffreDate({ valeur: undefined, unite: 'u', libelleAbsent: 'N', date: '2026-11-03', source: 's', pourquoi: '  ' }), /pourquoi/);
  assert.throws(() => chiffreDate({ valeur: 3, unite: 'u', libelleAbsent: 'N', date: 'pas-une-date', source: 's', pourquoi: 'x' }), /date/);
  assert.throws(() => chiffreDate({ valeur: 3, unite: 'u', libelleAbsent: 'N', date: '2026-02-30', source: 's', pourquoi: 'x' }), /date/);
});

test('R4 — la légende compose la date avec la description, qui n\'est jamais remplacée', () => {
  const d = 'Navires AIS live (2500+ positions) + trajets daily agrégés.';
  assert.equal(nb(legendeCapture({ date: '2026-05-11', carte2d: true, description: d })),
    `Capture du 11 mai 2026 (carte 2D, avant le globe) — ${d}`);
  // capture refaite : nouvelle date, plus de mention
  assert.equal(nb(legendeCapture({ date: '2026-11-03', carte2d: false, description: d })), `Capture du 3 novembre 2026 — ${d}`);
});

test('R4 — une légende sans description ou sans date valide est refusée', () => {
  assert.throws(() => legendeCapture({ date: '2026-05-11', carte2d: true, description: '' }), /description/);
  assert.throws(() => legendeCapture({ date: '11/05/2026', carte2d: true, description: 'x' }), /date/);
});

test('R6 — R7 — les messages d\'une capture la nomment', () => {
  const m = messageCapture('Navires AIS live');
  assert.equal(m.chargement, 'Capture « Navires AIS live » en cours de chargement. Elle apparaît dans un instant.');
  assert.equal(m.erreur, 'Capture « Navires AIS live » indisponible : le fichier n\'a pas pu être chargé. Recharge la page pour la réafficher ; sa description reste lisible dans la légende ci-dessous.');
  assert.throws(() => messageCapture(''), /nom/);
});
