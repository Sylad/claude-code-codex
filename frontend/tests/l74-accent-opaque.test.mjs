// L74 (revue r1) — le texte en couleur accent ne s'éclaircit pas par transparence : `text-claude/70`,
// `/80`… mesuraient 3,0 à 4,3:1 (fond fixe comme cartes opaques), sous les 4,5:1 de WCAG 1.4.3.
// Garde statique : aucune classe de texte accent avec alpha dans les sources (les états hover:,
// focus:… restent permis, ils renforcent l'accent). Le contraste réel est mesuré par
// l74-contraste-accent.e2e.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

test('L74 — aucun texte accent semi-transparent (text-claude/NN) dans les sources', () => {
  const hits = [];
  for (const f of walk(SRC).filter((f) => /\.(astro|vue|ts|tsx|mjs|js)$/.test(f))) {
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/(^|[\s"'`])((?:[a-z-]+:)*)text-claude(?:-soft)?\/[\w.[\]]+/g)) {
        if (/(hover|focus|focus-visible|active|group-hover):$/.test(m[2])) continue;
        hits.push(`${relative(SRC, f)}:${i + 1} ${m[0].trim()}`);
      }
    });
  }
  assert.deepEqual(hits, []);
});
