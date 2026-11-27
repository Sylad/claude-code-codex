// L111 — suites de L108. Critères de la consigne du lot : barre et pied en anglais sur chaque page /en/, en
// français ailleurs ; « No English yet » (accueil, /case-studies/) mène à l'étude cadence en anglais ;
// « (in French) » sur la citation de l'étape 7 du schéma du livreur ; aucun débord à 320 et 1440 px.
// Les attentes sont lues dans la source des libellés (src/lib/libelles-site.mjs). Lit dist : build avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DIST, setupBrowser, pageReady } from './lib/e2e-dist.mjs';
import { LIBELLES } from '../src/lib/libelles-site.mjs';
import { ENTREE_EN } from '../src/lib/langues.mjs';
import { SEEN_KEY, OLD_VISIT } from './lib/mesure-barre.mjs';

const EN = '/en/case-studies/cadence/';

/** Toutes les pages construites (hors 404), par adresse. */
function pagesConstruites() {
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

// texte sans balises : chaque morceau après « < » perd sa balise (jusqu'au premier « > »), sans expression à retour arrière
const sansBalises = (frag) => frag.split('<').map((m, i) => (i === 0 ? m : m.slice(m.indexOf('>') + 1))).join(' ');
const plain = (frag) => sansBalises(frag).replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ').trim();
const entre = (html, debut, fin) => html.slice(html.indexOf(debut), html.indexOf(fin, html.indexOf(debut)) + fin.length);

/** Textes attendus d'une langue, dans l'ordre du HTML. */
function attendus(langue) {
  const L = LIBELLES[langue];
  const barre = L.barre.flatMap((l) => (l.children ? [l.label, ...l.children.map((c) => c.label)] : [l.label]));
  const P = L.pied;
  const pied = [...P.site.map((l) => l.label), P.resume, P.apprendre, ...P.apprendreLiens.map((l) => l.label), P.liens, P.claudeCode, P.depot, P.mentions, P.vibe];
  return { barre, pied };
}

test('B1 — chaque page construite : barre et pied dans la langue de la page (anglais sous /en/, français ailleurs)', () => {
  const pages = pagesConstruites();
  assert.ok(pages.includes(EN) && pages.includes('/'), 'site non construit');
  for (const url of pages) {
    const html = readFileSync(join(DIST, url, 'index.html'), 'utf8');
    const langue = url.startsWith('/en/') ? 'en' : 'fr';
    const autre = langue === 'en' ? 'fr' : 'en';
    const header = plain(entre(html, '<header', '</header>'));
    const footer = plain(entre(html, '<footer', '</footer>'));
    const a = attendus(langue);
    assert.equal(header, `claude-code-codex ${a.barre.join(' ')}`, `${url} : barre`);
    for (const t of a.pied) assert.ok(footer.includes(t), `${url} : pied sans « ${t} »`);
    // rien de l'autre langue qui ne soit pas aussi dans celle-ci
    const b = attendus(autre);
    const contient = (texte, mot) => new RegExp(`(?<![\\p{L}])${mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'u').test(texte);
    for (const t of [...b.barre, ...b.pied]) if (![...a.barre, ...a.pied].includes(t)) assert.ok(!contient(footer, t) && !contient(header, t), `${url} : « ${t} » (${autre})`);
    // la barre et le pied ne se déclarent plus dans une autre langue que la page
    assert.doesNotMatch(entre(html, '<header', '>'), /\blang=/, `${url} : lang sur la barre`);
    assert.doesNotMatch(entre(html, '<footer', '>'), /\blang=/, `${url} : lang sur le pied`);
    assert.match(html, new RegExp(`<html[^>]*lang="${langue}"`));
    // nom accessible du logo et du menu
    assert.ok(html.includes(`aria-label="${LIBELLES[langue].accueil}"`), `${url} : nom du logo`);
    assert.ok(html.includes(`aria-label="${LIBELLES[langue].pied.navSite}"`), `${url} : nom de la rangée du pied`);
  }
});

test('B2 — sur une page anglaise, un lien vers une page qui n’existe qu’en français le dit (hreflang="fr") ; les liens vers une page traduite vont à /en/', () => {
  const html = readFileSync(join(DIST, EN, 'index.html'), 'utf8');
  for (const zone of [entre(html, '<header', '</header>'), entre(html, '<footer', '</footer>')]) {
    for (const [, attrs] of zone.matchAll(/<a\b([^>]*)>/g)) {
      const href = attrs.match(/href="([^"]+)"/)?.[1];
      if (!href || href.startsWith('http')) continue;
      if (href.startsWith('/en/')) assert.ok(existsSync(join(DIST, href, 'index.html')), `${href} : page absente`);
      else assert.match(attrs, /hreflang="fr"/, `${href} sans hreflang="fr"`);
    }
  }
  const fr = readFileSync(join(DIST, 'about', 'index.html'), 'utf8');
  assert.doesNotMatch(entre(fr, '<header', '</header>') + entre(fr, '<footer', '</footer>'), /hreflang=/, 'page française : aucun hreflang dans la barre ni le pied');
});

test('B3 — « (in French) » sur la citation de l’étape 7 du schéma du livreur (dessin et liste)', () => {
  const html = readFileSync(join(DIST, EN, 'index.html'), 'utf8');
  const fig = entre(html, 'data-schema="chaine-livreur"', '</figure>');
  const cite = '“L84 livré 3d6edf4, QA à lancer &lt;url&gt;” (in French)';
  assert.equal(fig.split(cite).length - 1, 3, 'dessin, description accessible et liste');
  const fr = readFileSync(join(DIST, 'case-studies', 'cadence', 'index.html'), 'utf8');
  assert.doesNotMatch(fr, /in French/, 'la page française ne change pas');
});

test('B4 — « No English yet » (accueil, /case-studies/) est un lien vers l’étude cadence en anglais, et y mène', async (t) => {
  assert.equal(ENTREE_EN, EN);
  const env = await setupBrowser(t);
  if (!env) return;
  for (const url of ['/', '/case-studies/']) {
    const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${env.base}${url}`, { waitUntil: 'load' });
    await pageReady(page);
    const lien = page.locator('[data-selecteur-langue] a[data-langue-absente="en"]');
    assert.equal(await lien.count(), 1, `${url} : pas de lien « No English yet »`);
    assert.equal((await lien.textContent()).trim(), 'No English yet');
    assert.equal(await lien.getAttribute('href'), EN);
    const nom = await lien.getAttribute('aria-label');
    assert.ok(nom.startsWith('No English yet') && /cadence/.test(nom), `${url} : nom accessible « ${nom} »`);
    const b = await lien.boundingBox();
    assert.ok(b.height >= 44 && b.width >= 44, `${url} : cible ${b.width}×${b.height}`);
    await lien.click();
    await page.waitForURL(`${env.base}${EN}`);
    await pageReady(page);
    // après la navigation (routeur des transitions), la barre est celle de la page anglaise
    await page.waitForFunction((t) => document.querySelector('header ul a')?.textContent.trim() === t, LIBELLES.en.barre[0].label);
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    // et le retour au français rend la barre française
    await page.click('[data-selecteur-langue] a[data-langue="fr"]');
    await page.waitForURL(`${env.base}/case-studies/cadence/`);
    await page.waitForFunction((t) => document.querySelector('header ul a')?.textContent.trim() === t, LIBELLES.fr.barre[0].label);
    await context.close();
  }
});

test('B5 — menu du téléphone en anglais sur /en/ (nom du bouton, liens), en français ailleurs', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const [url, langue] of [[EN, 'en'], ['/', 'fr']]) {
    const L = LIBELLES[langue];
    const context = await env.browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${env.base}${url}`, { waitUntil: 'load' });
    await pageReady(page);
    const bouton = page.locator('button[aria-controls="mobile-menu"]');
    assert.ok((await bouton.getAttribute('aria-label')).startsWith(L.menuOuvrir), `${url} : bouton du menu`);
    await bouton.click();
    assert.equal(await bouton.getAttribute('aria-label'), L.menuFermer);
    const textes = await page.$$eval('#mobile-menu a, #mobile-menu li > div', (els) => els.map((e) => {
      const c = e.cloneNode(true);
      c.querySelectorAll('.news-badge, .sr-only').forEach((x) => x.remove());
      return c.textContent.trim();
    }));
    const a = [...L.barre.flatMap((l) => (l.children ? [l.label, ...l.children.map((c) => c.label)] : [l.label])), ...L.telephone.map((l) => l.label)];
    assert.deepEqual(textes, a, `${url} : menu du téléphone`);
    await context.close();
  }
});

test('B6 — aucun débord à 320 et 1440 px (page, barre, pied, sélecteur), anglais et français', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const ecarts = [];
  for (const url of [EN, '/', '/case-studies/']) {
    for (const width of [320, 1440]) {
      const context = await env.browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${env.base}${url}`, { waitUntil: 'load' });
      await pageReady(page);
      const m = await page.evaluate(() => {
        const deborde = (e) => (e ? e.scrollWidth - e.clientWidth : 0);
        const horsEcran = [...document.querySelectorAll('header a, header button, footer a, [data-selecteur-langue] a, [data-selecteur-langue] span')]
          .filter((e) => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0)
          .filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; })
          .map((e) => e.textContent.trim() || e.getAttribute('aria-label'));
        return {
          page: document.documentElement.scrollWidth - innerWidth,
          barre: deborde(document.querySelector('header nav')),
          pied: Math.max(...[...document.querySelectorAll('footer ul, footer div')].map(deborde)),
          horsEcran,
        };
      });
      if (m.page > 0 || m.barre > 0 || m.pied > 0 || m.horsEcran.length) ecarts.push(`${url} ${width}px : ${JSON.stringify(m)}`);
      await context.close();
    }
  }
  assert.deepEqual(ecarts, []);
});

test('B7 — pastille Nouveautés : le texte lu à l’écran (lien de la barre, bouton du menu) est dans la langue de la page', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const [url, langue] of [[EN, 'en'], ['/about/', 'fr']]) {
    const L = LIBELLES[langue];
    for (const width of [1440, 390]) {
      const context = await env.browser.newContext({ viewport: { width, height: 900 } });
      await context.addInitScript(([k, v]) => localStorage.setItem(k, v), [SEEN_KEY, JSON.stringify(OLD_VISIT)]);
      const page = await context.newPage();
      await page.goto(`${env.base}${url}`, { waitUntil: 'load' });
      await pageReady(page);
      const badge = page.locator(width >= 1024 ? 'header nav .news-badge' : 'button[aria-controls="mobile-menu"] .news-badge').first();
      await badge.waitFor({ state: 'visible' });
      const badgeTexte = (await badge.textContent()).trim();
      const lu = width >= 1024
        ? (await page.locator('header nav .sr-only').evaluateAll((els) => els.map((e) => e.textContent.trim()))).find((x) => /\d/.test(x)) ?? ''
        : (await page.locator('button[aria-controls="mobile-menu"]').getAttribute('aria-label')) ?? '';
      const n = Number(lu.match(/\d+/)?.[0] ?? 0);
      assert.ok(n > 0, `${url} ${width} : aucun compte lu (${JSON.stringify(lu)})`);
      assert.equal(badgeTexte, n > 9 ? '9+' : String(n), `${url} ${width} : pastille et texte lu ne disent pas le même compte`);
      const attendu = width >= 1024 ? `(${L.nonVues(n)})` : `${L.menuOuvrir} (${L.nonVues(n)})`;
      assert.equal(lu, attendu, `${url} ${width} : texte lu de la pastille`);
      const autre = LIBELLES[langue === 'en' ? 'fr' : 'en'].nonVues(n);
      assert.ok(!(await page.locator('header').innerText()).includes(autre) && !(await page.locator('header').innerHTML()).includes(autre), `${url} ${width} : texte de l’autre langue`);
      await context.close();
    }
  }
});
