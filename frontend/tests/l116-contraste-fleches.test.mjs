// L116 (WCAG 1.4.11) — schémas : en thème sombre, les flèches (trait .sch-line et pointe .sch-arrow) atteignent
// au moins 3:1 sur le fond du cadre ET sur la boîte qu'elles touchent ; #6b6b78 sur #26262c ne donnait que 2,86:1.
// Calculé d'après les jetons --sch-* de Schema.astro (bloc sombre par défaut, bloc prefers-color-scheme: light).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contraste } from './lib/contraste.mjs';

const SRC = readFileSync(new URL('../src/components/site/Schema.astro', import.meta.url), 'utf8');
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Jetons --sch-* (hex) du premier bloc `.schema {` après `debut`. */
function jetonsSch(debut) {
  const i = SRC.indexOf('.schema {', SRC.indexOf(debut));
  const bloc = SRC.slice(i, SRC.indexOf('}', i));
  return Object.fromEntries([...bloc.matchAll(/--(sch-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, n, v]) => [n, v.toLowerCase()]));
}
const sombre = jetonsSch('<style');
const clair = jetonsSch('@media (prefers-color-scheme: light)');

test('L116 — thème sombre : flèches ≥ 3:1 sur le fond et sur les boîtes', () => {
  assert.ok(sombre['sch-fleche'], 'jeton --sch-fleche absent du thème sombre');
  for (const fond of ['sch-bg', 'sch-box']) {
    const r = contraste(hex(sombre['sch-fleche']), hex(sombre[fond]));
    assert.ok(r >= 3, `flèche ${sombre['sch-fleche']} sur --${fond} ${sombre[fond]} : ${r.toFixed(2)}:1`);
  }
});

test('L116 — thème clair inchangé : la flèche garde la couleur des traits (#7a7a86)', () => {
  assert.equal(clair['sch-fleche'], '#7a7a86');
  assert.equal(clair['sch-line'], '#7a7a86');
  for (const fond of ['sch-bg', 'sch-box']) assert.ok(contraste(hex(clair['sch-fleche']), hex(clair[fond])) >= 3);
});

test('L116 — trait et pointe des schémas lisent le jeton des flèches', () => {
  assert.match(SRC, /\.schema \.sch-line \{[^}]*stroke: var\(--sch-fleche\)/);
  assert.match(SRC, /\.schema \.sch-arrow \{[^}]*fill: var\(--sch-fleche\)/);
});

test('L116 — flèches de la liste HTML (.sch-suite) : trait et pointe lisent le jeton des flèches', () => {
  // trait (::before, background) et pointe (::after, border-top-color) entre deux étapes
  assert.match(SRC, /\.schema \.sch-suite > \.sch-etape:not\(:last-child\)::before \{[^}]*background: var\(--sch-fleche\)/);
  assert.match(SRC, /\.schema \.sch-suite > \.sch-etape:not\(:last-child\)::after \{[^}]*border-top-color: var\(--sch-fleche\)/);
});
