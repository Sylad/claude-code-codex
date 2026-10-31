// L58 — corrections de vérité de /theory, /start et /learning (docs/verite-site.md, « Corrections à faire, par page »).
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import stats from '../src/data/rtk-stats.json' with { type: 'json' };

const texte = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8')
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;|[\u00a0\u202f\u2009]/g, ' ').replace(/\s+/g, ' ');

test('R1 — /theory : minimums de cache Opus 4.7 = 2048 et Sonnet 4.6 = 1024 (plus 4096 pour Opus 4.7)', () => {
  const t = texte('theory');
  assert.match(t, /2048 tokens pour Opus 4\.7/);
  assert.match(t, /1024 pour Sonnet 4\.6/);
  assert.match(t, /4096 pour Opus 4\.6\/4\.5 et Haiku 4\.5/);
  assert.doesNotMatch(t, /4096 tokens pour Opus 4\.7/);
  assert.doesNotMatch(t, /2048 pour Sonnet 4\.6/);
});

test('R2 — /theory : les sous-agents peuvent s’imbriquer jusqu’à 3 niveaux (CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH)', () => {
  const t = texte('theory');
  assert.doesNotMatch(t, /ne peuvent pas spawner/);
  assert.match(t, /jusqu'à 3 niveaux/);
  assert.match(t, /CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH/);
});

test('R3 — /theory : lecture de cache 0.05× (Opus 5.5, Sonnet 5.5) et 0.025× (Fable 5.1), plus de « SDK ≥ v0.2.111 »', () => {
  const t = texte('theory');
  assert.match(t, /0\.05× pour Opus 5\.5 et Sonnet 5\.5/);
  assert.match(t, /0\.025× pour Fable 5\.1/);
  assert.doesNotMatch(t, /0\.2\.111/);
});

test('R4 — statistiques RTK (bloc affiché par /case-studies, pas par /start) relevées le 2026-10-31, affichées telles que dans le JSON', () => {
  assert.ok(stats.summary.total_commands > 100000, 'plus les 1 546 commandes de mai');
  assert.match(stats.lastUpdated, /^2026-10-31/);
  const t = texte('case-studies');
  assert.ok(t.includes(stats.summary.total_commands.toLocaleString('fr-FR').replace(/[\u00a0\u202f]/g, ' ')));
  assert.match(t, /31 octobre 2026/);
  assert.doesNotMatch(t, /1 546/);
});

test('R5 — /learning : plus de règle de retrait des sources non appliquée', () => {
  const t = texte('learning');
  assert.doesNotMatch(t, /retirera/);
  assert.doesNotMatch(t, /6\+ mois/);
  assert.match(t, /à jour/);
});
