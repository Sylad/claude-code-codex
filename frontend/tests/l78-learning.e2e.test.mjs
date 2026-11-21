// L78 — suite de la revue UX de /learning, mesurée sur le site CONSTRUIT (`npx astro build` avant ;
// « skip » sans playwright-core/Chromium), à 1440 et 390 px.
// Point 2 : curseur main sur les 4 filtres et sur « Réinitialiser » (grille cursor-pointer, Nielsen 1).
// Point 3 : le texte du catalogue dit ce que la page fait (filtres par type + recherche), sans tri ni langue.
// Point 4 : à l'état vide, un seul bouton pour réinitialiser.
// Point 5 : chaque résumé du fil porte lang="en" si et seulement s'il est en anglais — vérifié sur des
// résumés de test dont la langue est écrite à la main (LANGUES), rendus par LatestNews puis lus par Chromium ;
// sur le site construit, seulement lang absent ou "en" (les flux réels changent chaque semaine).
// Suite de revue : un résumé hostile chargé dans le navigateur n'exécute rien et n'ajoute que <code>/<span>.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { entree, renderLatestNews, resumeDe, HOSTILES } from './lib/latest-news-fixture.mjs';

const html = () => readFileSync(join(DIST, 'learning', 'index.html'), 'utf8');

test('L78 — le texte du catalogue ne promet ni tri ni filtre de langue', () => {
  const h = html();
  assert.doesNotMatch(h, /triables|par type et langue/);
  assert.match(h, /filtrables par type, avec une recherche par\s+auteur, sujet ou tag/);
});

test('L78 — le code cité dans un résumé du fil n’est pas effacé', () => {
  const h = html();
  assert.doesNotMatch(h, /Utilisez\s*`\s*`/);
  if (/Utilisez <code>/.test(h)) assert.match(h, /Utilisez <code>&lt;details&gt;&lt;summary&gt;<\/code> en HTML/);
});

test('L78 — /learning à 1440 et 390 px : curseur, état vide, langue des résumés', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [1440, 390]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${env.base}/learning/`, { waitUntil: 'networkidle' });
    const at = `@${width}px`;

    // Point 5 (site construit) : un résumé n'a que lang absent (français, langue de la page) ou "en".
    const resumes = await page.$$eval('main section ul li > p', (ps) => ps.map((p) => ({ lang: p.getAttribute('lang'), text: p.textContent })));
    if (resumes.length < 1) failures.push(`${at} aucun résumé du fil`);
    for (const r of resumes) {
      if (r.lang !== null && r.lang !== 'en') failures.push(`${at} résumé lang=${r.lang} : ${r.text.slice(0, 60)}`);
    }

    // Point 2 : curseur main sur les filtres, puis sur « Réinitialiser ».
    for (const name of [/^Blog/, /^Newsletter/, /^Engineering/, /^Podcast/]) {
      const b = page.getByRole('button', { name });
      const c = await b.evaluate((e) => getComputedStyle(e).cursor);
      if (c !== 'pointer') failures.push(`${at} filtre ${name} : cursor ${c}`);
    }
    await page.getByRole('searchbox', { name: /rechercher/i }).fill('zzzz');
    const resets = page.getByRole('button', { name: /^Réinitialiser/ });
    // Point 4 : un seul bouton de remise à zéro à l'état vide.
    const n = await resets.count();
    if (n !== 1) failures.push(`${at} ${n} boutons Réinitialiser à l'état vide`);
    if (n >= 1) {
      const c = await resets.first().evaluate((e) => getComputedStyle(e).cursor);
      if (c !== 'pointer') failures.push(`${at} Réinitialiser : cursor ${c}`);
      await resets.first().click();
      const status = await page.getByRole('status').filter({ hasText: /sources/ }).textContent();
      if (!/^\s*(\d+) \/ \1 sources\s*$/.test(status)) failures.push(`${at} après réinitialisation : ${status}`);
    }
    await context.close();
  }
  assert.deepEqual(failures, []);
});

// Langue attendue de chaque résumé de test, jugée à la lecture (null = français, langue de la page).
const LANGUES = [
  ["We're introducing a new life sciences research group and laboratory at Anthropic. Our focus is on the future of science.", 'en'],
  ['We`re shipping Claude for Chrome to all Max users and it`s available today.', 'en'],
  ['Tool: Shadow roots, explained with live examples', 'en'],
  ['<p>How we built our multi-agent research system with <code>claude --agents</code> and the SDK.</p>', 'en'],
  ['Les agents de codage transforment la profession : gain de productivité pour qui aime construire.', null],
  ['Utilisez `<details><summary>` en HTML pour masquer les descriptions de PR générées par IA.', null],
  ['ttok 0.4 : CLI pour compter les tokens', null],
  ['Claude Code 2.1 : les sous-agents peuvent maintenant tourner en arrière-plan.', null],
  ['<p>Anthropic publie un guide sur les <em>prompts</em> système et le cache.</p>', null],
];

test('L78 — résumés de test rendus par LatestNews, dans Chromium à 1440 et 390 px : langue écrite à la main, rien d\'injecté', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  // Deux rendus : LatestNews n'affiche que les 10 entrées les plus récentes.
  const langues = LANGUES.map(([s], i) => entree(i + 1, s));
  const hostiles = HOSTILES.map((s, i) => entree(LANGUES.length + i + 1, s));
  const html = (await renderLatestNews(langues)) + (await renderLatestNews(hostiles));
  for (const n of [...langues, ...hostiles].keys()) assert.ok(resumeDe(html, n + 1), `résumé ${n + 1} rendu`);
  const failures = [];
  for (const width of [1440, 390]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    const dialogues = [];
    page.on('dialog', (d) => { dialogues.push(d.message()); d.dismiss(); });
    await page.setContent(`<!doctype html><html lang="fr"><body>${html}</body></html>`, { waitUntil: 'load' });
    const at = `@${width}px`;
    const lus = await page.$$eval('li', (lis) => lis.map((li) => {
      const p = li.querySelector(':scope > p');
      return {
        titre: li.querySelector('h3')?.textContent.trim(),
        lang: p?.getAttribute('lang') ?? null,
        balises: [...(p?.querySelectorAll('*') ?? [])].map((e) => e.tagName.toLowerCase() + [...e.attributes].map((a) => `[${a.name}]`).join('')),
      };
    }));
    for (const [i, [s, attendu]] of LANGUES.entries()) {
      const r = lus.find((l) => l.titre === `Titre fixture ${i + 1}`);
      if (r?.lang !== attendu) failures.push(`${at} lang=${r?.lang} attendu ${attendu} : ${s.slice(0, 50)}`);
    }
    for (const r of lus) {
      const autres = r.balises.filter((b) => b !== 'code' && b !== 'span[data-opt]');
      if (autres.length) failures.push(`${at} ${r.titre} : balises ${autres.join(', ')}`);
    }
    const pwn = await page.evaluate(() => window.__pwn ?? null);
    if (pwn !== null) failures.push(`${at} script exécuté : window.__pwn=${pwn}`);
    if (dialogues.length) failures.push(`${at} dialogues ouverts : ${dialogues.join(', ')}`);
    // Les apostrophes en accent grave restent du texte, pas un code.
    const apos = lus.find((l) => l.titre === 'Titre fixture 2');
    if (apos?.balises.length) failures.push(`${at} « We\`re … it\`s » : ${apos.balises.join(', ')}`);
    await context.close();
  }
  assert.deepEqual(failures, []);
});
