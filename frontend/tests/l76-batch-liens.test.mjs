// L76 — le traitement d'une source du batch hebdo (scripts/lib/process-source.ts) applique
// le filtre des liens : à l'écriture, seules les entrées http(s) sont gardées, et une entrée
// piégée déjà enregistrée est retirée. Fausse source en mémoire, flux en mémoire, résumé
// factice : ni réseau, ni appel à Claude, ni fichier versionné touché.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { withViteSsr } from './lib/vite-ssr.mjs';

const MODULE = fileURLToPath(new URL('../../scripts/lib/process-source.ts', import.meta.url));

const brute = (titre, url) => ({ title: titre, url, content: `contenu ${titre}`, publishedAt: '2026-11-19T08:00:00Z' });

test('batch : seules les entrées http(s) sont écrites, une entrée piégée existante est retirée', async () => {
  const { processSource } = await withViteSsr([], (load) => load(MODULE));

  const source = {
    NAME: 'fausse-source',
    fetchEntries: async () => [
      brute('piège js', 'javascript:alert(1)'),
      brute('piège data', 'data:text/html,<script>alert(2)</script>'),
      brute('relatif', '/blog/relatif'),
      brute('bon https', 'https://exemple.org/nouveau'),
    ],
  };
  const enregistre = [
    { id: 'ancien-piege', source: 'fausse-source', url: 'javascript:alert(0)', title: 'ancien piège',
      summary: 's', publishedAt: '2026-11-01T08:00:00Z', fetchedAt: '2026-11-02T08:00:00Z' },
    { id: 'ancien-bon', source: 'fausse-source', url: 'https://exemple.org/ancien', title: 'ancien bon',
      summary: 's', publishedAt: '2026-11-01T08:00:00Z', fetchedAt: '2026-11-02T08:00:00Z' },
  ];
  const ecrit = {};
  const resumes = [];
  const deps = {
    readFeed: (nom) => (nom === 'fausse-source' ? structuredClone(enregistre) : []),
    writeFeed: (nom, entrees) => { ecrit[nom] = entrees; },
    summarize: async (raw) => { resumes.push(raw.title); return `résumé ${raw.title}`; },
    now: () => '2026-11-20T08:00:00Z',
  };

  const res = await processSource(source, deps);

  const urls = (ecrit['fausse-source'] ?? []).map((e) => e.url).sort();
  assert.deepEqual(urls, ['https://exemple.org/ancien', 'https://exemple.org/nouveau']);
  assert.ok(urls.every((u) => u.startsWith('https://')));
  assert.deepEqual(res, { source: 'fausse-source', added: 1, total: 2 });
  // Une entrée refusée n'est même pas envoyée au résumé.
  assert.deepEqual(resumes, ['bon https']);
});
