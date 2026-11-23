// L87 — la fonction unique qui lie le jour à son mois (src/lib/jour-mois.mjs).
import test from 'node:test';
import assert from 'node:assert/strict';
import { lierJourMois, lierJourMoisHtml, espacesOrdinaires } from '../src/lib/jour-mois.mjs';

const N = ' ';

test('un jour suivi d\'un mois est lié par une insécable, l\'année garde son espace', () => {
  assert.equal(lierJourMois('le 31 octobre 2026'), `le 31${N}octobre 2026`);
  assert.equal(lierJourMois('(29 octobre)'), `(29${N}octobre)`);
  assert.equal(lierJourMois('du 1er décembre'), `du 1er${N}décembre`);
  assert.equal(lierJourMois('le 3 Novembre, le 9 MAI'), `le 3${N}Novembre, le 9${N}MAI`);
  assert.equal(lierJourMois('le 15\n  août et le 2 fevrier'), `le 15${N}août et le 2${N}fevrier`);
  assert.equal(lierJourMois('le 01 juin'), `le 01${N}juin`);
  for (const m of ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']) {
    assert.equal(lierJourMois(`le 12 ${m}`), `le 12${N}${m}`, m);
  }
});

test('rien d\'autre ne devient insécable', () => {
  for (const s of [
    'en 2026 mai', 'le 32 mai', 'les 0 mai', '1,5 mai', 'v2 mai', 'L12 mars', 'x-3 mars', '10:30 mai',
    '12 mains', '3 marsupiaux', '5 maisons', '22 novembres', 'chapitre 3 : mars', 'le 22 décembre 2026'.replace('22 ', '22x '),
    '2 h 30', 'page 4 sur 10',
  ]) assert.equal(lierJourMois(s), s, s);
  assert.equal(lierJourMois('le 22 décembre 2026 à 20 h'), `le 22${N}décembre 2026 à 20 h`);
});

test('déjà lié : inchangé (idempotent)', () => {
  const s = lierJourMois('le 22 novembre 2026');
  assert.equal(lierJourMois(s), s);
});

test('HTML : texte et attributs traités, scripts, styles et commentaires intacts', () => {
  const html = '<p title="le 3 mai">le 3 mai</p><script>const d = "le 3 mai";</script>'
    + '<style>/* 3 mai */</style><!-- le 3 mai --><astro-island props="{&quot;t&quot;:[0,&quot;du 22 novembre&quot;]}"></astro-island>';
  assert.equal(lierJourMoisHtml(html),
    `<p title="le 3${N}mai">le 3${N}mai</p><script>const d = "le 3 mai";</script>`
    + `<style>/* 3 mai */</style><!-- le 3 mai --><astro-island props="{&quot;t&quot;:[0,&quot;du 22${N}novembre&quot;]}"></astro-island>`);
});

test('recherche : les insécables se lisent comme des espaces', () => {
  assert.equal(espacesOrdinaires(`22${N}novembre 20 h`), '22 novembre 20 h');
});
