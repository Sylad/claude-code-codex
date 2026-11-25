// L99 — la garde des sources de L95/L98 relève aussi le raccourci `font: Npx`, l'attribut SVG `font-size="N"`
// et `fontSize={N}` sous 12 px (suite de la revue de code de L98). Un test par forme ; les formes de L98 restent
// relevées, et ce qui ne fixe pas une petite taille en px ne l'est pas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { petitesPolices } from './lib/petites-polices.mjs';

// Textes que la garde doit relever (une occurrence chacun) mais ne relève pas, et l'inverse.
const nonReleves = (textes) => textes.filter((t) => petitesPolices(t).length !== 1);
const relevesATort = (textes) => textes.filter((t) => petitesPolices(t).length > 0);

test('raccourci CSS font: <N>px sous 12 px', () => {
  assert.deepEqual(nonReleves([
    '.a { font: 10px sans-serif; }',
    '.a { font: 600 11px/1 var(--font-sans, system-ui, sans-serif); }',
    '.a { font: italic small-caps bold 9.5px/14px Georgia, serif; }',
    '.a{font:11px/1.2 a}',
    "ctx.font = '10px system-ui';",
    'const s = { font: "bold 10px serif" };',
  ]), []);
});

test('raccourci font: ni 12 px et plus, ni autre unité, ni interligne en px', () => {
  assert.deepEqual(relevesATort([
    '.a { font: 600 15px/1 var(--font-sans); }',
    '.a { font: 12px sans-serif; }',
    '.a { font: 0.625rem/10px sans-serif; }',
    '.a { font: inherit; }',
    '.a { font: 0/0 a; }',
    '.a { font-family: x; }',
  ]), []);
});

test("attribut SVG font-size=\"N\" sous 12 px (sans unité ou en px)", () => {
  assert.deepEqual(nonReleves([
    '<text x="4" y="9" font-size="10">Source</text>',
    "<text font-size='11px'>a</text>",
    '<tspan font-size = "8.5">b</tspan>',
    '<text :font-size="10">c</text>',
  ]), []);
  assert.deepEqual(relevesATort([
    '<text font-size="12">a</text>',
    '<text font-size="0.625rem">a</text>',
    '<text font-size="80%">a</text>',
    '<text font-size="0">a</text>',
  ]), []);
});

test('attribut fontSize={N} sous 12 px', () => {
  assert.deepEqual(nonReleves([
    '<Label fontSize={10} />',
    '<Label fontSize={ 11 } />',
    '<Label fontSize={"10px"} />',
    '<Label font-size={`9px`} />',
  ]), []);
  assert.deepEqual(relevesATort([
    '<Label fontSize={13} />',
    '<Label fontSize={"0.75rem"} />',
    '<Label fontSize={taille} />',
  ]), []);
});

test('formes de L98 toujours relevées : text-[Npx], font-size: N[px], fontSize: N', () => {
  assert.deepEqual(nonReleves([
    '<span class="text-[10px]">a</span>',
    '.a { font-size: 11px; }',
    'const o = { fontSize: 10 };',
    'const o = { "font-size": "9px" };',
  ]), []);
  assert.deepEqual(relevesATort([
    '<span class="text-[0.625rem]">a</span>',
    '.a { font-size: 0; }',
    'const o = { fontSize: 13 };',
  ]), []);
});

test('chaque occurrence est relevée une fois, avec sa position', () => {
  assert.deepEqual(petitesPolices('.a{font:10px a}\n<text font-size="9">x</text>'), [
    '@3 font:10px a',
    '@22 font-size="9"',
  ]);
});
