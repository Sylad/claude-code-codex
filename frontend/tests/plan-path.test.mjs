// L40 — le plan vit dans .cadence/raf.yaml ; aucun lecteur ne doit viser l'ancien emplacement
// (docs/plan/raf.yaml), écrit d'un bloc ou construit segment par segment.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const SELF = 'frontend/tests/plan-path.test.mjs';
const OLD = ['docs', 'plan', 'raf.yaml'].join('/');
const SKIP = new Set(['node_modules', 'dist', '.git', '.astro', 'tmp']);

function* files(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* files(p);
    else if (/\.(astro|ts|mjs|js|md|ya?ml|json)$/.test(name)) yield p;
  }
}

test('L40 — le plan est à .cadence/raf.yaml et plus à docs/plan/raf.yaml', () => {
  assert.ok(existsSync(join(root, '.cadence', 'raf.yaml')));
  assert.ok(!existsSync(join(root, OLD)));
});

test('L40 — aucun lecteur ne vise l’ancien chemin (écrit ou construit à la main)', () => {
  const offenders = [];
  for (const f of files(root)) {
    const rel = relative(root, f);
    if (rel === SELF || rel.startsWith('.cadence/')) continue;
    const text = readFileSync(f, 'utf8');
    if (/docs\/plan/.test(text) || /["']docs["']\s*,\s*["']plan["']/.test(text)) offenders.push(rel);
  }
  assert.deepEqual(offenders, []);
});
