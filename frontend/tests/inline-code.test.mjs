// L31 — accents graves Markdown bruts dans les descriptions de cartes : rendus en <code>.
import test from 'node:test';
import assert from 'node:assert/strict';
import { inlineCodeHtml } from '../src/lib/inline-code.mjs';

test('`x` devient <code>, le reste est échappé', () => {
  assert.equal(inlineCodeHtml('a `--dry-run` b'), 'a <code data-opt>--dry-run</code> b');
  assert.equal(inlineCodeHtml('`--dangerously-skip-permissions`'), '<code>--dangerously-skip-permissions</code>');
  assert.equal(inlineCodeHtml('`npx -y ccusage --json`'), '<code>npx -y ccusage --json</code>');
  assert.equal(inlineCodeHtml('<b> & `<i>`'), '&lt;b&gt; &amp; <code>&lt;i&gt;</code>');
});
test('texte sans accent grave ou accent grave isolé : inchangé (échappé)', () => {
  assert.equal(inlineCodeHtml('rien'), 'rien');
  assert.equal(inlineCodeHtml('un ` seul'), 'un ` seul');
});
