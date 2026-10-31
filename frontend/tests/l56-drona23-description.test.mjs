// L56 — la description de la fiche drona23 ne contredit pas le badge d'étoiles.
import test from 'node:test';
import assert from 'node:assert/strict';
import { testedTools } from '../src/data/tools-tested.ts';

test('L56 — claude-token-efficient : la description cite les étoiles du badge, pas 5.4k', () => {
  const t = testedTools.find((x) => x.id === 'claude-token-efficient');
  assert.equal(t.stars, 6135);
  assert.doesNotMatch(t.description, /5\.4k/);
  assert.match(t.description, /6\.1k stars/);
});
