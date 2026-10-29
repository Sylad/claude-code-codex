// L3 — revue UX de /start, lue dans le site CONSTRUIT (lancer `npx astro build` avant).
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';

async function openStart(env, width) {
  const ctx = await env.browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const response = await page.goto(`${env.base}/start/`, { waitUntil: 'load' });
  assert.equal(response?.status(), 200);
  return { ctx, page };
}

test('R1 — chaque section de /start est annoncée par un titre h2, sous le h1 unique', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { ctx, page } = await openStart(env, 1440);
  const r = await page.evaluate(() => ({
    h1: document.querySelectorAll('h1').length,
    articles: document.querySelectorAll('main article').length,
    articlesSansH2: [...document.querySelectorAll('main article')].filter((a) => !a.querySelector(':scope > h2')).length,
    ordre: [...document.querySelectorAll('h1, h2')].map((h) => h.tagName),
  }));
  assert.equal(r.h1, 1);
  assert.ok(r.articles >= 8, `sections introuvables (${r.articles})`);
  assert.equal(r.articlesSansH2, 0, 'section sans titre h2');
  assert.equal(r.ordre[0], 'H1');
  await ctx.close();
});

test('R2 — aucun texte de /start sous 12 px (étiquettes des prompts et des blocs de code)', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1440, 390]) {
    const { ctx, page } = await openStart(env, width);
    const small = await page.evaluate(() => {
      const out = [];
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) {
        const n = w.currentNode;
        const el = n.parentElement;
        if (!n.textContent.trim() || el.closest('script, style, noscript')) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12) out.push(`${n.textContent.trim().slice(0, 30)} (${fs}px)`);
      }
      return out;
    });
    assert.deepEqual(small, [], `texte sous 12 px à ${width} px`);
    await ctx.close();
  }
});

test('R3 — le nom du langage d’un bloc de code a un contraste d’au moins 4,5:1', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { ctx, page } = await openStart(env, 1440);
  const ratios = await page.evaluate(() => {
    const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
    const rgba = (c) => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 }; };
    const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const mix = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) });
    const bg = (el) => { const ls = []; for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c.a > 0) ls.push(c); if (c.a >= 1) break; } let base = { r: 0, g: 0, b: 0 }; for (const c of ls.reverse()) base = mix(c, base); return base; };
    return [...document.querySelectorAll('figure > figcaption > span:last-child')].map((el) => {
      const B = bg(el); const F = mix(rgba(getComputedStyle(el).color), B);
      const a = lum(F); const b = lum(B);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
  });
  assert.ok(ratios.length >= 5, `blocs de code introuvables (${ratios.length})`);
  for (const x of ratios) assert.ok(x >= 4.5, `contraste ${x.toFixed(2)}:1`);
  await ctx.close();
});

test('R4 — les liens « → » du bloc « aller plus loin » font au moins 24 px de haut', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1440, 390]) {
    const { ctx, page } = await openStart(env, width);
    const hs = await page.evaluate(() => [...document.querySelectorAll('main li > a')].filter((a) => a.textContent.trim().startsWith('→')).map((a) => a.getBoundingClientRect().height));
    assert.equal(hs.length, 6);
    for (const h of hs) assert.ok(h >= 24, `lien de ${h} px à ${width} px`);
    await ctx.close();
  }
});

test('R5 — les 5 prompts de /start se lisent en entier à 390 px, sans défilement latéral', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [390, 320]) {
    const { ctx, page } = await openStart(env, width);
    const r = await page.evaluate(() => [...document.querySelectorAll('figure')]
      .filter((f) => f.querySelector('figcaption span:last-child')?.textContent.trim() === 'prompt')
      .map((f) => { const pre = f.querySelector('pre'); return { over: pre.scrollWidth - pre.clientWidth, texte: pre.textContent.slice(0, 20) }; }));
    assert.equal(r.length, 5);
    for (const x of r) assert.ok(x.over <= 0, `« ${x.texte} » déborde de ${x.over} px à ${width} px`);
    await ctx.close();
  }
});

test('R6 — un prompt qui ne défile pas n’est pas un arrêt Tab ; un bloc de code qui défile le reste', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { ctx, page } = await openStart(env, 390);
  const r = await page.evaluate(() => [...document.querySelectorAll('figure pre')].map((pre) => ({
    prompt: pre.closest('figure').querySelector('figcaption span:last-child').textContent.trim() === 'prompt',
    tab: pre.tabIndex >= 0,
  })));
  assert.equal(r.filter((x) => x.prompt && x.tab).length, 0);
  await ctx.close();
  const c2 = await env.browser.newContext({ viewport: { width: 390, height: 900 } });
  const p2 = await c2.newPage();
  await p2.goto(`${env.base}/argocd-k8s-pour-les-nuls/`, { waitUntil: 'load' });
  const pres = await p2.evaluate(() => [...document.querySelectorAll('figure pre')].filter((pre) => pre.querySelector(':scope > code')).map((pre) => pre.tabIndex));
  assert.ok(pres.length > 0 && pres.every((i) => i >= 0), 'les blocs de code défilants doivent rester focalisables');
  await c2.close();
});
