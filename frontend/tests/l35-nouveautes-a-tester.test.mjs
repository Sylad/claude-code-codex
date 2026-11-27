// L35 — « Nouveautés à tester » de /ecosystem : les éléments des flux hebdomadaires
// (github-anthropics-skills, github-mcp-servers) absents du catalogue, chacun avec son lien et sa
// date de relevé, rien d'inventé. Module pur : src/lib/nouveautes-a-tester.mjs.
// Le test e2e (l35-nouveautes-a-tester.e2e.test.mjs) vérifie la page construite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extraitResume, fluxATester } from '../src/lib/nouveautes-a-tester.mjs';

const feed = (nom) => JSON.parse(readFileSync(new URL(`../src/data/feeds/${nom}.json`, import.meta.url), 'utf8'));
// Catalogue lu dans la source TS (nom + lien source de chaque entrée) : node --test ne charge pas le TS.
const src = readFileSync(new URL('../src/data/ecosystem.ts', import.meta.url), 'utf8');
const catalogue = src
  .split(/\n {2}\{\n/)
  .slice(1)
  .map((bloc) => ({ name: /name: "([^"]+)"/.exec(bloc)?.[1], source: /source:\s*"([^"]+)"/.exec(bloc)?.[1] }))
  .filter((e) => e.name && e.source);

test('L35 — le catalogue lu par le test a toutes ses entrées', () => {
  assert.equal(catalogue.length, (src.match(/\n {4}id: "/g) ?? []).length);
});

for (const cle of ['github-anthropics-skills', 'github-mcp-servers']) {
  test(`L35 — ${cle} : seuls les éléments absents du catalogue, chacun venu du flux`, () => {
    const elements = feed(cle);
    const r = fluxATester(cle, elements, catalogue);
    assert.equal(r.total, elements.length);
    const liens = new Set(catalogue.map((e) => e.source));
    const noms = new Set(catalogue.map((e) => e.name.toLowerCase()));
    for (const n of r.aTester) {
      const el = elements.find((e) => e.url === n.lien);
      assert.ok(el, `${n.nom} : lien absent du flux`);
      assert.equal(n.nom, el.title);
      assert.ok(!liens.has(n.lien) && !noms.has(n.nom.toLowerCase()), `${n.nom} est déjà au catalogue`);
      assert.match(n.releve, /^\d{4}-\d{2}-\d{2}$/);
      if (n.extrait) assert.ok(el.summary.includes(n.extrait.texte.replace(/…$/, '')), `${n.nom} : extrait absent du résumé`);
    }
    // Tout élément du flux est soit au catalogue, soit à tester.
    const absents = elements.filter((e) => !liens.has(e.url) && !noms.has(e.title.toLowerCase()));
    assert.deepEqual(r.aTester.map((n) => n.lien).sort(), absents.map((e) => e.url).sort());
    assert.match(r.releve, /^\d{4}-\d{2}-\d{2}$/);
  });
}

test('L35 — un lien hors du dépôt du flux ou une date illisible font échouer le build', () => {
  const base = { id: 'x', source: 'github-anthropics-skills', title: 'x', summary: '', fetchedAt: '2026-11-20T06:00:00Z' };
  assert.throws(() => fluxATester('github-anthropics-skills', [{ ...base, url: 'https://exemple.com/x' }], []), /hors de/);
  assert.throws(
    () => fluxATester('github-anthropics-skills', [{ ...base, url: 'https://github.com/anthropics/skills/tree/main/skills/x', fetchedAt: 'hier' }], []),
    /sans date/,
  );
  assert.throws(() => fluxATester('inconnu', [], []), /flux inconnu/);
});

test('L35 — un élément du catalogue (même lien ou même nom) est écarté, la date est le jour de Paris', () => {
  const el = (title, fetchedAt) => ({ id: title, source: 's', url: `https://github.com/anthropics/skills/tree/main/skills/${title}`, title, summary: '', fetchedAt });
  const r = fluxATester(
    'github-anthropics-skills',
    [el('a', '2026-11-20T23:30:00Z'), el('b', '2026-11-20T06:00:00Z'), el('c', '2026-11-19T06:00:00Z')],
    [{ name: 'B', source: 'https://ailleurs' }, { name: 'z', source: 'https://github.com/anthropics/skills/tree/main/skills/c/' }],
  );
  assert.deepEqual(r.aTester.map((n) => [n.nom, n.releve]), [['a', '2026-11-21']]);
  assert.equal(r.releve, '2026-11-21');
});

test('L35 — extrait : description d’un SKILL.md, prose d’un README, résumé français tel quel', () => {
  const coupe = '---\nname: x\ndescription: "Build things with a long description that the batch cut somewhere in the middle of a word because it is long enough to be cut by the batch at one hundred forty charac';
  assert.ok(coupe.length >= 130);
  assert.deepEqual(extraitResume(coupe), { texte: 'Build things with a long description that the batch cut somewhere in the middle of a word because it is long enough to be cut by the batch at one hundred forty charac…', langue: 'en' });
  assert.deepEqual(extraitResume('---\nname: x\ndescription: "Short."\n---'), { texte: 'Short.', langue: 'en' });
  assert.deepEqual(extraitResume('# Fetch MCP Server\n\n<!-- mcp-name: x -->\n\nA server that fetches.'), { texte: 'A server that fetches.', langue: 'en' });
  assert.equal(extraitResume('# Everything\n**[Architecture](docs/a.md)\n| [Structure](docs/s.md)'), null);
  assert.deepEqual(extraitResume('Fait une chose utile.'), { texte: 'Fait une chose utile.', langue: 'fr' });
  assert.equal(extraitResume(''), null);
});
