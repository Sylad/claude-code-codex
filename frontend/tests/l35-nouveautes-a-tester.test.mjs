// L35 — « Nouveautés à tester » de /ecosystem : les éléments des flux hebdomadaires
// (github-anthropics-skills, github-mcp-servers) absents du catalogue, chacun avec son lien et sa
// date de relevé, rien d'inventé. Module pur : src/lib/nouveautes-a-tester.mjs.
// Le test e2e (l35-nouveautes-a-tester.e2e.test.mjs) vérifie la page construite.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extraitResume, fluxATester } from '../src/lib/nouveautes-a-tester.mjs';
import { jourParis } from '../src/lib/revue-contenu.mjs';

const releves = JSON.parse(readFileSync(new URL('../src/data/feeds/derniers-releves.json', import.meta.url), 'utf8'));
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
    const r = fluxATester(cle, elements, catalogue, releves);
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
    // Date du dernier passage : seulement celle que le batch a notée (derniers-releves.json), jamais un fetchedAt.
    const passage = releves[cle];
    assert.equal(r.releve, passage === undefined ? null : jourParis(new Date(passage)));
    if (elements.length) assert.match(r.derniereNouveaute, /^\d{4}-\d{2}-\d{2}$/);
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
  assert.equal(r.derniereNouveaute, '2026-11-21');
  assert.equal(r.releve, null);
});

test('L35 — extrait : description d’un SKILL.md, prose d’un README, résumé français tel quel', () => {
  const coupe = '---\nname: x\ndescription: "Build things with a long description that the batch cut somewhere in the middle of a word because it is long enough to be cut by the batch at one hundred forty charac';
  assert.ok(coupe.length >= 130);
  assert.deepEqual(extraitResume(coupe), { texte: 'Build things with a long description that the batch cut somewhere in the middle of a word because it is long enough to be cut by the batch at one hundred forty charac…', langue: 'en' });
  // L109 : « Short. » ne donne aucun indice de langue → lang="" (inconnue), jamais supposée.
  assert.deepEqual(extraitResume('---\nname: x\ndescription: "Short."\n---'), { texte: 'Short.', langue: '' });
  assert.deepEqual(extraitResume('# Fetch MCP Server\n\n<!-- mcp-name: x -->\n\nA server that fetches.'), { texte: 'A server that fetches.', langue: 'en' });
  assert.equal(extraitResume('# Everything\n**[Architecture](docs/a.md)\n| [Structure](docs/s.md)'), null);
  assert.deepEqual(extraitResume('Fait une chose utile.'), { texte: 'Fait une chose utile.', langue: 'fr' });
  assert.equal(extraitResume(''), null);
});

// L109 — suites de la revue UX de L35 : compteur explicite, langue de l'extrait déduite du texte.
import { compteurFlux, langueDuTexte } from '../src/lib/nouveautes-a-tester.mjs';

test('L109 — la langue d’un extrait est déduite du texte, jamais supposée française', () => {
  // Résumé déjà rédigé (ni en-tête YAML, ni Markdown) mais en anglais : il ne porte pas lang=fr.
  assert.deepEqual(extraitResume('Adds verification questions after substantive answers to help the user check assumptions.'), {
    texte: 'Adds verification questions after substantive answers to help the user check assumptions.',
    langue: 'en',
  });
  assert.equal(extraitResume('Ajoute des questions de vérification après les réponses pour aider l’utilisateur.').langue, 'fr');
  // Description d'un SKILL.md écrite en français : lang=fr, pas « en » par défaut.
  assert.equal(extraitResume('---\nname: x\ndescription: "Recommande les cours adaptés quand l\'utilisateur demande de l\'aide."\n---').langue, 'fr');
  // Rien pour trancher : langue inconnue (lang=""), ni fr ni en.
  assert.equal(langueDuTexte('Model Context Protocol'), '');
  assert.equal(langueDuTexte(''), '');
});

test('L109 — les extraits des flux réels : chaque langue suit le texte', () => {
  for (const cle of ['github-anthropics-skills', 'github-mcp-servers']) {
    for (const el of feed(cle)) {
      const x = extraitResume(el.summary);
      if (!x) continue;
      assert.equal(x.langue, langueDuTexte(x.texte), el.title);
    }
  }
  const skills = feed('github-anthropics-skills');
  const langue = (titre) => extraitResume(skills.find((e) => e.title === titre).summary).langue;
  assert.equal(langue('academy-guide'), 'fr');
  assert.equal(langue('pdf'), 'en');
});

test('L109 — le compteur dit ce qu’il compte : relevés et déjà au catalogue', () => {
  assert.equal(compteurFlux({ nature: 'skill', total: 19, auCatalogue: 17 }), '19 skills relevées, 17 déjà au catalogue');
  assert.equal(compteurFlux({ nature: 'mcp', total: 7, auCatalogue: 7 }), '7 serveurs relevés, 7 déjà au catalogue');
  assert.equal(compteurFlux({ nature: 'skill', total: 1, auCatalogue: 0 }), '1 skill relevée, aucune déjà au catalogue');
  assert.equal(compteurFlux({ nature: 'mcp', total: 1, auCatalogue: 1 }), '1 serveur relevé, 1 déjà au catalogue');
  for (const cle of ['github-anthropics-skills', 'github-mcp-servers']) {
    const r = fluxATester(cle, feed(cle), catalogue, releves);
    assert.equal(r.auCatalogue + r.aTester.length, r.total, cle);
  }
});
