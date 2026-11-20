// L76 — le composant LatestNews applique le filtre des liens : une entrée de flux au lien
// javascript: ou data: n'apparaît pas dans le HTML rendu. Les flux versionnés ne sont pas
// touchés : leurs imports sont remplacés par une fixture le temps du rendu (plugin Vite),
// et le composant est rendu par l'API container d'Astro.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { withViteSsr } from './lib/vite-ssr.mjs';

const entree = (n, url) => ({
  id: `fixture-${n}`,
  source: 'simon-willison',
  url,
  title: `Titre fixture ${n}`,
  summary: `Résumé fixture ${n}`,
  publishedAt: `2026-11-${10 + n}T08:00:00Z`,
  fetchedAt: '2026-11-20T08:00:00Z',
});

const FIXTURE = [
  entree(1, 'javascript:alert(1)'),
  entree(2, 'data:text/html,<script>alert(2)</script>'),
  entree(3, '  JaVaScRiPt:alert(3)'),
  entree(4, '/relatif/4'),
  entree(5, 'https://exemple.org/billet-5'),
];

test('LatestNews : seules les entrées au lien http(s) sont rendues', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'l76-flux-'));
  try {
    const plein = join(dir, 'plein.json');
    const vide = join(dir, 'vide.json');
    writeFileSync(plein, JSON.stringify(FIXTURE));
    writeFileSync(vide, '[]');
    const fixtureFlux = {
      name: 'l76-fixture-flux',
      enforce: 'pre',
      resolveId(id) {
        const m = /(?:^|\/)data\/feeds\/([\w-]+)\.json$/.exec(id);
        if (!m) return null;
        return m[1] === 'simon-willison' ? plein : vide;
      },
    };

    const html = await withViteSsr([fixtureFlux], async (load) => {
      const { default: LatestNews } = await load('/src/components/site/LatestNews.astro');
      const container = await AstroContainer.create();
      return container.renderToString(LatestNews);
    });

    // La fixture a bien été rendue (sinon le test ne prouverait rien).
    assert.match(html, /Titre fixture 5/);
    assert.match(html, /href="https:\/\/exemple\.org\/billet-5"/);
    assert.match(html, /1 entrées/);
    for (const n of [1, 2, 3, 4]) assert.doesNotMatch(html, new RegExp(`Titre fixture ${n}\\b`));
    assert.doesNotMatch(html, /javascript:/i);
    assert.doesNotMatch(html, /data:text/i);
    assert.doesNotMatch(html, /\/relatif\/4/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
