// L28 — une route inexistante sert un vrai 404 : statut HTTP 404 et page « introuvable » utile, avec un lien
// vers l'accueil, au lieu de l'accueil en 200 (QA prod du 05-10 : 200 + page d'accueil, 26 665 octets).
// Cloudflare Pages ne sert le statut 404 que si le site publie un `404.html` à la RACINE de la sortie ;
// sans lui, il traite le site comme une application d'une page et renvoie l'accueil en 200. Une règle
// `_redirects` « /* /index.html 200 » rétablirait ce défaut : elle est interdite ici.
// Lit le site CONSTRUIT : `npx astro build` avant. Le serveur de tests/lib/e2e-dist.mjs imite Pages.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, setupBrowser, pageReady } from './lib/e2e-dist.mjs';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const PAGE = join(DIST, '404.html');
// Adresses inconnues : une à la racine, une profonde (les ressources doivent se charger depuis toute profondeur),
// une proche d'une vraie page.
const INCONNUES = ['/cette-page-n-existe-pas', '/guides/pas/ici/', '/theorie'];

test('L28 — le build publie 404.html à la racine, hors index et sans URL canonique', () => {
  assert.ok(existsSync(PAGE), 'dist/404.html absent : Cloudflare Pages servirait l\'accueil en 200');
  const html = readFileSync(PAGE, 'utf8');
  assert.match(html, /<title>Page introuvable · claude-code-codex<\/title>/);
  assert.match(html, /<meta name="robots" content="noindex">/);
  assert.doesNotMatch(html, /rel="canonical"/, 'une URL canonique sur la 404 ferait indexer /404');
  assert.doesNotMatch(html, /property="og:url"/);
  // Servie à n'importe quelle profondeur : aucune ressource en chemin relatif.
  const relatifs = [...html.matchAll(/(?:src|href)="(?!\/|https?:|#|mailto:|data:)([^"]*)"/g)].map((m) => m[1]);
  assert.deepEqual(relatifs, [], `chemins relatifs dans 404.html : ${relatifs.join(', ')}`);
});

test('L28 — aucune règle de repli vers l\'accueil dans _redirects', () => {
  for (const dir of [PUBLIC, DIST]) {
    const f = join(dir, '_redirects');
    if (!existsSync(f)) continue;
    const lignes = readFileSync(f, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    const repli = lignes.filter((l) => /^\/\*\s+\/(index\.html)?\s+200\b/.test(l));
    assert.deepEqual(repli, [], `${f} : repli qui masque les 404`);
  }
});

test('L28 — une adresse inconnue répond 404 avec la page introuvable et un lien vers l\'accueil (1440 et 390 px)', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1440, 390]) {
    const ctx = await env.browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    const echecs = [];
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('fonts.g')) echecs.push(`${r.status()} ${r.url()}`); });
    for (const route of INCONNUES) {
      echecs.length = 0;
      const rep = await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
      assert.equal(rep.status(), 404, `${route} @${width}px : statut ${rep.status()}`);
      await pageReady(page);
      assert.equal(await page.locator('h1').innerText(), 'Cette page n\'existe pas', `${route} @${width}px`);
      // Seule la page elle-même est en 404 ; styles, scripts et images se chargent.
      assert.deepEqual(echecs.filter((e) => !e.endsWith(route)), [], `${route} @${width}px : ressources en échec`);
      const accueil = page.locator('main a[href="/"]', { hasText: 'Retour à l\'accueil' });
      assert.equal(await accueil.count(), 1, `${route} @${width}px : lien vers l'accueil`);
      assert.ok(await accueil.isVisible(), `${route} @${width}px : lien vers l'accueil invisible`);
      // Visible sans défiler, et la page ne défile pas de côté.
      const box = await accueil.boundingBox();
      assert.ok(box.y + box.height <= 900, `${route} @${width}px : lien sous le pli (${Math.round(box.y)} px)`);
      const deborde = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(deborde <= 0, `${route} @${width}px : défilement horizontal de ${deborde} px`);
    }
    // Le lien mène bien à l'accueil, servi en 200.
    await Promise.all([page.waitForURL(`${env.base}/`), page.locator('main a[href="/"]').first().click()]);
    const rep = await page.request.get(`${env.base}/`);
    assert.equal(rep.status(), 200);
    await ctx.close();
  }
});
