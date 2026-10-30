// L44 — page /livre-de-bord/ sur le site CONSTRUIT : une entrée datée par semaine, rubriques,
// liens, aucun texte privé ; lien depuis le pied de page de chaque page.
// Lit dist : lancer `npx astro build` avant. Tests navigateur en « skip » sans Chromium.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { ENTRIES } from '../src/data/livre-de-bord.ts';
import { PRIVATE_PATTERNS } from '../src/lib/livre-de-bord.ts';
import { formatDay } from '../src/lib/format-date.mjs';

const PAGE = join(DIST, 'livre-de-bord', 'index.html');
const html = () => readFileSync(PAGE, 'utf8');
const unescape = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

test('R7 — dist/livre-de-bord/index.html est construit, titré, avec un h1', () => {
  assert.ok(existsSync(PAGE), 'page absente : lancer `npx astro build`');
  assert.match(html(), /<title>Livre de bord · claude-code-codex<\/title>/);
  assert.match(html(), /<h1[^>]*>[^<]*Livre de bord[^<]*<\/h1>/);
});

test('R8 — une entrée par semaine, dans l’ordre, datée en français, avec ses trois rubriques', () => {
  const page = html();
  const arts = [...page.matchAll(/<article[^>]*data-semaine="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
  assert.deepEqual(arts.map((m) => m[1]), ENTRIES.map((e) => e.semaine));
  arts.forEach((m, i) => {
    const e = ENTRIES[i];
    assert.match(m[2], new RegExp(`<time datetime="${e.date}"[^>]*>${formatDay(e.date)}</time>`), `${e.semaine} : date`);
    assert.match(m[0], new RegExp(`id="semaine-${e.semaine}"`));
    for (const h of ['Ce que nous avons appris', 'Ce que nous fabriquons', 'Ce que nous avons testé']) {
      assert.match(m[2], new RegExp(`<h3[^>]*>${h}</h3>`), `${e.semaine} : rubrique « ${h} »`);
    }
    for (const it of [...e.appris, ...e.fabrique]) assert.ok(unescape(m[2]).includes(it.titre), `${e.semaine} : « ${it.titre} » absent`);
  });
});

test('R9 — les liens de la page sont ceux des entrées ; aucun motif privé dans le HTML', () => {
  const page = html();
  const main = page.slice(page.indexOf('<main'), page.indexOf('</main>'));
  const hrefs = ENTRIES.flatMap((e) => [...e.appris, ...e.fabrique, ...e.teste]).flatMap((i) => (i.liens ?? []).map((l) => l.href));
  for (const h of hrefs) assert.ok(main.includes(`href="${h}"`), `lien ${h} absent`);
  const text = main.replace(/<[^>]+>/g, ' ');
  for (const re of PRIVATE_PATTERNS) assert.doesNotMatch(text, re, `motif privé ${re}`);
});

test('R10 — le pied de page de la page propose « Livre de bord » (page courante marquée), comme celui de l’accueil', () => {
  const link = (p) => readFileSync(p, 'utf8').match(/<a[^>]*href="\/livre-de-bord"[^>]*>\s*Livre de bord\s*<\/a>/);
  assert.ok(link(join(DIST, 'index.html')), 'lien absent du pied de l’accueil');
  const cur = link(PAGE);
  assert.ok(cur && /aria-current="page"/.test(cur[0]), 'page courante non marquée');
});

test('R11 — la page tient sans défilement latéral à 390 px et 1440 px', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const page = await env.browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`${env.base}/livre-de-bord/`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(over <= 0, `${w}px : défilement latéral de ${over}px`);
    await page.close();
  }
});
