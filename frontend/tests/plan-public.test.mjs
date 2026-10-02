// L15 — page « Plan de travail » : ce qui est publié du plan (docs/plan/raf.yaml).
// Repris d'evatosorus (L28) : un lot n'apparaît que s'il est `visible: true`, non abandonné,
// et a un titre PUBLIC — son champ `public:`, sinon (lot LIVRÉ seulement) le titre de sa
// Nouveauté la plus récente, sinon il est masqué ; JAMAIS le titre brut du plan. Liste
// blanche : id, titre public, état, date de livraison, décompte des sous-tâches
// (abandonnées exclues des deux nombres).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import {
  publicPlan, parsePublicPlan, publicTitleOf, newsTitlesByLot, checkPublicTitle, planSummary, stepsLabel, RECENT_DONE,
} from '../src/lib/plan-public.ts';

const { parse } = createRequire(new URL('../package.json', import.meta.url))('yaml');

const SECRET = 'PRIVE-NE-DOIT-PAS-SORTIR';

const plan = {
  version: 1,
  project: 'demo',
  lots: [
    { id: 'L1', title: `${SECRET} brut L1`, public: 'Ancienne amélioration', visible: true, status: 'done', created: '2026-09-01', finished: '2026-09-02', notes: [{ date: '2026-09-02', text: SECRET }] },
    { id: 'L2', title: `${SECRET} brut L2`, public: 'Ce qui est sur l’établi', visible: true, status: 'doing', created: '2026-09-03', started: '2026-09-04', notes: [{ date: '2026-09-04', text: SECRET }],
      tasks: [{ id: 't1', title: `${SECRET} sous-tâche`, status: 'done' }, { id: 't2', title: 'x', status: 'todo' }, { id: 't3', title: 'y', status: 'dropped' }, { id: 't4', title: 'z', status: 'dropped' }] },
    { id: 'L3', title: `${SECRET} brut L3`, visible: true, status: 'todo', created: '2026-09-05' },
    { id: 'L4', title: `${SECRET} brut L4`, public: 'Abandonné', visible: true, status: 'dropped', created: '2026-09-05', reason: SECRET },
    { id: 'L5', title: `${SECRET} brut L5`, visible: true, status: 'done', created: '2026-09-06', finished: '2026-09-20', ux: { date: '2026-09-20', verdict: SECRET } },
    { id: 'L6', title: `${SECRET} brut L6`, public: 'Invisible au visiteur', status: 'done', created: '2026-09-10', finished: '2026-09-21' },
    { id: 'L7', title: `${SECRET} brut L7`, public: 'La suite prévue', visible: true, status: 'todo', created: '2026-09-07' },
    { id: 'L8', title: 'Revue UX — Codex', visible: true, status: 'done', created: '2026-09-07', finished: '2026-09-08' },
    { id: 'L9', title: `${SECRET} brut L9`, visible: true, status: 'doing', created: '2026-09-07' },
  ],
};
// L5 et L8 ont une Nouveauté ; L8 est un lot de processus (revue) : public: exigé.
// L3 (prévu) et L9 (en cours) en ont une aussi, mais le titre de Nouveauté ne vaut que
// pour un lot LIVRÉ.
const news = new Map([['L5', 'Une Nouveauté livrée'], ['L8', 'Le codex revu'], ['L3', 'Annoncé trop tôt'], ['L9', 'Annoncé aussi']]);

test('un lot n’apparaît que visible ET avec un titre public ; titre de Nouveauté pour les livrés seulement ; abandonnés absents', () => {
  const p = publicPlan(plan, { newsTitles: news });
  assert.deepEqual(p.doing.map((l) => l.id), ['L2'], 'L9 en cours sans public: → masqué malgré sa Nouveauté');
  assert.deepEqual(p.todo.map((l) => l.id), ['L7'], 'L3 prévu sans public: → masqué malgré sa Nouveauté');
  assert.deepEqual(p.done.map((l) => l.id), ['L5', 'L1'], 'L6 non visible, L8 revue sans public: → masqués');
  assert.equal(p.done[0].title, 'Une Nouveauté livrée');
  assert.equal(p.todo[0].title, 'La suite prévue');
});

test('liste blanche : id, titre PUBLIC, état, date de livraison, sous-tâches faites/total (abandonnées exclues des deux nombres)', () => {
  const p = publicPlan(plan, { newsTitles: news });
  assert.deepEqual(p.doing[0], { id: 'L2', title: 'Ce qui est sur l’établi', status: 'doing', tasks: { done: 1, total: 2 } });
  assert.deepEqual(p.done[1], { id: 'L1', title: 'Ancienne amélioration', status: 'done', finished: '2026-09-02' });
  assert.ok(!JSON.stringify(p).includes(SECRET), 'titre brut, note, verdict, raison ou sous-tâche publié');
});

test('public: prime sur le titre de la Nouveauté ; une revue, un audit, une campagne avec public: sont publiés', () => {
  const p = publicPlan({ lots: [
    { id: 'L1', title: 'brut', public: 'Titre choisi', visible: true, status: 'done' },
    { id: 'L2', title: 'Revue UX — Vidéos', public: 'La page Vidéos revue', visible: true, status: 'todo' },
    { id: 'L3', title: 'Audit des liens', visible: true, status: 'done' },
    { id: 'L4', title: 'Campagne UX', visible: true, status: 'done' },
  ] }, { newsTitles: new Map([['L1', 'Titre de la Nouveauté'], ['L3', 'Liens'], ['L4', 'UX']]) });
  assert.deepEqual(p.done.map((l) => l.title), ['Titre choisi']);
  assert.deepEqual(p.todo.map((l) => l.title), ['La page Vidéos revue']);
});

test('public: doit être une chaîne sur une ligne, même sur un lot masqué ; sinon le build échoue', () => {
  for (const bad of [42, true, ['a'], { a: 1 }, 'ligne 1\nligne 2', 'a\r\nb']) {
    assert.throws(() => publicTitleOf({ id: 'L1', title: 'b', public: bad, visible: true, status: 'todo' }), /non conforme/, JSON.stringify(bad));
    assert.throws(() => publicTitleOf({ id: 'L1', title: 'b', public: bad, status: 'todo' }), /non conforme/, `${JSON.stringify(bad)} (masqué)`);
  }
  assert.equal(publicTitleOf({ id: 'L1', title: 'b', public: null, visible: true, status: 'todo' }), null);
});

test('titre public non conforme (vide, trop long, « / », fichier, technique, identifiant de lot, sécurité) : le build échoue', () => {
  assert.equal(checkPublicTitle('  Un titre clair  ', 'L1'), 'Un titre clair');
  assert.equal(checkPublicTitle('Une vue d’ensemble des guides Kubernetes', 'L1'), 'Une vue d’ensemble des guides Kubernetes');
  for (const bad of ['', '   ', 'x'.repeat(81), 'Page /nouveautes/', 'Lu depuis raf.yaml', 'Navbar.vue revue', 'Mémoire localStorage',
    'Plan lu en YAML', 'Suite de L17', 'Voir L3/t1', 'Faille XSS corrigée', 'Jeton d’accès', 'Mot de passe oublié']) {
    assert.throws(() => checkPublicTitle(bad, 'L1'), /non conforme/, bad);
  }
  assert.ok('x'.repeat(80) === checkPublicTitle('x'.repeat(80), 'L1'), '80 caractères admis');
  assert.throws(() => publicPlan({ lots: [{ id: 'L1', title: 'b', public: 'voir L2', visible: true, status: 'todo' }] }), /non conforme/);
  // Le titre de Nouveauté d'un lot livré passe la même vérification.
  assert.throws(() => publicPlan({ lots: [{ id: 'L1', title: 'b', visible: true, status: 'done' }] }, { newsTitles: new Map([['L1', 'Fichier news.json']]) }), /non conforme/);
});

test('lot au titre brut de sécurité : masqué même avec public:', () => {
  assert.equal(publicTitleOf({ id: 'L1', title: 'Corriger la faille XSS', public: 'Un formulaire plus sûr', visible: true, status: 'todo' }), null);
});

test(`récemment livré : les ${RECENT_DONE} derniers lots terminés publiés, avec leur total`, () => {
  const many = { lots: Array.from({ length: RECENT_DONE + 4 }, (_, i) => ({ id: `L${i + 1}`, title: 'b', public: `Titre ${i + 1}`, visible: true, status: 'done', finished: `2026-09-${String(i + 1).padStart(2, '0')}` })) };
  const p = publicPlan(many);
  assert.equal(p.done.length, RECENT_DONE);
  assert.equal(p.done[0].id, `L${RECENT_DONE + 4}`);
  assert.deepEqual(p.counts, { doing: 0, todo: 0, done: RECENT_DONE + 4 });
});

test('lot incomplet : ignoré sans exception', () => {
  const p = publicPlan({ lots: [null, 3, { id: 'L1' }, { id: 'L2', public: 'Titre', visible: true }, { id: 'L3', public: 'Titre', visible: true, status: 'bientôt' }] });
  assert.deepEqual([p.doing, p.todo, p.done], [[], [], []]);
});

test('plan absent, illisible ou sans « lots » : parsePublicPlan lève (le build échoue)', () => {
  for (const bad of ['', 'lots: [', 'version: 1', 'lots: x', '- a\n- b', 'lots:\n  - { id: L1\n']) {
    assert.throws(() => parsePublicPlan(bad), Error, JSON.stringify(bad));
  }
  assert.deepEqual(parsePublicPlan('lots: []').counts, { doing: 0, todo: 0, done: 0 });
});

test('newsTitlesByLot : titre de l’entrée la plus récente (première du JSON) citant le lot', () => {
  const m = newsTitlesByLot([
    { title: 'Récente', lots: ['L2', 'L3'] },
    { title: 'Ancienne', lots: ['L2'] },
    { title: 'Sans lots' },
  ]);
  assert.deepEqual([...m], [['L2', 'Récente'], ['L3', 'Récente']]);
});

test('le vrai raf.yaml : publié = visible + titre public ; aucun titre brut (sauf s’il est aussi le titre public), aucune note ni sous-tâche', () => {
  const text = readFileSync(new URL('../../docs/plan/raf.yaml', import.meta.url), 'utf8');
  const entries = JSON.parse(readFileSync(new URL('../public/nouveautes-data/nouveautes.json', import.meta.url), 'utf8')).entries;
  const p = parsePublicPlan(text, entries);
  const shown = [...p.doing, ...p.todo, ...p.done];
  assert.ok(shown.length > 0);
  const raf = parse(text);
  const titles = new Set(shown.map((l) => l.title));
  const out = JSON.stringify(p);
  for (const l of raf.lots) {
    if (!titles.has(l.title)) assert.ok(!out.includes(l.title), `${l.id} : titre brut publié`);
    for (const n of l.notes ?? []) assert.ok(!out.includes(n.text), `${l.id} : note publiée`);
    for (const t of l.tasks ?? []) if (!titles.has(t.title)) assert.ok(!out.includes(t.title), `${l.id}/${t.id} publié`);
  }
  for (const l of shown) assert.equal(raf.lots.find((x) => x.id === l.id).visible, true, `${l.id} non visible publié`);
});

test('bandeau de décomptes : accordé, espaces insécables, sans les groupes vides (« 0 prévu » n’est pas affiché)', () => {
  assert.deepEqual(planSummary({ doing: 2, todo: 0, done: 9 }), ['2 travaux en cours', '9 livrés']);
  assert.deepEqual(planSummary({ doing: 1, todo: 1, done: 1 }), ['1 travail en cours', '1 prévu', '1 livré']);
  assert.deepEqual(planSummary({ doing: 0, todo: 6, done: 0 }), ['6 prévus']);
  assert.deepEqual(planSummary({ doing: 0, todo: 0, done: 0 }), []);
});

test('lots au même titre public : une seule ligne par groupe, date la plus récente, étapes additionnées', () => {
  const p = publicPlan({ lots: [
    { id: 'L19', title: 'b', visible: true, status: 'done', finished: '2026-10-01', tasks: [{ id: 't1', status: 'done' }] },
    { id: 'L20', title: 'b', visible: true, status: 'done', finished: '2026-10-03', tasks: [{ id: 't1', status: 'todo' }, { id: 't2', status: 'done' }] },
    { id: 'L21', title: 'b', visible: true, status: 'done', finished: '2026-10-02' },
    { id: 'L22', title: 'b', public: 'Même suite', visible: true, status: 'todo' },
    { id: 'L23', title: 'b', public: 'Même suite', visible: true, status: 'todo' },
  ] }, { newsTitles: new Map([['L19', 'Le codex se lit mieux'], ['L20', 'Le codex se lit mieux'], ['L21', 'Autre']]) });
  assert.deepEqual(p.done, [
    { id: 'L20', title: 'Le codex se lit mieux', status: 'done', finished: '2026-10-03', tasks: { done: 2, total: 3 }, also: ['L19'] },
    { id: 'L21', title: 'Autre', status: 'done', finished: '2026-10-02' },
  ]);
  assert.deepEqual(p.todo, [{ id: 'L22', title: 'Même suite', status: 'todo', also: ['L23'] }]);
  assert.deepEqual(p.counts, { doing: 0, todo: 1, done: 2 });
  // Même titre mais états différents : deux lignes (une en cours, une livrée).
  const q = publicPlan({ lots: [
    { id: 'A1', title: 'b', public: 'Même titre', visible: true, status: 'done', finished: '2026-10-01' },
    { id: 'A2', title: 'b', public: 'Même titre', visible: true, status: 'doing' },
  ] });
  assert.equal(q.done.length + q.doing.length, 2);
});

test('avancement : accord sur le nombre d’étapes faites (0 et 1 au singulier), espaces insécables', () => {
  const nb = (x) => x.replaceAll(' ', ' ');
  assert.equal(nb(stepsLabel({ done: 0, total: 1 })), '0 étape faite sur 1');
  assert.equal(nb(stepsLabel({ done: 1, total: 2 })), '1 étape faite sur 2');
  assert.equal(nb(stepsLabel({ done: 2, total: 3 })), '2 étapes faites sur 3');
  assert.equal(nb(stepsLabel({ done: 13, total: 13 })), '13 étapes faites sur 13');
  assert.doesNotMatch(stepsLabel({ done: 2, total: 3 }), / /, 'espace sécable : le nombre peut se retrouver seul en fin de ligne');
});

test(`plus de ${RECENT_DONE} lots livrés ET des titres partagés : fusion avant la coupe, ${RECENT_DONE} lignes, la plus récente porte la fusion`, () => {
  const lots = Array.from({ length: RECENT_DONE + 3 }, (_, i) => ({
    id: `L${i + 1}`, title: 'b', public: `Livraison ${i + 1}`, visible: true, status: 'done', finished: `2026-09-${String(i + 1).padStart(2, '0')}`,
  }));
  // L2 et le plus récent partagent un titre ; L3 et L4 aussi (livré un 1er du mois).
  lots[1].public = lots.at(-1).public;
  lots[3].public = lots[2].public;
  lots[3].finished = '2026-10-01';
  const p = publicPlan({ lots });
  assert.equal(p.done.length, RECENT_DONE);
  assert.equal(p.counts.done, RECENT_DONE + 1, 'deux fusions sur 11 lots → 9 lignes');
  assert.deepEqual(p.done[0], { id: 'L4', title: 'Livraison 3', status: 'done', finished: '2026-10-01', also: ['L3'] });
  assert.deepEqual(p.done[1], { id: `L${RECENT_DONE + 3}`, title: lots.at(-1).public, status: 'done', finished: lots.at(-1).finished, also: ['L2'] });
  assert.equal(new Set(p.done.map((l) => l.title)).size, RECENT_DONE);
});
