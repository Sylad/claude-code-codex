// L44 — Livre de bord : règles de publication d'une entrée hebdomadaire (lib/livre-de-bord.ts)
// et contenu réel du livre (data/livre-de-bord.ts). Le filtre est strict : rien de privé,
// rien du compte pro, aucun secret ni chemin de machine, liens vers des pages qui existent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { weekOf, weekBounds, findProblems, entryId, PRIVATE_PATTERNS } from '../src/lib/livre-de-bord.ts';
import { ENTRIES } from '../src/data/livre-de-bord.ts';
import { SCHEMAS } from '../src/data/livre-de-bord-schemas.ts';

const PAGES = readdirSync(new URL('../src/pages/', import.meta.url), { recursive: true })
  .filter((f) => f.endsWith('.astro'))
  .map((f) => `/${f.replace(/\.astro$/, '').replace(/(^|\/)index$/, '')}`);
const knownPath = (p) => PAGES.includes(p);

const item = (over = {}) => ({ titre: 'Un titre', texte: 'Un texte.', ...over });
const entry = (over = {}) => ({
  semaine: '2026-W44', date: '2026-10-30', resume: 'Le résumé.',
  appris: [item()], fabrique: [item()], teste: [item()], ...over,
});
const problems = (entries) => findProblems(entries, knownPath);

test('R1 — weekOf donne la semaine ISO, y compris aux bords de l’année', () => {
  assert.equal(weekOf('2026-10-26'), '2026-W44'); // lundi
  assert.equal(weekOf('2026-11-01'), '2026-W44'); // dimanche
  assert.equal(weekOf('2026-11-02'), '2026-W45');
  assert.equal(weekOf('2026-01-01'), '2026-W01');
  assert.equal(weekOf('2027-01-01'), '2026-W53');
  assert.equal(weekOf('2024-12-30'), '2025-W01');
  assert.deepEqual(weekBounds('2026-W44'), { from: '2026-10-26', to: '2026-11-01' });
});

test('R1 — une entrée datée hors de sa semaine, ou une semaine mal écrite, est refusée', () => {
  assert.deepEqual(problems([entry()]), []);
  assert.match(problems([entry({ date: '2026-11-02' })]).join('\n'), /hors de la semaine 2026-W44/);
  assert.match(problems([entry({ semaine: '2026-44' })]).join('\n'), /semaine/);
  assert.match(problems([entry({ date: '30/10/2026' })]).join('\n'), /date/);
});

test('R2 — une seule entrée par semaine, la plus récente en premier', () => {
  const w43 = entry({ semaine: '2026-W43', date: '2026-10-25' });
  assert.deepEqual(problems([entry(), w43]), []);
  assert.match(problems([w43, entry()]).join('\n'), /plus récente en premier/);
  assert.match(problems([entry(), entry({ date: '2026-10-29' })]).join('\n'), /deux entrées pour la semaine 2026-W44/);
});

test('R3 — chaque entrée a un résumé et au moins une rubrique remplie ; texte et titre non vides', () => {
  assert.match(problems([entry({ resume: ' ' })]).join('\n'), /résumé/);
  assert.match(problems([entry({ appris: [], fabrique: [], teste: [] })]).join('\n'), /aucune rubrique/);
  assert.deepEqual(problems([entry({ teste: [] })]), []); // une semaine sans verdict est permise
  assert.match(problems([entry({ appris: [item({ titre: '' })] })]).join('\n'), /titre/);
  assert.match(problems([entry({ fabrique: [item({ texte: '' })] })]).join('\n'), /texte/);
  assert.match(problems([entry({ appris: undefined })]).join('\n'), /appris/);
});

test('R4 — filtre : chemin de machine, secret, machine ou compte pro refusés (titre, texte, résumé, liens)', () => {
  const bad = [
    'voir /home/sylvain_ladoire/projects', 'dans ~/projects/x', 'C:\\Users\\moi', 'sur /volume2/docker',
    'serveur 192.168.1.38', 'clé sk-ant-api03-abcdef', 'jeton ghp_abcdefghijklmnop', 'ANTHROPIC_API_KEY=abc',
    'dark-blue', 'Big-Blue', 'mini-blue', 'projet meteo-gis', 'compte pro', 'mail sylvain@exemple.fr',
    'document confidentiel', 'clause contractuelle',
  ];
  for (const b of bad) {
    for (const where of ['titre', 'texte']) {
      assert.match(problems([entry({ appris: [item({ [where]: b })] })]).join('\n'), /privé|filtre/, `${where} : « ${b} » passe`);
    }
    assert.match(problems([entry({ resume: b })]).join('\n'), /privé|filtre/, `résumé : « ${b} » passe`);
  }
  assert.match(problems([entry({ appris: [item({ liens: [{ label: 'dark-blue', href: '/about' }] })] })]).join('\n'), /privé|filtre/);
  assert.ok(PRIVATE_PATTERNS.length >= 8);
  // pas de faux positif sur du texte courant
  assert.deepEqual(problems([entry({ texte: 'La profession, le professeur et un projet proche.', resume: 'Une semaine calme.' })]), []);
});

test('R5 — un lien est interne et existant, ou le dépôt public de cadence', () => {
  const ok = (href) => problems([entry({ fabrique: [item({ liens: [{ label: 'Lien', href }] })] })]);
  assert.deepEqual(ok('/case-studies'), []);
  assert.deepEqual(ok('/case-studies#tools-tested'), []);
  assert.deepEqual(ok('/case-studies/ruflo'), []);
  assert.deepEqual(ok('/case-studies/ruflo#Verdict'), []);
  assert.deepEqual(ok('/case-studies/'), []);
  assert.deepEqual(ok('/livre-de-bord#semaine-2026-W43'), []);
  assert.deepEqual(ok('https://github.com/Sylad/cadence'), []);
  assert.deepEqual(ok('https://github.com/Sylad/cadence/blob/main/CHANGELOG.md'), []);
  for (const bad of ['/page-qui-n-existe-pas', '/case-studies/page-qui-n-existe-pas', '/case-studies//ruflo', '/case-studies/../about', 'https://exemple.com/x', 'https://github.com/Sylad/cadence-evil', 'http://github.com/Sylad/cadence', 'case-studies', '//exemple.com', 'javascript:alert(1)']) {
    assert.match(ok(bad).join('\n'), /lien/, `« ${bad} » accepté`);
  }
  assert.match(problems([entry({ fabrique: [item({ liens: [{ label: '', href: '/about' }] })] })]).join('\n'), /lien/);
});

test('R6 — le livre réel passe tout le filtre, a une entrée par semaine depuis le 19-10 et des liens vers cadence, études de cas et Tools tested', () => {
  assert.deepEqual(findProblems(ENTRIES, knownPath, Object.keys(SCHEMAS)), []);
  assert.deepEqual(ENTRIES.filter((e) => !e.theme).map((e) => e.semaine).slice(0, 2), ['2026-W44', '2026-W43']);
  const hrefs = ENTRIES.flatMap((e) => [...e.appris, ...e.fabrique, ...e.teste]).flatMap((i) => (i.liens ?? []).map((l) => l.href));
  assert.ok(hrefs.some((h) => h.startsWith('https://github.com/Sylad/cadence')), 'aucun lien vers cadence');
  assert.ok(hrefs.some((h) => h.startsWith('/case-studies')), 'aucun lien vers les études de cas / Tools tested');
  for (const e of ENTRIES) assert.ok(e.appris.length > 0 && e.fabrique.length > 0, `${e.semaine} : appris et fabriqué attendus`);
});

test('R7 — la semaine 44 couvre toutes les versions de cadence du 26-10 au 30-10 (1.12.1 à 1.26.0), pas seulement les trois dernières', () => {
  const w44 = ENTRIES.find((e) => e.semaine === '2026-W44' && !e.theme);
  assert.match(w44.resume, /de 1\.12 à 1\.26/);
  const fabrique = w44.fabrique.map((i) => `${i.titre} ${i.texte}`).join('\n');
  const versions = [
    '1.12.1', '1.13.0', '1.14.0', '1.14.1', '1.15.0', '1.15.1', '1.16.0', '1.16.1', '1.17.0', '1.17.1',
    '1.18.0', '1.19.0', '1.19.1', '1.20.0', '1.21.0', '1.21.1', '1.22.0', '1.22.1', '1.23.0', '1.24.0',
    '1.25.0', '1.25.1', '1.26.0',
  ];
  for (const v of versions) assert.ok(fabrique.includes(v), `version ${v} absente de « fabriqué »`);
});

test('R12 — une entrée thématique cohabite avec l’entrée hebdomadaire de sa semaine ; pas deux du même genre', () => {
  const theme = entry({ theme: 'Un sujet' });
  assert.deepEqual(problems([theme, entry()]), []);
  assert.deepEqual(problems([entry(), theme]), []);
  assert.match(problems([theme, entry({ theme: 'Autre', date: '2026-10-29' })]).join('\n'), /deux entrées thématiques pour la semaine 2026-W44/);
  assert.match(problems([entry({ theme: '  ' })]).join('\n'), /thème vide/);
  assert.notEqual(entryId(theme), entryId(entry()));
  assert.match(problems([entry({ theme: 'Contact : ana@exemple.fr' })]).join('\n'), /contenu privé/);
  assert.match(problems([entry({ rubriques: { appris: 'Mon compte pro' } })]).join('\n'), /contenu privé/);
});

test('R13 — seule la chaîne de la vidéo commentée est permise parmi les liens externes hors cadence', () => {
  const withLink = (href) => problems([entry({ appris: [item({ liens: [{ label: 'La vidéo', href }] })] })]);
  assert.deepEqual(withLink('https://www.youtube.com/@melvynxdev'), []);
  assert.match(withLink('https://www.youtube.com/@autre').join('\n'), /adresse non permise/);
  assert.match(withLink('https://www.youtube.com/@melvynxdev/videos').join('\n'), /adresse non permise/);
});

test('R14 — l’entrée thématique du 30-10 : vérification plutôt que confiance, quatre faits sourcés, lien vers la vidéo, ton sans attaque', () => {
  const t = ENTRIES.find((e) => e.theme);
  assert.ok(t, 'entrée thématique absente');
  assert.equal(t.semaine, '2026-W44');
  assert.equal(t.date, '2026-10-30');
  assert.match(t.theme, /vérification, pas la confiance/);
  const all = [...t.appris, ...t.fabrique, ...t.teste];
  const text = all.map((i) => `${i.titre} ${i.texte}`).join('\n');
  for (const f of ['L166', 'L167', 'L37', 'L217', 'L439', 'L44']) assert.ok(text.includes(f), `fait ${f} absent`);
  for (const w of ['finance', 'warhammer', 'cadence', 'avatar']) assert.match(text, new RegExp(w, 'i'));
  for (const k of ['contexte persistant', 'je ne regarde jamais', 'souveraineté', 'chiffres', 'peur', 'coût']) {
    assert.match(`${t.resume}\n${text}`, new RegExp(k, 'i'), `point « ${k} » absent`);
  }
  assert.ok(all.flatMap((i) => i.liens ?? []).some((l) => l.href === 'https://www.youtube.com/@melvynxdev'), 'lien vidéo absent');
  assert.doesNotMatch(`${t.resume}\n${text}`, /\b(menteur|nul|arnaque|escroc|charlatan|imbécile)\b/i);
});

// L51 — schéma de l'entrée et illustration par épisode : identifiants connus, texte découpé.
const withIds = (entries, ids) => findProblems(entries, knownPath, ids);

test('R12 — un schéma d’entrée ou une illustration d’épisode doit être un identifiant connu', () => {
  assert.deepEqual(withIds([entry({ schema: 'boucle', appris: [item({ illustration: 'finance' })] })], ['boucle', 'finance']), []);
  assert.match(withIds([entry({ schema: 'inconnu' })], ['boucle']).join('\n'), /schéma inconnu/);
  assert.match(withIds([entry({ teste: [item({ illustration: 'inconnue' })] })], ['finance']).join('\n'), /illustration inconnue/);
  // sans liste d'identifiants fournie, rien n'est connu : on ne laisse pas passer un identifiant non vérifié
  assert.match(problems([entry({ schema: 'boucle' })]).join('\n'), /schéma inconnu/);
  assert.match(withIds([entry({ schema: '' })], ['boucle']).join('\n'), /schéma inconnu/);
});

test('R13 — dans un texte découpé en paragraphes (ligne vide), un paragraphe vide ou privé est refusé', () => {
  assert.deepEqual(problems([entry({ appris: [item({ texte: 'Un.\n\nDeux.' })] })]), []);
  assert.match(problems([entry({ appris: [item({ texte: '   \n\n  ' })] })]).join('\n'), /texte vide/);
  assert.match(problems([entry({ appris: [item({ texte: 'Un.\n\nVoir /home/x/secret' })] })]).join('\n'), /contenu privé/);
});

test('R14 — l’entrée thématique « vérification » porte son schéma et une illustration par épisode, en paragraphes courts', () => {
  const e = ENTRIES.find((x) => x.theme?.includes('vérification'));
  assert.ok(e, 'entrée thématique absente');
  assert.equal(e.schema, 'boucle-verification');
  assert.deepEqual(e.teste.map((i) => i.illustration), ['episode-finance', 'episode-warhammer', 'episode-cadence', 'episode-avatar']);
  for (const it of [...e.appris, ...e.fabrique, ...e.teste]) {
    const paras = it.texte.split(/\n{2,}/);
    for (const p of paras) assert.ok(p.length <= 420, `« ${it.titre} » : paragraphe de ${p.length} caractères`);
  }
  for (const it of e.teste) assert.ok(it.texte.split(/\n{2,}/).length >= 2, `« ${it.titre} » : texte non découpé`);
});
