// L78 (suite de revue) — fil d'actualités de /learning.
// (1) Un accent grave servant d'apostrophe (« We`re … it`s ») n'ouvre pas un code cité : un code cité
//     s'ouvre et se ferme sur une PAIRE d'accents graves qui encadre un mot sans lettre collée de part et
//     d'autre ; un accent grave seul ou collé entre deux lettres reste du texte.
// (3) Rendu de LatestNews sur un résumé hostile (balises, script, attributs on*, accent grave orphelin) :
//     rien ne s'injecte, seules les balises <code> et <span data-opt> du code cité apparaissent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { inlineCodeHtml } from '../src/lib/inline-code.mjs';
import { stripHtml } from '../src/lib/feed-text.mjs';
import { entree, renderLatestNews, resumeDe, HOSTILES } from './lib/latest-news-fixture.mjs';

const APOSTROPHES = 'We`re shipping Claude for Chrome to all Max users and it`s available today.';
const rendu = (s) => inlineCodeHtml(stripHtml(s));

test('(1) accent grave entre deux lettres : du texte, pas un code cité', () => {
  assert.equal(rendu(APOSTROPHES), APOSTROPHES);
  assert.equal(rendu('We`re here, it`s `npx foo` now'), 'We`re here, it`s <code>npx foo</code> now');
  assert.equal(rendu("l`agent et l`outil"), "l`agent et l`outil");
});

test('(1) paire d\'accents graves autour d\'un mot, sans lettre collée dehors : code cité', () => {
  assert.equal(rendu('Utilisez `<details>` en HTML'), 'Utilisez <code>&lt;details&gt;</code> en HTML');
  assert.equal(rendu('(`x`), puis `y`.'), '(<code>x</code>), puis <code>y</code>.');
  assert.equal(rendu('`claude --resume`'), '<code>claude <span data-opt>--resume</span></code>');
});

test('(1) lettre collée à une borne, espace intérieure, accent seul : texte', () => {
  for (const s of ['a`x` b', 'a `x`s b', 'a ` x` b', 'a `x ` b', 'un ` seul', 'fin coupée `npx …', '``']) {
    assert.equal(rendu(s), s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'), s);
  }
});

test('(1) <code> du flux collé à une lettre : reste un code cité', () => {
  assert.equal(stripHtml('<p>le fichier<code>CLAUDE.md</code>est lu</p>'), 'le fichier `CLAUDE.md` est lu');
  assert.equal(stripHtml('<p>Lancez <code> npx x </code>, puis</p>'), 'Lancez `npx x`, puis');
});

const etrangeres = (p) =>
  (p.match(/<[^>]*>/g) ?? []).filter((b) => !/^<p(?:\s[^>]*)?>$|^<\/p>$|^<\/?code>$|^<span data-opt>$|^<\/span>$/.test(b));

test('(3) LatestNews sur un résumé hostile : aucune balise ni attribut injecté', async () => {
  const html = await renderLatestNews(HOSTILES.map((h, i) => entree(i + 1, h)));
  const p = [1, 2, 3, 4].map((n) => resumeDe(html, n));
  for (const [i, r] of p.entries()) {
    assert.ok(r, `résumé ${i + 1} rendu`);
    // Seules balises dans le <p> : lui-même, <code>, <span data-opt> et leurs fermetures.
    assert.deepEqual(etrangeres(r), [], `résumé ${i + 1}`);
    assert.doesNotMatch(r.replace(/^<p[^>]*>/, ''), /<[a-z][^>]*\son\w+=/i);
  }
  assert.match(p[0], />Avant window.__pwn=1 après<\/p>/);
  // Le texte hostile ressort échappé, visible comme texte.
  assert.match(p[1], /&lt;img src=x onerror=window.__pwn=3&gt; <code>&lt;script&gt;window.__pwn=4&lt;\/script&gt;<\/code>/);
  assert.match(p[3], /<code>&lt;svg onload=window.__pwn=6&gt;<\/code> et &lt;iframe srcdoc=x&gt; fin/);
  // Les accents graves orphelins (apostrophes) restent du texte : pas de code « re lien it ».
  assert.match(p[2], />We`re lien it`s<\/p>/);
});
