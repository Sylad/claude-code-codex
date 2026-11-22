// L7 — revue UX de /atelier-ia/ (WCAG 2.2 AA, Nielsen), mesurée sur le site CONSTRUIT
// (`npx astro build` avant ; tests navigateur en « skip » sans playwright-core/Chromium).
// Constats de la revue (2026-11-22) :
//  t1 — WCAG 1.3.1 / 2.4.6 : le nom de chaque outil n'était pas dans le titre de sa carte (un <p>
//       au-dessus d'un <h2> « Gros chantiers projet »), et les sept cartes, des <article> sans
//       titre de section, sautaient du h1 au rôle de l'outil.
//  t2 — schéma « Architecture mentale » en flowchart LR : 1 689 px de large pour un cadre de 702 px
//       à 1440 px, 41 % visible sans défiler (Nielsen 6, reconnaître plutôt que se souvenir).
//  t3 — WCAG 3.1.2 / Nielsen 2 : libellés anglais dans une page en français (« UI experiments »,
//       « review, docs, bridge local », « features longues », « Loading diagram… »).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const html = () => readFileSync(join(DIST, 'atelier-ia', 'index.html'), 'utf8');

async function open(env, width, height = 900) {
  const context = await env.browser.newContext({ viewport: { width, height } });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  await page.goto(`${env.base}/atelier-ia/`, { waitUntil: 'networkidle' });
  return { context, page };
}

test('L7/t1 — chaque carte d\'outil a un titre qui nomme l\'outil et son rôle, dans une liste titrée', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env, 1440);
  const r = await page.evaluate(() => {
    const main = document.querySelector('main');
    const levels = [...main.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
    const sauts = levels.filter((l, i) => i > 0 && l > levels[i - 1] + 1);
    const items = [...main.querySelectorAll('ul > li')].filter((li) => li.querySelector('h3'));
    const liste = items[0]?.parentElement;
    const section = liste?.closest('section');
    const titre = section && document.getElementById(section.getAttribute('aria-labelledby') ?? '');
    return {
      sauts,
      titres: items.map((li) => li.querySelector('h3').textContent.replace(/\s+/g, ' ').trim()),
      memeListe: items.every((li) => li.parentElement === liste),
      titreSection: titre?.tagName === 'H2' ? titre.textContent.trim() : null,
    };
  });
  assert.deepEqual(r.sauts, [], 'niveau de titre sauté dans <main>');
  assert.equal(r.titres.length, 7, `${r.titres.length} cartes titrées`);
  assert.ok(r.memeListe, 'les cartes ne sont pas dans une seule liste');
  assert.ok(r.titreSection, 'la liste des outils n\'a pas de titre h2 relié (aria-labelledby)');
  for (const [nom, role] of [['Claude Code', 'Gros chantiers projet'], ['Ollama', 'IA locale'], ['GitHub + Cloudflare', 'Chaîne de livraison']]) {
    assert.ok(r.titres.some((x) => x.startsWith(nom) && x.includes(role)), `aucun titre « ${nom} — ${role} » : ${r.titres}`);
  }
  await context.close();
});

test('L7/t2 — le schéma de l\'atelier se lit à 75 % au moins sans défiler, à 1440 px', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env, 1440);
  await page.locator('main figure').first().scrollIntoViewIfNeeded();
  await page.waitForSelector('main figure svg[id^=mermaid]', { timeout: 20_000 });
  const { frame, scroll } = await page.evaluate(() => {
    const c = document.querySelector('main figure svg[id^=mermaid]').parentElement;
    return { frame: c.clientWidth, scroll: c.scrollWidth };
  });
  assert.ok(frame / scroll >= 0.75, `visible ${(100 * frame / scroll).toFixed(0)} % (${frame} / ${scroll} px)`);
  await context.close();
});

test('L7/t3 — aucun libellé anglais dans le schéma ni dans son attente de chargement', () => {
  const h = html().replace(/&#39;|&apos;/g, "'");
  for (const anglais of ['UI experiments', 'bridge local', 'review, docs', 'features longues', 'Loading diagram']) {
    assert.ok(!h.includes(anglais), `« ${anglais} » encore dans la page`);
  }
  assert.match(h, /Chargement du schéma/);
  assert.match(h, /essais d'interface/);
});

test('L7 — pas de défilement horizontal à 320, 390 et 1440 px', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [320, 390, 1440]) {
    const { context, page } = await open(env, width);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(sw <= width, `${width} px : page large de ${sw} px`);
    await context.close();
  }
});
