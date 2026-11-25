// L23 — PageHero est la seule source de l'en-tête de page : Nouveautés et Plan de travail
// en avaient chacune une copie (dérive vécue en L16 : le sur-titre du plan sans pastille).
// Le test lit les sources (aucune nouvelle copie du gabarit) et le site construit (les
// sélecteurs news-* / plan-* visés par les tests et les styles de ces pages sont toujours là).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST } from './lib/e2e-dist.mjs';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const rel = (f) => relative(SRC, f).split(sep).join('/');

// Copies encore en place, chacune avec sa raison ; la liste ne doit que diminuer.
// livre-de-bord (L44, venu après le lot) : son chapeau n'a pas l'ombre de PageHero, le
// passer sur le composant changerait son rendu — c'est un lot à part, revu à l'écran.
const COPIES_CONNUES = ['pages/livre-de-bord.astro'];

test("aucune page ne recopie le gabarit de l'en-tête (section codex-grid + h1) hors PageHero", () => {
  const copies = walk(SRC)
    .filter((f) => f.endsWith('.astro') && !f.endsWith('PageHero.astro'))
    .filter((f) => {
      const s = readFileSync(f, 'utf8');
      return /<section[^>]*\bcodex-grid\b[\s\S]*?<h1\b/.test(s);
    })
    .map(rel);
  assert.deepEqual(copies.sort(), COPIES_CONNUES);
});

for (const [page, prefix] of [['nouveautes', 'news'], ['plan-de-travail', 'plan']]) {
  test(`/${page}/ : en-tête rendu par PageHero, sélecteurs ${prefix}-* conservés`, () => {
    const src = readFileSync(join(SRC, 'pages', `${page}.astro`), 'utf8');
    assert.match(src, /<PageHero\b/, `${page}.astro n'utilise pas PageHero`);
    assert.doesNotMatch(src, /<h1\b/, `${page}.astro écrit encore son propre <h1>`);

    const html = join(DIST, page, 'index.html');
    assert.ok(existsSync(html), `${html} absent : lancer astro build`);
    const out = readFileSync(html, 'utf8');
    const hero = out.match(new RegExp(`<section class="${prefix}-hero [^"]*"[^>]*>([\\s\\S]*?)</section>`));
    assert.ok(hero, `section .${prefix}-hero absente`);
    assert.match(hero[1], new RegExp(`<p class="${prefix}-eyebrow `), `.${prefix}-eyebrow absent`);
    assert.match(hero[1], new RegExp(`<p class="${prefix}-lede `), `.${prefix}-lede absent`);
    // Titre de PageHero en taille `text` (L88, WCAG 1.4.4 / F94) : jamais plafonné en vw.
    assert.match(hero[1], /<h1 class="mt-3 text-4xl sm:text-5xl [^"]*"/, 'h1 sans la taille `text` de PageHero');
    assert.doesNotMatch(hero[1], /<h1 class="[^"]*vw/, 'h1 plafonné par la largeur');
  });
}
