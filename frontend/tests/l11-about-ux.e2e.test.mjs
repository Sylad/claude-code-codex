// L11 — revue UX de /about (WCAG 2.2 AA, Nielsen), mesurée sur le site CONSTRUIT
// (`npx astro build` avant ; « skip » sans playwright-core/Chromium). Avant L11 (7fb8125) :
//  1. un seul h2 (le nom de l'auteur) : « L'histoire courte », « Stack du site », « Sources », « Crédits IA »,
//     « Si tu veux faire pareil » n'étaient que des paragraphes stylés (WCAG 1.3.1, 2.4.6) ;
//  2. titre anglais « Vibe coded with Claude Code » lu avec la voix française (3.1.2) ;
//  3. « Site fan-made — sans affiliation officielle Anthropic » à 4,41:1 (text-ink/50, 12 px) (1.4.3) ;
//  4. trois liens qui ouvrent un nouvel onglet sans le dire, quand GitHub ↗ le dit (Nielsen 4, WCAG G201) ;
//  5. contenu : « NestJS » cité deux fois dans la même liste, « dev Java depuis 2005 » répété deux
//     paragraphes plus bas (Nielsen 8) ; « LLM — Claude Sonnet » alors que le batch appelle
//     claude-haiku-4-5 (scripts/lib/claude.ts) et que « Crédits IA » le dit (Nielsen 2, cohérence) ;
//  6. à 320 px et texte 200 %, gouttières de page (px-5) et de carte (p-6) en rem : colonne de texte
//     de ~140 px, 24 mots courts coupés (« Ladoir|e », « applicati|ons », « Kubernet|es »…) (1.4.10, 1.4.4).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser, pageReady, worstPixelContrast } from './lib/e2e-dist.mjs';
import { motsCoupes } from './lib/mots-coupes.mjs';

const html = () => readFileSync(join(DIST, 'about', 'index.html'), 'utf8');
const main = () => html().split('<main')[1].split('</main>')[0];
const texte = () => main().replace(/<[^>]+>/g, ' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ');

async function ouvrir(env, width, { zoom = false } = {}) {
  const context = await env.browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  if (zoom) await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'html{font-size:200% !important}';
      document.head.append(s);
    });
  });
  await page.goto(`${env.base}/about/`, { waitUntil: 'networkidle' });
  await pageReady(page);
  return { context, page };
}

test('L11 (1, 2) — un h2 par bloc, titre anglais en lang="en"', () => {
  const m = main();
  const h2 = [...m.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((x) => x[1].replace(/&#39;/g, "'").trim());
  assert.deepEqual(h2, [
    'Sylvain Ladoire — développeur Java/web senior',
    "L'histoire courte", 'Stack du site', 'Sources', 'Crédits IA', 'Si tu veux faire pareil',
  ]);
  assert.match(m, /<h1[^>]*lang="en"[^>]*>\s*Vibe coded with Claude Code\s*<\/h1>/);
});

test('L11 (4) — tout lien qui ouvre un nouvel onglet le dit (↗ visible et « nouvel onglet » lu)', () => {
  const liens = [...main().matchAll(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g)].map((x) => x[0]);
  assert.equal(liens.length, 4);
  for (const a of liens) {
    assert.match(a, /↗/, `sans ↗ : ${a.slice(0, 80)}`);
    assert.match(a, /nouvel onglet/, `sans « nouvel onglet » : ${a.slice(0, 80)}`);
  }
});

test('L11 (5) — contenu : pas de doublon, le modèle du batch est celui du code', () => {
  const t = texte();
  assert.doesNotMatch(t, /NestJS,[^.]*NestJS/, 'NestJS cité deux fois');
  assert.equal((t.match(/depuis 2005/g) ?? []).length, 1, '« depuis 2005 » répété');
  const modele = readFileSync(new URL('../../scripts/lib/claude.ts', import.meta.url), 'utf8').match(/claude-(haiku|sonnet|opus)-(\d)-(\d)/);
  const nom = `Claude ${modele[1][0].toUpperCase()}${modele[1].slice(1)} ${modele[2]}.${modele[3]}`;
  assert.match(t, new RegExp(`LLM — Anthropic SDK \\(${nom}\\)`), `ligne LLM ≠ ${nom}`);
  assert.match(t, new RegExp(modele[0].replace(/-\d{8}$/, '')));
  // Faits gardés (L55 R2).
  assert.match(t, /depuis fin 2025/);
  assert.match(t, /dont 4 déployées sur Kubernetes \(k3s\) \+ GitOps/);
});

test('L11 (3) — /about à 1440, 390 et 320 px : mention de pied ≥ 4,5:1, pas de défilement', { timeout: 240_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [1440, 390, 320]) {
    const { context, page } = await ouvrir(env, width);
    const sel = 'main p.text-center';
    const { worst, glyphs } = await worstPixelContrast(page, sel);
    if (!glyphs) failures.push(`@${width}px ${sel} : aucun glyphe mesuré`);
    else if (worst < 4.5) failures.push(`@${width}px « Site fan-made » ${worst.toFixed(2)}:1 < 4,5`);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (sw > 0) failures.push(`@${width}px défilement horizontal de ${sw} px`);
    await context.close();
  }
  assert.deepEqual(failures, []);
});

test('L11 (6) — 320 px, texte 200 % : aucun mot court coupé, pas de défilement', { timeout: 240_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await ouvrir(env, 320, { zoom: true });
  const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const coupes = await page.evaluate(motsCoupes);
  // Le nom de l'auteur reste agrandi (36 px au lieu de 40 à cette seule largeur, comme le h1 de PageHero).
  const h2 = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('main h2')).fontSize));
  await context.close();
  assert.equal(sw, 0, `défilement horizontal de ${sw} px`);
  assert.ok(h2 >= 36, `nom de l'auteur à ${h2} px`);
  assert.deepEqual(coupes, []);
});
