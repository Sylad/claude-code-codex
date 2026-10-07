// L31 — accents graves Markdown bruts dans les descriptions de cartes : rendus en <code>.
import test from 'node:test';
import assert from 'node:assert/strict';
import { inlineCodeHtml } from '../src/lib/inline-code.mjs';

test('`x` devient <code>, le reste est échappé', () => {
  assert.equal(inlineCodeHtml('a `--dry-run` b'), 'a <code><span data-opt>--dry-run</span></code> b');
  assert.equal(inlineCodeHtml('`--dangerously-skip-permissions`'), '<code><span data-opt>--dangerously-skip-permissions</span></code>');
  assert.equal(inlineCodeHtml('`npx -y ccusage --json`'), '<code>npx <span data-opt>-y</span> ccusage <span data-opt>--json</span></code>');
  assert.equal(inlineCodeHtml('<b> & `<i>`'), '&lt;b&gt; &amp; <code>&lt;i&gt;</code>');
});
test('texte sans accent grave ou accent grave isolé : inchangé (échappé)', () => {
  assert.equal(inlineCodeHtml('rien'), 'rien');
  assert.equal(inlineCodeHtml('un ` seul'), 'un ` seul');
});
test('option dans un code de plusieurs mots : d\'un seul tenant ; mot à trait d\'union simple : non', () => {
  assert.equal(inlineCodeHtml('`cp -r a b`'), '<code>cp <span data-opt>-r</span> a b</code>');
  assert.equal(inlineCodeHtml('`foo-bar`'), '<code>foo-bar</code>');
});
