// L21 — sur le site CONSTRUIT (`npx astro build` avant) : chaque page de contenu affiche la date de
// sa dernière revue, son rythme et la prochaine revue ; l'Écosystème montre les actualités datées et
// sourcées de la veille ; rien ne déborde à 320 et 390 px.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { PAGES_REVUES, RYTHME_JOURS, prochaineRevue } from '../src/lib/revue-contenu.mjs';
import { actualites } from '../src/data/veille-ecosysteme.mjs';
import { formatDay } from '../src/lib/format-date.mjs';

const brut = (chemin) => readFileSync(join(DIST, chemin, 'index.html'), 'utf8');
const texte = (h) => h.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|[   ]/g, ' ').replace(/&#39;|&#x27;/g, "'").replace(/\s+/g, ' ');
const sansNbsp = (s) => s.replace(/[  ]/g, ' ');

for (const [cle, p] of Object.entries(PAGES_REVUES)) {
  test(`L21 — ${p.chemin} affiche sa dernière revue, son rythme et la prochaine`, () => {
    const h = brut(p.chemin);
    assert.equal((h.match(/data-revue="/g) || []).length, 1, `${cle} : un seul bloc de revue`);
    assert.match(h, new RegExp(`data-revue-derniere="${p.derniereRevue}"`));
    assert.match(h, new RegExp(`data-revue-prochaine="${prochaineRevue(p.derniereRevue)}"`));
    const t = texte(h);
    assert.ok(t.includes(`Dernière revue : ${sansNbsp(formatDay(p.derniereRevue))}`), `${cle} : date de revue`);
    assert.ok(t.includes(`revue tous les ${RYTHME_JOURS} jours`), `${cle} : rythme`);
    assert.ok(t.includes(`prochaine avant le ${sansNbsp(formatDay(prochaineRevue(p.derniereRevue)))}`), `${cle} : prochaine`);
    assert.ok(t.includes('Signalé périmé, pas encore corrigé'), `${cle} : rubrique des éléments périmés`);
    for (const x of p.corrige) assert.ok(t.includes(sansNbsp(x).replace(/\s+/g, ' ')), `${cle} : « ${x.slice(0, 40)}… »`);
  });
}

test('L21 — /ecosystem : chaque actualité de la veille est affichée avec sa date et sa source', () => {
  const h = brut('ecosystem');
  assert.equal((h.match(/data-actualite/g) || []).length, actualites.length);
  for (const a of actualites) {
    assert.ok(h.includes(`datetime="${a.date}"`), a.titre);
    assert.ok(h.includes(`href="${a.source.href}"`), `${a.titre} : source`);
  }
});

test('L21 — contenus mis à jour : chaîne Anthropic, modèle de l\'exemple, Fable 5.2, Omnara, The Bearded Bear', () => {
  assert.doesNotMatch(brut('videos'), /href="https:\/\/www\.youtube\.com\/@AnthropicAI"/);
  assert.match(brut('videos'), /youtube\.com\/@anthropic-ai/);
  const th = texte(brut('theory'));
  assert.match(th, /claude-opus-5-5/);
  assert.doesNotMatch(th, /claude-opus-4-7/);
  assert.match(th, /512 tokens pour Fable 5\.x/);
  assert.doesNotMatch(th, /Haiku 3\.5/);
  assert.match(texte(brut('case-studies')), /Omnara/);
  assert.match(brut('learning'), /the-bearded-bear\.com\/blog/);
});

test('L21 — blocs de revue et actualités sans défilement latéral à 320 et 390 px', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const p of Object.values(PAGES_REVUES)) {
    for (const width of [320, 390]) {
      const context = await env.browser.newContext({ viewport: { width, height: 844 } });
      await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      const page = await context.newPage();
      await page.goto(`${env.base}${p.chemin}`, { waitUntil: 'load' });
      await page.locator('[data-revue] summary').click();
      const m = await page.evaluate(() => {
        const r = document.querySelector('[data-revue]').getBoundingClientRect();
        const s = document.querySelector('[data-revue] summary').getBoundingClientRect();
        return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, droite: r.right, summaryH: s.height };
      });
      if (m.sw > m.cw) failures.push(`${p.chemin} @${width} : scrollWidth ${m.sw} > ${m.cw}`);
      if (m.droite > m.cw) failures.push(`${p.chemin} @${width} : bloc de revue déborde (${m.droite})`);
      if (m.summaryH < 44) failures.push(`${p.chemin} @${width} : cible « Ce que cette revue a vérifié » ${m.summaryH} px < 44`);
      await context.close();
    }
  }
  assert.deepEqual(failures, []);
});

test('L21 — une page passée en retard depuis le build affiche l\'avertissement dans le navigateur', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext();
  const page = await context.newPage();
  const loin = Date.parse(`${prochaineRevue(PAGES_REVUES.videos.derniereRevue)}T12:00:00Z`) + 5 * 86_400_000;
  await page.addInitScript((ms) => { const D = Date; globalThis.Date = class extends D { constructor(...a) { super(...(a.length ? a : [ms])); } static now() { return ms; } }; }, loin);
  await page.goto(`${env.base}/videos/`, { waitUntil: 'load' });
  assert.equal(await page.locator('[data-revue-retard]').isVisible(), true);
  await context.close();
  const c2 = await env.browser.newContext();
  const p2 = await c2.newPage();
  await p2.goto(`${env.base}/videos/`, { waitUntil: 'load' });
  assert.equal(await p2.locator('[data-revue-retard]').isVisible(), false);
  await c2.close();
});
