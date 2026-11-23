// L90 — suite des mineurs de la revue UX de L82 sur /videos, mesurée sur le site CONSTRUIT
// (`npx astro build` avant ; « skip » du test navigateur sans playwright-core/Chromium). Avant L90 :
//  1. à 320 px et texte 200 %, les cases « Officiel Anthropic » et « En français uniquement » se comprimaient
//     à 8×13 px (élément flex sans shrink-0) : l'état coché se voyait mal (WCAG 1.4.11) ;
//  2. la même personne s'appelait « Sylvain » dans les cartes et « l'auteur » ailleurs (Nielsen 4) ;
//  3. le titre de la conférence de Boris Cherny était traduit : introuvable sur YouTube (Nielsen 6).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser, pageReady } from './lib/e2e-dist.mjs';

const html = () => readFileSync(join(DIST, 'videos', 'index.html'), 'utf8');

test('L90 (3) — titre original de la conférence de Boris Cherny, tel que sur YouTube, en lang="en"', () => {
  const h = html();
  assert.match(
    h,
    /<h2[^>]*lang="en"[^>]*>\s*<a[^>]*>\s*Claude Code &amp; the evolution of agentic coding — Boris Cherny, Anthropic\s*<\/a>/,
  );
  assert.doesNotMatch(h, /évolution du codage agentique — Boris Cherny/);
});

test('L90 (2) — un seul nom pour la personne qui choisit les chaînes : « Sylvain », jamais « l\'auteur »', () => {
  const h = html();
  const main = h.slice(h.indexOf('<main'), h.lastIndexOf('</main>')).replace(/&#39;|&#x27;/g, "'");
  assert.doesNotMatch(main, /\bl'auteur\b/i);
  assert.match(main, /suivies par Sylvain/);
});

test('L90 (1) — 320 px, texte 200 % : les cases à cocher des filtres gardent leur taille', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const mesurer = async (zoom) => {
    const context = await env.browser.newContext({ viewport: { width: 320, height: 900 } });
    const page = await context.newPage();
    if (zoom) await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const s = document.createElement('style');
        s.textContent = 'html{font-size:200% !important}';
        document.head.append(s);
      });
    });
    await page.goto(`${env.base}/videos/`, { waitUntil: 'networkidle' });
    await pageReady(page);
    const tailles = await page.$$eval('main input[type="checkbox"]', (els) =>
      els.map((e) => { const r = e.getBoundingClientRect(); return { l: r.width, h: r.height, nom: e.parentElement.textContent.trim() }; }));
    await context.close();
    return tailles;
  };
  const normal = await mesurer(false);
  const agrandi = await mesurer(true);
  assert.equal(agrandi.length, 2, 'deux cases attendues');
  for (const [i, c] of agrandi.entries()) {
    assert.ok(c.l >= normal[i].l - 0.5 && c.h >= normal[i].h - 0.5,
      `« ${c.nom} » comprimée à ${c.l}×${c.h} px (à 100 % : ${normal[i].l}×${normal[i].h})`);
    assert.ok(Math.abs(c.l - c.h) <= 1, `« ${c.nom} » n'est plus carrée : ${c.l}×${c.h} px`);
  }
});
