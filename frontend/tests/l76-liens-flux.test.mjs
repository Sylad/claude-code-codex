// L76 — liens du fil d'actualités : seules les URL absolues http(s) sont gardées.
import test from 'node:test';
import assert from 'node:assert/strict';
import { safeHttpUrl } from '../src/lib/safe-url.mjs';

test('safeHttpUrl : refuse les protocoles autres que http(s)', () => {
  for (const bad of [
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'JaVaScRiPt:alert(1)',
    '   javascript:alert(1)',
    '\n\tjavascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'DATA:text/html;base64,PHNjcmlwdD4=',
    'vbscript:msgbox(1)',
    ' VBScript:msgbox(1)',
    'file:///etc/passwd',
    'ftp://exemple.com/x',
    'mailto:a@exemple.com',
  ]) {
    assert.equal(safeHttpUrl(bad), null, bad);
  }
});

test('safeHttpUrl : refuse les URL relatives, vides ou illisibles', () => {
  for (const bad of ['/blog/x', 'blog/x', '//exemple.com/x', '?q=1', '#x', '', '   ', 'http://', undefined, null, 42]) {
    assert.equal(safeHttpUrl(bad), null, String(bad));
  }
});

test('safeHttpUrl : garde http et https, espaces autour retirés', () => {
  assert.equal(safeHttpUrl('https://simonwillison.net/2026/Nov/1/x/'), 'https://simonwillison.net/2026/Nov/1/x/');
  assert.equal(safeHttpUrl('  https://www.anthropic.com/news/x  '), 'https://www.anthropic.com/news/x');
  assert.equal(safeHttpUrl('HTTP://Exemple.com/a?b=1'), 'http://exemple.com/a?b=1');
});
