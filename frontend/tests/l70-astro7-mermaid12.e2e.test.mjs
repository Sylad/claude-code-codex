// L70 — passage à Astro 7 et mermaid 12, lu dans le site CONSTRUIT (lancer `npx astro build` avant).
// Trois régressions mesurées pendant la montée, chacune gardée ici :
//  - Astro 7 passe compressHTML à 'jsx' : les espaces entre éléments inline disparaissaient
//    (« avecClaude Code », « Dépôt décrit :maritime-atlas ») sur 38 pages sur 40 ;
//  - mermaid 12 change trois défauts (mise en page ELK, aspect « neo », wrappingWidth 120) :
//    tous les schémas étaient redessinés autrement ;
//  - un schéma (jobmail-assistant) ne se dessinait plus du tout, sans qu'aucun test ne le voie :
//    le rendu de tous les schémas de toutes les pages est gardé par tests/l66-mermaid-rendu.e2e.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setupBrowser } from './lib/e2e-dist.mjs';

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

test('Astro 7 : compressHTML reste à true (le défaut « jsx » colle les mots entre éléments inline)', () => {
  assert.match(read('astro.config.mjs'), /compressHTML:\s*true/);
});

test('Astro 7 : les espaces entre éléments inline sont conservés dans le texte lu', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const ctx = await env.browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  const cases = [
    ['/', 'builder avec Claude Code'],
    ['/', 'vibe coded with Claude Code'],
    ['/case-studies/maritime-atlas/', 'Dépôt décrit : maritime-atlas'],
    ['/about/', 'Claude Code les 8 applications'],
  ];
  for (const [path, expected] of cases) {
    await page.goto(env.base + path, { waitUntil: 'load' });
    const text = (await page.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ');
    assert.ok(text.includes(expected), `${path} : « ${expected} » absent du texte lu`);
  }
  // Une entité dans un attribut de composant n'est plus décodée par le compilateur d'Astro 7.
  await page.goto(env.base + '/case-studies/maritime-atlas/', { waitUntil: 'load' });
  const html = await page.content();
  assert.doesNotMatch(html, /&amp;(quot|amp|lt|gt|#\d+);/, 'entité HTML échappée deux fois');
});

test('mermaid 12 : le rendu garde dagre, l’aspect classic et le repli à 200 px', () => {
  const src = read('src/components/site/MermaidDiagram.vue');
  assert.match(src, /layout:\s*"dagre"/);
  assert.match(src, /look:\s*"classic"/);
  assert.match(src, /wrappingWidth:\s*200/);
});
