// L78 — suite de la revue UX de /learning : résumés du fil d'actualités.
// Point 1 : le code cité dans un résumé (« Utilisez `<details><summary>` en HTML ») n'est plus effacé.
// Point 5 : un résumé resté en anglais porte lang="en" (WCAG 3.1.2), un résumé français non.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { withViteSsr } from './lib/vite-ssr.mjs';
import { stripHtml, guessLang } from '../src/lib/feed-text.mjs';

const CODE = 'Utilisez `<details><summary>` en HTML pour masquer les descriptions de PR générées par IA.';
const ANGLAIS = "We're introducing a new life sciences research group and laboratory at Anthropic. Our focus is on the future of science.";
const FRANCAIS = 'Les agents de codage transforment la profession : gain de productivité pour qui aime construire.';

test('stripHtml garde le code cité entre accents graves', () => {
  assert.equal(stripHtml(CODE), CODE);
  assert.equal(stripHtml('Avant `a <b> c` après'), 'Avant `a <b> c` après');
});

test('stripHtml retire les vraies balises du flux et décode les entités', () => {
  assert.equal(stripHtml('<p>Bonjour <a href="https://x.org">monde</a></p>'), 'Bonjour monde');
  assert.equal(stripHtml('<p>Le &lt;details&gt; &amp; co</p>'), 'Le <details> & co');
  assert.equal(stripHtml('<p>Tag <code>&lt;details&gt;</code> ici</p>'), 'Tag `<details>` ici');
  assert.equal(stripHtml('Fin coupée Google <a hre'), 'Fin coupée Google');
  assert.equal(stripHtml('<p>Release</p> <blockquote> <'), 'Release');
  assert.equal(stripHtml('a < b et <3'), 'a < b et <3');
  assert.equal(stripHtml('<!-- note --><p>x</p>'), 'x');
});

test('guessLang : anglais reconnu, français et code cité non', () => {
  assert.equal(guessLang(ANGLAIS), 'en');
  assert.equal(guessLang('Tool: Shadow roots, explained with live examples'), 'en');
  assert.equal(guessLang(FRANCAIS), 'fr');
  assert.equal(guessLang(CODE), 'fr');
  assert.equal(guessLang('ttok 0.4 : CLI pour compter les tokens'), 'fr');
  assert.equal(guessLang(''), 'fr');
});

const entree = (n, summary) => ({
  id: `fixture-${n}`, source: 'anthropic-news', url: `https://exemple.org/${n}`,
  title: `Titre fixture ${n}`, summary, publishedAt: `2026-11-${10 + n}T08:00:00Z`, fetchedAt: '2026-11-20T08:00:00Z',
});

test('LatestNews : code cité rendu en <code>, résumé anglais en lang="en"', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'l78-flux-'));
  try {
    const plein = join(dir, 'plein.json');
    const vide = join(dir, 'vide.json');
    writeFileSync(plein, JSON.stringify([entree(1, CODE), entree(2, ANGLAIS), entree(3, `<p>${FRANCAIS}</p>`)]));
    writeFileSync(vide, '[]');
    const fixture = {
      name: 'l78-fixture-flux', enforce: 'pre',
      resolveId(id) {
        const m = /(?:^|\/)data\/feeds\/([\w-]+)\.json$/.exec(id);
        if (!m) return null;
        return m[1] === 'anthropic-news' ? plein : vide;
      },
    };
    const html = await withViteSsr([fixture], async (load) => {
      const { default: LatestNews } = await load('/src/components/site/LatestNews.astro');
      return (await AstroContainer.create()).renderToString(LatestNews);
    });
    const resume = (n) => html.split('<li').find((c) => c.includes(`Titre fixture ${n}`))?.match(/<p[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';

    assert.match(resume(1), /Utilisez <code>&lt;details&gt;&lt;summary&gt;<\/code> en HTML/);
    assert.doesNotMatch(resume(1), /lang="en"/);
    assert.match(resume(2), /^<p[^>]*lang="en"/);
    assert.match(resume(2), /introducing a new life sciences/);
    assert.doesNotMatch(resume(3), /lang="en"/);
    assert.match(resume(3), /Les agents de codage/);
    assert.doesNotMatch(resume(3), /&lt;p&gt;/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
