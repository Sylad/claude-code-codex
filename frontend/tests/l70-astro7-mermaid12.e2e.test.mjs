// L70 — passage à Astro 7 et mermaid 12, lu dans le site CONSTRUIT (lancer `npx astro build` avant).
// Trois régressions mesurées pendant la montée, chacune gardée ici :
//  - Astro 7 passe compressHTML à 'jsx' : les espaces entre éléments inline disparaissaient
//    (« avecClaude Code », « Dépôt décrit :maritime-atlas ») sur 38 pages sur 40 ;
//  - mermaid 12 change trois défauts (mise en page ELK, aspect « neo », wrappingWidth 120) :
//    tous les schémas étaient redessinés autrement ;
//  - un schéma (jobmail-assistant) ne se dessinait plus du tout, sans qu'aucun test ne le voie.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const read = (rel) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

// Pages du site construit qui portent au moins un schéma Mermaid.
function mermaidPages() {
  const out = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === 'index.html') {
        const n = (readFileSync(p, 'utf8').match(/data-mermaid-inline/g) ?? []).length;
        if (n) out.push({ path: '/' + relative(DIST, p).replace(/index\.html$/, ''), n });
      }
    }
  };
  if (existsSync(DIST)) walk(DIST);
  return out;
}

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

test('mermaid : chaque schéma de chaque page se dessine, sans erreur', async (t) => {
  const pages = mermaidPages();
  const env = await setupBrowser(t);
  if (!env) return;
  assert.ok(pages.length >= 10, `seulement ${pages.length} pages à schéma trouvées dans dist`);
  const ctx = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  for (const { path, n } of pages) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().split('\n')[0]); });
    page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
    await page.goto(env.base + path, { waitUntil: 'load' });
    // client:visible : faire défiler chaque schéma jusqu'à l'écran pour l'hydrater
    const figs = page.locator('figure:has([data-mermaid-inline])');
    for (let i = 0; i < n; i++) await figs.nth(i).scrollIntoViewIfNeeded();
    const done = await page.waitForFunction((count) => {
      const f = [...document.querySelectorAll('figure')].filter((x) => x.querySelector('[data-mermaid-inline]'));
      const settled = f.filter((x) => x.querySelector('[data-mermaid-inline] svg') || x.textContent.includes('render failed'));
      return f.length === count && settled.length === count;
    }, n, { timeout: 20000 }).then(() => true, () => false);
    const r = await page.evaluate(() => [...document.querySelectorAll('figure')]
      .filter((x) => x.querySelector('[data-mermaid-inline]'))
      .map((x) => ({ svg: !!x.querySelector('[data-mermaid-inline] svg'), failed: x.textContent.includes('render failed') })));
    assert.ok(done, `${path} : schémas non dessinés dans le délai`);
    assert.equal(r.filter((x) => x.svg).length, n, `${path} : ${r.filter((x) => !x.svg).length} schéma(s) non dessiné(s)`);
    assert.equal(r.filter((x) => x.failed).length, 0, `${path} : rendu Mermaid en échec`);
    assert.deepEqual(errors, [], `${path} : erreurs console`);
    await page.close();
  }
});
