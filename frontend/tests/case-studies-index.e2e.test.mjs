// L47 — index des études de cas : chaque lien « ↗ GitHub » d'une carte a un href vers GitHub ;
// une app sans dépôt public (aetherwx) n'en affiche pas. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { apps } from '../src/data/apps.ts';

const html = readFileSync(join(DIST, 'case-studies', 'index.html'), 'utf8');
const cards = [...html.matchAll(/<article[\s\S]*?<\/article>/g)].map((m) => m[0]);
const githubLinks = (card) => [...card.matchAll(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*↗ GitHub(?:(?!<\/a>)[\s\S])*<\/a>/g)].map((m) => m[0]);

test('L47 R1 — tout lien « ↗ GitHub » de l’index a un href https vers github.com', () => {
  const all = cards.flatMap(githubLinks);
  assert.ok(all.length > 0, 'aucun lien GitHub trouvé : le test ne vérifie rien');
  for (const a of all) assert.match(a, /<a\b[^>]*\shref="https:\/\/github\.com\/[^"]+"/, a);
});

test('L47 R2 — la carte aetherwx (sans dépôt public) n’affiche pas de lien GitHub', () => {
  const card = cards.find((c) => c.includes('>aetherwx<'));
  assert.ok(card, 'carte aetherwx absente');
  assert.equal(githubLinks(card).length, 0);
});

test('L47 R3 — une carte affiche un lien GitHub si et seulement si son app a un repo', () => {
  for (const app of apps) {
    const card = cards.find((c) => c.includes(`>${app.name}<`));
    assert.ok(card, `carte ${app.name} absente`);
    assert.equal(githubLinks(card).length, app.repo ? 1 : 0, app.name);
  }
});
