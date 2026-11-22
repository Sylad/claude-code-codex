// L66 — chaque schéma Mermaid du site se dessine, lu dans le site CONSTRUIT (lancer `npx astro build` avant).
// Vécu : QA de L38 (03-11), l'étude jobmail-assistant affichait « Parse error on line 32 » à la place
// du schéma d'architecture (libellé d'arête `messages.delete(deletePermanently=false)` sans guillemets).
// En échec, mermaid laisse aussi hors de la figure, en bas de page, un svg « Syntax error in text » :
// on lit donc le texte de TOUTE la page, pas seulement celui des figures.
// Repris et élargi du test L70 « chaque schéma de chaque page se dessine ».
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
// Messages exacts de mermaid et du composant (« syntax error at or near » de Postgres, cité en prose, n'en est pas un).
const ERREURS = /Parse error on line|Lexical error on line|Syntax error in text|render failed/;

function walk(dir, keep, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, keep, out);
    else if (keep(e.name)) out.push(p);
  }
  return out;
}

// Toutes les pages construites, avec le nombre de schémas Mermaid qu'elles portent.
function pagesConstruites() {
  return walk(DIST, (n) => n === 'index.html').map((p) => ({
    path: '/' + relative(DIST, p).replace(/index\.html$/, ''),
    n: (readFileSync(p, 'utf8').match(/data-mermaid-inline/g) ?? []).length,
  }));
}

test('chaque <MermaidDiagram> des sources arrive dans le site construit', () => {
  const sources = walk(SRC, (n) => /\.(astro|vue|mdx?)$/.test(n) && n !== 'MermaidDiagram.vue');
  const attendus = sources.reduce((s, f) => s + (readFileSync(f, 'utf8').match(/<MermaidDiagram\b/g) ?? []).length, 0);
  const construits = pagesConstruites().reduce((s, p) => s + p.n, 0);
  assert.ok(attendus >= 15, `seulement ${attendus} schémas dans les sources`);
  assert.equal(construits, attendus, 'schémas des sources absents du site construit (rendu côté client seulement ?)');
});

test('toutes les pages construites : chaque schéma Mermaid a son svg, aucune erreur de rendu', async (t) => {
  const pages = pagesConstruites();
  const env = await setupBrowser(t);
  if (!env) return;
  assert.ok(pages.length >= 30, `seulement ${pages.length} pages dans dist`);
  assert.ok(pages.filter((p) => p.n).length >= 10, 'moins de 10 pages à schéma dans dist');
  const ctx = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const echecs = [];
  for (const { path, n } of pages) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().split('\n')[0]); });
    page.on('pageerror', (e) => errors.push(String(e).split('\n')[0]));
    await page.goto(env.base + path, { waitUntil: 'load' });
    if (n) {
      // client:visible : faire défiler chaque schéma jusqu'à l'écran pour l'hydrater.
      const figs = page.locator('figure:has([data-mermaid-inline])');
      for (let i = 0; i < n; i++) await figs.nth(i).scrollIntoViewIfNeeded();
      await page.waitForFunction((count) => {
        const f = [...document.querySelectorAll('figure')].filter((x) => x.querySelector('[data-mermaid-inline]'));
        const settled = f.filter((x) => x.querySelector('[data-mermaid-inline] svg') || x.textContent.includes('render failed'));
        return f.length === count && settled.length === count;
      }, n, { timeout: 20000 }).catch(() => {});
    }
    const r = await page.evaluate((re) => {
      const f = [...document.querySelectorAll('figure')].filter((x) => x.querySelector('[data-mermaid-inline]'));
      // textContent : comprend le texte des svg (bombe « Syntax error in text » laissée par mermaid).
      const texte = document.body.textContent.replace(/\s+/g, ' ');
      const m = texte.match(new RegExp(`.{0,40}(${re}).{0,60}`));
      return { dessines: f.filter((x) => x.querySelector('[data-mermaid-inline] svg')).length, erreur: m?.[0] ?? null };
    }, ERREURS.source);
    if (r.dessines !== n) echecs.push(`${path} : ${n - r.dessines} schéma(s) sur ${n} sans svg`);
    if (r.erreur) echecs.push(`${path} : « ${r.erreur.trim()} »`);
    if (n && errors.length) echecs.push(`${path} : erreurs console ${JSON.stringify(errors)}`);
    await page.close();
  }
  assert.deepEqual(echecs, []);
});
