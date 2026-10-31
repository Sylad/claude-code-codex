// L59 — suite des corrections de vérité (L55–L58). Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { theoryBulletHtml } from '../src/lib/theory-bullet.mjs';
import stats from '../src/data/rtk-stats.json' with { type: 'json' };

const brut = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const texte = (p) => brut(p).replace(/<[^>]+>/g, ' ').replace(/&nbsp;|[   ]/g, ' ').replace(/\s+/g, ' ');

test('R1 — /theory : « <project> » reste visible dans le chemin de la mémoire auto (jamais avalé comme une balise)', () => {
  assert.match(texte('theory'), /~\/\.claude\/projects\/&lt;project&gt;\/memory\/MEMORY\.md/);
  assert.doesNotMatch(brut('theory'), /projects\/<project>\/memory/);
  assert.match(brut('theory'), /projects\/&lt;project&gt;\/memory/);
});

test('R1 — theoryBulletHtml : échappe < > &, garde les `code` en <code>, bord : vide, balise seule, accent grave isolé', () => {
  assert.equal(theoryBulletHtml('a <b> & c'), 'a &lt;b&gt; &amp; c');
  assert.match(theoryBulletHtml('x `A_B` y'), /^x <code class="[^"]+">A_B<\/code> y$/);
  assert.match(theoryBulletHtml('`<p>`'), />&lt;p&gt;<\/code>$/);
  assert.equal(theoryBulletHtml(''), '');
  assert.equal(theoryBulletHtml('un ` seul'), 'un ` seul');
});

test('R2 — /case-studies : le bloc RTK parle au présent du relevé du 31 octobre (plus « passaient alors »)', () => {
  const m = brut('case-studies').match(/Preuve de collab[\s\S]*?Source : /);
  assert.ok(m, 'bloc RTK introuvable');
  const bloc = m[0].replace(/<[^>]+>/g, ' ').replace(/[  ]/g, ' ').replace(/\s+/g, ' ');
  assert.match(bloc, /Relevé du 31\/10\/2026/);
  assert.doesNotMatch(bloc, /passaient alors|de l'époque/);
  assert.match(bloc, /passent par RTK|passent par/);
});

test('R3 — le bloc RTK affiche la date du JSON, pas une autre date de la page (le test R4 de L58 passait grâce à TOOLS_SURVEYED_AT)', () => {
  assert.match(stats.lastUpdated, /^2026-10-31/);
  const bloc = brut('case-studies').match(/Relevé du [\d/]+/g);
  assert.ok(bloc && bloc.length >= 1);
  assert.ok(bloc.every((b) => b === 'Relevé du 31/10/2026'), bloc.join('|'));
  const nb = stats.summary.total_commands.toLocaleString('fr-FR').replace(/[  ]/g, ' ');
  assert.ok(texte('case-studies').includes(nb));
});

test('R4 — drona23 : plus de « push fréquent » (dernier push 2026-06-16), la date du dernier push est dite', () => {
  const t = texte('case-studies/drona23-token-efficient');
  assert.doesNotMatch(t, /push fréquent/);
  assert.match(t, /dernier push le 16 juin 2026|dernier push : 16 juin 2026/);
});

test('R5 — hermes-agent : la meta description date Sonnet 4.6 (juin 2026)', () => {
  const d = brut('case-studies/hermes-agent').match(/<meta name="description" content="([^"]*)"/)[1];
  assert.match(d, /Sonnet 4\.6 \(juin 2026\)/);
});

test('R6 — /theory : la lecture du cache cite aussi Mythos 5.1 à 0.025×', () => {
  assert.match(texte('theory'), /0\.025× pour Fable 5\.1 et Mythos 5\.1/);
});

test('R7 — skill update-rtk-stats : parle de la page Case studies, plus de la page d’accueil', () => {
  for (const f of ['SKILL.md', 'INSTRUCTIONS.md']) {
    const s = readFileSync(new URL(`../../.claude/skills/update-rtk-stats/${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(s, /homepage|page d'accueil/i, f);
    assert.match(s, /case-studies|Case studies/i, f);
  }
});
