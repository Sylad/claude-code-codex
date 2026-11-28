// L112 (D-6, D-7) — le site entier en deux langues. Critères tirés de la consigne du lot : (1) un seul contrôle de
// langue, global, dans la barre, qui mène à la même page dans l'autre langue ; (4) une page sans anglais s'affiche
// sous /en/ en français avec un bandeau visible « Not translated yet », hreflang fr sur le contenu, et les liens
// de la barre /en/ restent sous /en/ ; (5) une 404 anglaise sous /en/. Lit dist : build avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DIST, setupBrowser, pageReady } from './lib/e2e-dist.mjs';
import { measureBar } from './lib/mesure-barre.mjs';
import { LIBELLES } from '../src/lib/libelles-site.mjs';
import { TRADUITES, CODES } from '../src/lib/langues.mjs';

/** Pages construites (dossiers à index.html), par adresse. */
function pages() {
  const out = [];
  const visiter = (dir) => {
    for (const nom of readdirSync(dir)) {
      const f = join(dir, nom);
      if (statSync(f).isDirectory()) visiter(f);
      else if (nom === 'index.html') out.push(`/${relative(DIST, dir)}/`.replace(/\/+/g, '/'));
    }
  };
  visiter(DIST);
  return out;
}
const lire = (url) => readFileSync(join(DIST, url, 'index.html'), 'utf8');
const entre = (html, debut, fin) => html.slice(html.indexOf(debut), html.indexOf(fin, html.indexOf(debut)) + fin.length);
const BANDEAU = LIBELLES.en.nonTraduite.titre;

test('G1 — chaque page française a sa version /en/ ; sans traduction : texte français, bandeau, langue fr, canonique vers la page française', () => {
  const tout = pages();
  const fr = tout.filter((u) => !u.startsWith('/en/'));
  assert.ok(fr.length >= 40, `${fr.length} pages françaises`);
  for (const url of fr) {
    const en = `/en${url}`;
    assert.ok(tout.includes(en), `${url} : pas de ${en}`);
    const html = lire(en);
    assert.match(html, /<html[^>]*lang="en"/, `${en} : langue du document`);
    const traduite = TRADUITES.includes(url);
    const bandeaux = html.split('data-non-traduite').length - 1;
    if (traduite) {
      assert.equal(bandeaux, 0, `${en} : bandeau sur une page traduite`);
      assert.doesNotMatch(html, /data-contenu-fr/);
      assert.match(html, /<title>[^<]+<\/title>/, `${en} : titre de page traduite marqué comme étranger`);
      continue;
    }
    assert.equal(bandeaux, 1, `${en} : bandeau « ${BANDEAU} » absent`);
    assert.ok(entre(html, 'data-non-traduite', '</div>').includes(BANDEAU), `${en} : texte du bandeau`);
    // le contenu se déclare en français (WCAG 3.1.2) et reste celui de la page française
    assert.match(html, /<div lang="fr" data-contenu-fr>/, `${en} : contenu sans lang="fr"`);
    // revue UX (L112) : le titre de la page est celui de la page française, marqué comme tel sous <html lang="en">
    const titrePage = /<title([^>]*)>([^<]*)<\/title>/.exec(html);
    assert.ok(titrePage, `${en} : pas de <title>`);
    assert.match(titrePage[1], /\blang="fr"/, `${en} : <title> en français sans lang="fr"`);
    assert.equal(titrePage[2], /<title[^>]*>([^<]*)<\/title>/.exec(lire(url))?.[1], `${en} : titre différent de la page française`);
    const titreFr = lire(url).match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1];
    if (titreFr) assert.ok(html.includes(titreFr), `${en} : titre principal différent de la page française`);
    // pas de version anglaise à annoncer aux moteurs : canonique vers la page française, aucun hreflang alternatif
    const canonique = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
    if (canonique) assert.equal(new URL(canonique).pathname, url, `${en} : canonique`);
    assert.doesNotMatch(html, /<link rel="alternate" hreflang=/, `${en} : hreflang alternatif sur une page non traduite`);
  }
  // les pages françaises n'ont jamais de bandeau, et leur titre suit la langue du document
  for (const url of fr) {
    assert.doesNotMatch(lire(url), /data-non-traduite/, `${url} : bandeau`);
    assert.match(lire(url), /<title>[^<]+<\/title>/, `${url} : <title>`);
  }
});

test('G2 — un seul contrôle de langue par page, dans la barre, vers la même page dans l’autre langue (qui existe)', () => {
  for (const url of pages()) {
    const html = lire(url);
    const n = html.split('data-selecteur-langue').length - 1;
    const header = entre(html, '<header', '</header>');
    // bureau + menu du téléphone : deux liens, tous deux dans la barre
    assert.equal(n, header.split('data-selecteur-langue').length - 1, `${url} : contrôle hors de la barre`);
    assert.ok(n >= 1 && n <= 2, `${url} : ${n} contrôles`);
    const cibles = [...header.matchAll(/<a\b[^>]*data-selecteur-langue[^>]*>/g)].map((m) => m[0].match(/href="([^"]+)"/)[1]);
    const attendu = url.startsWith('/en/') ? url.slice(3) : `/en${url}`;
    for (const c of cibles) {
      assert.equal(c, attendu, `${url} : le contrôle mène à ${c}`);
      assert.ok(existsSync(join(DIST, c, 'index.html')), `${c} : page absente`);
    }
    assert.ok(header.includes(`>${CODES[url.startsWith('/en/') ? 'fr' : 'en']}<`) || header.includes(` ${CODES[url.startsWith('/en/') ? 'fr' : 'en']}<`), `${url} : code de l'autre langue`);
  }
});

test('G3 — sous /en/, les liens internes de la barre et du pied restent sous /en/, sur toutes les pages', () => {
  for (const url of pages().filter((u) => u.startsWith('/en/'))) {
    const html = lire(url);
    for (const zone of [entre(html, '<header', '</header>'), entre(html, '<footer', '</footer>')]) {
      for (const [, attrs] of zone.matchAll(/<a\b([^>]*)>/g)) {
        const href = attrs.match(/href="([^"]+)"/)?.[1];
        if (!href || /^(https?:|mailto:|#)/.test(href) || /data-selecteur-langue/.test(attrs)) continue;
        assert.ok(href.startsWith('/en/'), `${url} : lien ${href} hors de /en/`);
      }
    }
  }
});

test('G4 — une adresse inconnue sous /en/ donne la page introuvable en anglais (statut 404), une adresse française la 404 française', async (t) => {
  assert.ok(existsSync(join(DIST, 'en', '404.html')), 'dist/en/404.html absent');
  const env = await setupBrowser(t);
  if (!env) return;
  const page = await (await env.browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  for (const [url, langue] of [['/en/nimporte-quoi/', 'en'], ['/nimporte-quoi/', 'fr']]) {
    const rep = await page.goto(`${env.base}${url}`, { waitUntil: 'load' });
    assert.equal(rep.status(), 404, url);
    assert.equal(await page.getAttribute('html', 'lang'), langue, `${url} : langue`);
    assert.equal(await page.locator('[data-non-traduite]').count(), 0, `${url} : bandeau sur la 404`);
    // le contrôle mène à l'accueil de l'autre langue
    assert.equal(await page.locator('header a[data-selecteur-langue]').first().getAttribute('href'), langue === 'en' ? '/' : '/en/');
  }
});

test('G5 — parcours au clic : /about/ → /en/about/ (bandeau visible) → /about/, à 1440 et 390 px', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1440, 390]) {
    const page = await (await env.browser.newContext({ viewport: { width, height: 900 } })).newPage();
    await page.goto(`${env.base}/about/`, { waitUntil: 'load' });
    await pageReady(page);
    const ouvrirMenu = async () => {
      if (width >= 1024) return;
      await page.locator('header button[aria-controls="mobile-menu"]').click();
    };
    const controle = () => page.locator(width >= 1024 ? 'header nav a[data-selecteur-langue]:visible' : '#mobile-menu a[data-selecteur-langue]').first();
    await ouvrirMenu();
    await controle().click();
    await page.waitForURL(`${env.base}/en/about/`);
    await pageReady(page);
    assert.equal(await page.getAttribute('html', 'lang'), 'en');
    const bandeau = page.locator('[data-non-traduite]');
    assert.ok(await bandeau.isVisible(), `${width} px : bandeau invisible`);
    assert.ok((await bandeau.textContent()).includes(BANDEAU));
    const boite = await bandeau.boundingBox();
    assert.ok(boite.y < 900, `${width} px : bandeau sous le pli (${boite.y})`);
    await ouvrirMenu();
    await controle().click();
    await page.waitForURL(`${env.base}/about/`);
    await pageReady(page);
    assert.equal(await page.getAttribute('html', 'lang'), 'fr');
    assert.equal(await page.locator('[data-non-traduite]').count(), 0);
  }
});

test('G6 — tablette tactile (pointeur grossier) : le contrôle de langue de la barre fait au moins 44 × 44 px, en français comme en anglais', { timeout: 120_000 }, async (t) => {
  // revue UX (L112) : 31 px de large au toucher (WCAG 2.5.8 vise 24 px, la règle du site 44 px comme les autres
  // boutons de la barre). La barre reste mesurée par navbar.e2e et l111-barre-anglaise.
  const env = await setupBrowser(t);
  if (!env) return;
  for (const [width, height] of [[1024, 768], [1366, 1024]]) {
    for (const url of ['/about/', '/en/case-studies/cadence/', '/en/about/']) {
      const context = await env.browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true });
      const page = await context.newPage();
      await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
      await page.goto(`${env.base}${url}`, { waitUntil: 'load' });
      assert.ok(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'pointeur grossier non émulé');
      const boite = await page.locator('header nav a[data-selecteur-langue]:visible').first().boundingBox();
      const debord = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      const m = await measureBar(page);
      await context.close();
      t.diagnostic(`${width}×${height} ${url} : contrôle ${boite.width} × ${boite.height} px, ${m.slack} px après le logo`);
      assert.ok(m.mode === 'barre' && m.navOverflow <= 0 && m.slack >= 16, `${width}px ${url} : barre ${m.mode}, ${m.slack} px après le logo`);
      assert.ok(boite.width >= 44 && boite.height >= 44, `${width}px ${url} : contrôle de ${boite.width} × ${boite.height} px`);
      assert.ok(debord <= 0, `${width}px ${url} : la page déborde de ${debord} px`);
    }
  }
});
