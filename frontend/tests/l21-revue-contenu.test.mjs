// L21 — veille et revue régulière du contenu : chaque page de contenu porte la date de sa
// dernière revue et son rythme ; une revue en retard se voit ; chaque actualité de la veille
// est datée et sourcée. Module pur : `src/lib/revue-contenu.mjs` et `src/data/veille-ecosysteme.mjs`.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAGES_REVUES, RYTHME_JOURS, etatRevue, jourParis, prochaineRevue, verifierRevues,
} from '../src/lib/revue-contenu.mjs';
import { actualites, verifierActualites } from '../src/data/veille-ecosysteme.mjs';

const ATTENDUES = ['ecosystem', 'theory', 'learning', 'videos', 'outils'];

test('L21 — les cinq pages de contenu ont une revue datée et un rythme', () => {
  assert.deepEqual(Object.keys(PAGES_REVUES).sort(), [...ATTENDUES].sort());
  for (const [cle, p] of Object.entries(PAGES_REVUES)) {
    assert.match(p.derniereRevue, /^\d{4}-\d{2}-\d{2}$/, cle);
    assert.ok(p.chemin.startsWith('/'), cle);
    assert.ok(p.titre.trim(), cle);
    for (const x of p.perimes) {
      assert.ok(x.texte.trim() && x.source.href.startsWith('https://') && x.source.label.trim(), `${cle} : périmé sans source`);
      assert.match(x.releve, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
  assert.equal(RYTHME_JOURS, 30);
  assert.doesNotThrow(() => verifierRevues(new Date('2026-11-22T12:00:00Z')));
});

test('L21 — prochaine revue = dernière + rythme, en jours calendaires', () => {
  assert.equal(prochaineRevue('2026-11-22'), '2026-12-22');
  assert.equal(prochaineRevue('2026-12-15'), '2027-01-14');
});

test('L21 — une revue en retard est signalée avec son nombre de jours', () => {
  const a = etatRevue('2026-11-22', new Date('2026-12-22T10:00:00Z'));
  assert.equal(a.enRetard, false);
  assert.equal(a.derniereLabel.replace(/\u00a0/g, ' '), '22 novembre 2026');
  assert.equal(a.prochaineLabel.replace(/\u00a0/g, ' '), '22 décembre 2026');
  const b = etatRevue('2026-11-22', new Date('2026-12-25T10:00:00Z'));
  assert.equal(b.enRetard, true);
  assert.equal(b.joursDeRetard, 3);
});

test('L21 — une date de revue dans le futur ou invalide est refusée', () => {
  assert.throws(() => verifierRevues(new Date('2026-11-01T12:00:00Z')), /futur/);
  assert.throws(() => etatRevue('2026-02-30', new Date()), /invalide/);
});

test('L21 — chaque actualité de la veille est datée, sourcée et rattachée à une page', () => {
  assert.ok(actualites.length >= 5);
  for (const a of actualites) {
    assert.match(a.date, /^\d{4}-\d{2}-\d{2}$/, a.titre);
    assert.ok(['publie', 'releve'].includes(a.nature), a.titre);
    assert.ok(a.source.href.startsWith('https://') && a.source.label.trim(), a.titre);
    assert.ok(a.titre.trim() && a.texte.trim(), a.titre);
    assert.ok(Object.keys(PAGES_REVUES).includes(a.page), `${a.titre} : page ${a.page}`);
  }
  // La plus récente en tête.
  const dates = actualites.map((a) => a.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.doesNotThrow(() => verifierActualites(new Date('2026-11-22T12:00:00Z')));
  assert.throws(() => verifierActualites(new Date('2026-11-01T12:00:00Z')), /futur/);
});

test('L21 — les gardes de date comparent au jour de Paris, pas au jour UTC', () => {
  // 0 h 30 à Paris le 22-11 = 23 h 30 UTC le 21-11 : une revue datée du 22 est acceptée.
  const minuitTrenteParis = new Date('2026-11-22T00:30:00+01:00');
  assert.equal(jourParis(minuitTrenteParis), '2026-11-22');
  assert.doesNotThrow(() => verifierRevues(minuitTrenteParis));
  assert.doesNotThrow(() => verifierActualites(minuitTrenteParis));
  // Heure d'été : 1 h 30 à Paris le 15-07 = 23 h 30 UTC le 14-07.
  assert.equal(jourParis(new Date('2027-07-15T01:30:00+02:00')), '2027-07-15');
  // 23 h 30 à Paris le 21-11 : le 22 est encore dans le futur.
  const veille = new Date('2026-11-21T23:30:00+01:00');
  assert.equal(jourParis(veille), '2026-11-21');
  assert.throws(() => verifierRevues(veille), /futur/);
  assert.throws(() => verifierActualites(veille), /futur/);
  // Le retard compte aussi en jours de Paris.
  assert.equal(etatRevue('2026-11-22', new Date('2026-12-23T00:30:00+01:00')).joursDeRetard, 1);
});
