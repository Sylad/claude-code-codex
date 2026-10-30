// L51 — Livre de bord « la vérification, pas la confiance » sur le site CONSTRUIT : schéma de la boucle
// (porte, revue, QA), une illustration par épisode, texte en paragraphes. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { ENTRIES } from '../src/data/livre-de-bord.ts';

const html = () => readFileSync(join(DIST, 'livre-de-bord', 'index.html'), 'utf8');
const article = () => {
  const m = html().match(/<article[^>]*id="semaine-2026-W44-theme"[^>]*>([\s\S]*?)<\/article>/);
  assert.ok(m, 'entrée thématique absente');
  return m[1];
};
const figure = (id) => {
  const m = article().match(new RegExp(`<figure[^>]*data-schema="${id}"[^>]*>([\\s\\S]*?)</figure>`));
  assert.ok(m, `figure « ${id} » absente de l'entrée thématique`);
  return m[1];
};
const plain = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const EPISODES = ['episode-finance', 'episode-warhammer', 'episode-cadence', 'episode-avatar'];

test('R15 — le schéma de la boucle va de la production à la décision (porte, revue, QA) avec une reprise', () => {
  const f = figure('boucle-verification');
  assert.match(f, /<svg[^>]*role="img"[^>]*aria-labelledby="[^"]+"/);
  assert.match(f, /<title[^>]*>[^<]{10,}<\/title>/);
  assert.match(f, /<desc[^>]*>[^<]{30,}<\/desc>/);
  assert.match(f, /<figcaption[^>]*>[^<]{20,}/);
  const t = plain(f);
  let from = 0;
  for (const step of ['production', 'Porte', 'Revue', 'QA', 'décision']) {
    const at = t.toLowerCase().indexOf(step.toLowerCase(), from);
    assert.ok(at >= 0, `étape « ${step} » absente ou hors ordre`);
    from = at + step.length;
  }
  assert.match(f, /data-boucle="[^"]+"/, 'boucle de reprise absente');
  // le schéma ouvre l'entrée : avant la première rubrique
  assert.ok(article().indexOf('data-schema="boucle-verification"') < article().indexOf('<h3'), 'schéma après les rubriques');
});

test('R16 — chaque épisode a son illustration, dans son élément, avec titre, description et légende', () => {
  const art = article();
  const items = [...art.matchAll(/<li[^>]*class="[^"]*book-item[^"]*"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
  const e = ENTRIES.find((x) => x.theme);
  EPISODES.forEach((id, i) => {
    const f = figure(id);
    assert.match(f, /<svg[^>]*role="img"/, `${id} : svg`);
    assert.match(f, /<title[^>]*>[^<]{10,}<\/title>/, `${id} : titre`);
    assert.match(f, /<desc[^>]*>[^<]{30,}<\/desc>/, `${id} : description`);
    assert.match(f, /<figcaption[^>]*>[^<]{20,}/, `${id} : légende`);
    const host = items.find((h) => h.includes(`data-schema="${id}"`));
    assert.ok(host?.includes(e.teste[i].titre.slice(0, 20)), `${id} : pas dans l'élément « ${e.teste[i].titre} »`);
  });
});

test('R17 — les illustrations racontent la vérification : l’étape qui a arrêté le défaut est marquée', () => {
  for (const id of EPISODES) assert.match(figure(id), /class="sch-box-accent"/, `${id} : étape décisive non marquée`);
  const t = plain(figure('episode-finance'));
  for (const w of ['L166', 'QA', 'L167']) assert.ok(t.includes(w), `finance : « ${w} » absent`);
  assert.ok(plain(figure('episode-warhammer')).includes('L217'));
  assert.ok(plain(figure('episode-cadence')).includes('4549'));
  assert.ok(plain(figure('episode-avatar')).includes('12 h 21'));
});

test('R18 — le texte d’un élément découpé s’affiche en paragraphes séparés', () => {
  const e = ENTRIES.find((x) => x.theme);
  const items = [...article().matchAll(/<li[^>]*class="[^"]*book-item[^"]*"[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
  const paras = (h) => [...h.matchAll(/<p[^>]*data-para[^>]*>/g)].length;
  e.teste.forEach((it) => {
    const host = items.find((h) => h.includes(it.titre.slice(0, 20)));
    assert.equal(paras(host), it.texte.split(/\n{2,}/).length, `« ${it.titre} » : paragraphes`);
  });
});

test('R19 — aucune couleur en dur dans les schémas du livre ; pas de défilement latéral à 390 et 1440 px', async (t) => {
  for (const id of ['boucle-verification', ...EPISODES]) {
    const f = figure(id);
    assert.doesNotMatch(f, /(?:fill|stroke|stop-color)="(?!none|currentColor|url)/, `${id} : couleur en attribut`);
    assert.doesNotMatch(f, /style="[^"]*#[0-9a-f]{3,8}/i, `${id} : couleur hexadécimale`);
  }
  const env = await setupBrowser(t);
  if (!env) return;
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const page = await env.browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`${env.base}/livre-de-bord/`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(over <= 0, `${w}px : défilement latéral de ${over}px`);
    const tooWide = await page.evaluate(() => [...document.querySelectorAll('.book-entry figure.schema')].filter((f) => f.getBoundingClientRect().right > innerWidth).length);
    assert.equal(tooWide, 0, `${w}px : schéma qui déborde`);
    await page.close();
  }
});
