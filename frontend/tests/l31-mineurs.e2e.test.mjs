// L31 — mineurs de la revue UX L27, lus dans le site CONSTRUIT (lancer `npx astro build` avant).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const page = (rel) => {
  const f = join(DIST, rel, 'index.html');
  assert.ok(existsSync(f), `${rel} absent : lancer \`npx astro build\``);
  return readFileSync(f, 'utf8');
};
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') ? [p] : [];
});

test('index des études de cas : plus d’accent grave Markdown brut dans les cartes', () => {
  const html = page('case-studies');
  const cartes = [...html.matchAll(/<p class="text-sm text-ink-muted leading-relaxed flex-1[^>]*>([\s\S]*?)<\/p>/g)];
  assert.ok(cartes.length > 5, 'cartes introuvables');
  for (const [, texte] of cartes) assert.ok(!texte.includes('`'), `accent grave brut : ${texte.slice(0, 80)}`);
  assert.match(html, /<code>--dry-run<\/code>/);
});

// (4) tout bloc qui défile au clavier : tabindex=0 + role=region + nom accessible
test('blocs défilants (pre, overflow-x-auto) : tabindex=0, role=region, aria-label', () => {
  const fautifs = [];
  for (const f of walk(DIST)) {
    const html = readFileSync(f, 'utf8').replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
    for (const m of html.matchAll(/<(pre|div|figure)\b[^>]*\boverflow-x-auto\b[^>]*>/g)) {
      const tag = m[0];
      if (!/tabindex="0"/.test(tag) || !/role="region"/.test(tag) || !/aria-label="[^"]+"/.test(tag)) {
        fautifs.push(`${f.replace(DIST, '')} ${tag.slice(0, 90)}`);
      }
    }
  }
  assert.deepEqual(fautifs, []);
});

// (3) cadre ou ombre de bord sur les tableaux qui défilent
test('aetherwx-encyclopedia : les tableaux qui défilent ont un cadre', () => {
  const html = page('case-studies/aetherwx-encyclopedia');
  const zones = [...html.matchAll(/<div\b[^>]*\boverflow-x-auto\b[^>]*>(?=\s*<table)/g)].map((m) => m[0]);
  assert.ok(zones.length >= 2);
  for (const z of zones) assert.match(z, /\bborder\b/, z);
});

// (2) hermes-agent : tableau lisible à 320 px
test('hermes-agent : tableau lisible à 320 px (padding réduit, 1re colonne figée)', async (t) => {
  const html = page('case-studies/hermes-agent');
  assert.match(html, /<div class="rounded-xl border border-white\/10 bg-paper-elevated p-3 sm:p-6"/);
  assert.match(html, /<td class="[^"]*\bsticky\b[^"]*\bleft-0\b/);
  const env = await setupBrowser(t);
  if (!env) return;
  const ctx = await env.browser.newContext({ viewport: { width: 320, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(`${env.base}/case-studies/hermes-agent/`);
  const r = await p.evaluate(() => {
    const t = document.querySelector('table');
    const box = t.closest('.overflow-x-auto');
    const first = t.querySelector('tbody td');
    box.scrollLeft = 200;
    const b = first.getBoundingClientRect(), c = box.getBoundingClientRect();
    return { page: document.documentElement.scrollWidth, viewport: innerWidth, firstLeft: Math.round(b.left - c.left), scrolled: box.scrollLeft };
  });
  assert.ok(r.page <= r.viewport, `la page déborde : ${r.page} > ${r.viewport}`);
  assert.ok(r.scrolled > 0, 'le tableau devrait défiler à 320 px');
  assert.ok(Math.abs(r.firstLeft) <= 1, `1re colonne non figée (décalage ${r.firstLeft})`);
  await ctx.close();
});
