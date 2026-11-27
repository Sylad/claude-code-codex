// L35, passe 2 — « Dernier relevé le … » de /ecosystem est la date du dernier PASSAGE réussi du batch
// sur la source (src/data/feeds/derniers-releves.json, écrit par scripts/lib/process-source.ts), pas le
// plus grand fetchedAt : le batch ne pose fetchedAt qu'à la première apparition d'un élément (constat de
// la revue : « 9 mai 2026 » affiché alors que le batch avait tourné le 23-11). Plus la branche flux vide.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { withViteSsr } from './lib/vite-ssr.mjs';
import { fluxATester } from '../src/lib/nouveautes-a-tester.mjs';

const MCP = 'github-mcp-servers';
const SKILLS = 'github-anthropics-skills';
const mcp = (title, fetchedAt) => ({
  id: title, source: MCP, url: `https://github.com/modelcontextprotocol/servers/tree/main/src/${title}`,
  title, summary: '', fetchedAt,
});

test('dernier relevé = passage du batch, pas le plus récent fetchedAt (cas du 9 mai / 23 novembre)', () => {
  const r = fluxATester(MCP, [mcp('fetch', '2026-05-09T08:12:03Z'), mcp('git', '2026-05-09T08:12:03Z')], [],
    { [MCP]: '2026-11-23T06:05:00Z' });
  assert.equal(r.releve, '2026-11-23');
  assert.equal(r.derniereNouveaute, '2026-05-09');
  // Jour de Paris : 23 h 30 UTC le 23 = le 24 à Paris.
  assert.equal(fluxATester(MCP, [], [], { [MCP]: '2026-11-23T23:30:00Z' }).releve, '2026-11-24');
});

test('sans passage enregistré, aucune date de relevé n’est affirmée', () => {
  const r = fluxATester(MCP, [mcp('fetch', '2026-05-09T08:12:03Z')], [], { [SKILLS]: '2026-11-23T06:05:00Z' });
  assert.equal(r.releve, null);
  assert.equal(r.derniereNouveaute, '2026-05-09');
});

test('une date de passage illisible fait échouer le build', () => {
  assert.throws(() => fluxATester(MCP, [], [], { [MCP]: 'lundi' }), /dernier relevé illisible/);
});

test('flux vide : ni nouveauté ni date inventée', () => {
  const r = fluxATester(MCP, [], []);
  assert.deepEqual([r.total, r.aTester, r.releve, r.derniereNouveaute], [0, [], null, null]);
});

// Rendu du composant avec des flux de fixture (les fichiers versionnés ne sont pas touchés).
async function rendu(fichiers) {
  const dir = mkdtempSync(join(tmpdir(), 'l35-releve-'));
  try {
    const chemins = {};
    for (const [nom, contenu] of Object.entries(fichiers)) {
      chemins[nom] = join(dir, `${nom}.json`);
      writeFileSync(chemins[nom], JSON.stringify(contenu));
    }
    const fixture = {
      name: 'l35-fixture-flux', enforce: 'pre',
      resolveId(id) {
        const m = /(?:^|\/)data\/feeds\/([\w-]+)\.json$/.exec(id);
        return m ? chemins[m[1]] ?? null : null;
      },
    };
    return await withViteSsr([fixture], async (load) => {
      const { default: C } = await load('/src/components/site/NouveautesATester.astro');
      return (await AstroContainer.create()).renderToString(C);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const bloc = (html, cle) => html.split('data-flux=').find((c) => c.startsWith(`"${cle}"`)) ?? '';
// Texte sans balises : chaque morceau après « < » perd sa balise jusqu'à « > » (sans regex à retour arrière).
const texte = (h) => h.split('<').map((c, i) => (i === 0 ? c : c.slice(c.indexOf('>') + 1))).join('').split(/\s/).filter(Boolean).join(' ');

test('rendu : flux vide → « Aucun relevé pour l’instant » et « Rien à montrer. » visibles ; date du passage sinon', { timeout: 60_000 }, async () => {
  const html = await rendu({
    [SKILLS]: [],
    [MCP]: [mcp('fetch', '2026-05-09T08:12:03Z')],
    'derniers-releves': { [MCP]: '2026-11-23T06:05:00Z' },
  });
  const skills = texte(bloc(html, SKILLS));
  assert.match(skills, /Aucun relevé pour l'instant/);
  assert.match(skills, /Rien à montrer\./);
  assert.match(bloc(html, SKILLS), /data-rien/);
  const serveurs = texte(bloc(html, MCP));
  assert.match(serveurs, /Dernier relevé le 23\s+novembre 2026 · 1 serveur relevé/);
  assert.doesNotMatch(serveurs, /mai/);
  assert.match(serveurs, /Tout ce qui a été relevé est déjà au catalogue\.|Voir fetch sur GitHub/);
});

test('rendu : sans passage enregistré, le bloc date la dernière nouveauté, pas un relevé', { timeout: 60_000 }, async () => {
  const html = await rendu({
    [SKILLS]: [],
    [MCP]: [mcp('fetch', '2026-05-09T08:12:03Z')],
    'derniers-releves': {},
  });
  const serveurs = texte(bloc(html, MCP));
  assert.match(serveurs, /Dernière nouveauté relevée le 9\s+mai 2026 · 1 serveur relevé/);
  assert.doesNotMatch(serveurs, /Dernier relevé le/);
});

// Le batch : un passage réussi note sa date, une source en échec ne la bouge pas, les autres sources restent.
const MODULE = fileURLToPath(new URL('../../scripts/lib/process-source.ts', import.meta.url));
const FEEDS = fileURLToPath(new URL('../../scripts/lib/feeds.ts', import.meta.url));

test('batch : la date de relevé n’avance que sur un passage réussi', async () => {
  const { processSource, writeReleve, readReleves } = await withViteSsr([], async (load) => ({
    ...(await load(MODULE)), ...(await load(FEEDS)),
  }));
  const notes = [];
  const deps = {
    readFeed: () => [mcp('fetch', '2026-05-09T08:12:03Z')],
    writeFeed: () => {},
    summarize: async () => 'résumé',
    now: () => '2026-11-23T06:05:00Z',
    noteReleve: (s, i) => notes.push([s, i]),
  };
  // Aucun élément nouveau : la date de passage est quand même notée.
  await processSource({ NAME: MCP, fetchEntries: async () => [] }, deps);
  assert.deepEqual(notes, [[MCP, '2026-11-23T06:05:00Z']]);
  await assert.rejects(processSource({ NAME: SKILLS, fetchEntries: async () => { throw new Error('API'); } }, deps));
  assert.equal(notes.length, 1);

  const dir = mkdtempSync(join(tmpdir(), 'l35-releves-'));
  try {
    const f = join(dir, 'derniers-releves.json');
    writeReleve(MCP, '2026-11-16T06:00:00Z', f);
    writeReleve(SKILLS, '2026-11-23T06:00:00Z', f);
    writeReleve(MCP, '2026-11-23T06:05:00Z', f);
    assert.deepEqual(readReleves(f), { [SKILLS]: '2026-11-23T06:00:00Z', [MCP]: '2026-11-23T06:05:00Z' });
    assert.ok(readFileSync(f, 'utf8').endsWith('}\n'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
