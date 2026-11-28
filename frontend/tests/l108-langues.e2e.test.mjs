// L108 (D-5) — deux langues dans le site. Critères d'acceptation de la consigne du lot :
// 1) /en/case-studies/cadence/ existe et est en anglais ; 2) depuis /case-studies/cadence/ le sélecteur mène
// à la version EN de la même page et retour (L112 : le contrôle de langue unique de la barre) ; 3) toutes les URL françaises répondent comme avant ;
// 4) hreflang fr/en sur les deux versions ; 5) sélecteur utilisable au clavier et au toucher (≥ 44 px),
// lisible à 390 px. Plus : chiffres, dates et sources identiques des deux côtés ; une page sans traduction
// le dit au lieu de mener à une 404. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, setupBrowser, pageReady } from './lib/e2e-dist.mjs';

const PAGES = fileURLToPath(new URL('../src/pages/', import.meta.url));
const FR = '/case-studies/cadence/';
const EN = '/en/case-studies/cadence/';
const lire = (url) => readFileSync(join(DIST, url, 'index.html'), 'utf8');
const main = (html) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));
const plain = (frag) =>
  frag.split('<').map((morceau) => morceau.slice(morceau.indexOf('>') + 1)).join(' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[  ]/g, ' ').replace(/\s+/g, ' ');

/** Les pages françaises, d'après les sources (src/pages hors en/) : leur adresse construite. */
function adressesFr() {
  const out = [];
  const visiter = (dir) => {
    for (const nom of readdirSync(dir)) {
      const f = join(dir, nom);
      if (statSync(f).isDirectory()) {
        if (nom !== 'en') visiter(f);
        continue;
      }
      if (!nom.endsWith('.astro') || nom.includes('[')) continue;
      const r = relative(PAGES, f).replace(/\.astro$/, '');
      if (r === '404') continue;
      out.push(r === 'index' ? '/' : `/${r.replace(/\/index$/, '')}/`);
    }
  };
  visiter(PAGES);
  return out;
}

/** Nombres d'un texte, écrits de la même façon des deux côtés (milliers collés, virgule décimale → point). */
function nombres(texte, langue) {
  let t = texte;
  t = langue === 'fr'
    ? t.replace(/(\d)[   ](?=\d{3}(?!\d))/g, '$1').replace(/(\d),(?=\d)/g, '$1.')
    : t.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
  return (t.match(/\d+(?:\.\d+)*/g) ?? []).sort();
}

const bloc = (html, attr, id) => {
  const m = main(html);
  const i = m.indexOf(`${attr}="${id}"`);
  assert.ok(i >= 0, `${attr}="${id}" absent`);
  const debut = m.lastIndexOf('<', i);
  const tag = m.slice(debut + 1).match(/^\w+/)[0];
  // fin du bloc : la balise fermante de même niveau (les blocs ne s'imbriquent pas dans leur propre type)
  let profondeur = 0;
  for (const m2 of m.slice(debut).matchAll(new RegExp(`<(/?)${tag}[\\s>]`, 'g'))) {
    profondeur += m2[1] ? -1 : 1;
    if (profondeur === 0) return m.slice(debut, debut + m2.index);
  }
  return m.slice(debut);
};

test('C1 — /en/case-studies/cadence/ existe, en anglais (lang, titre, texte)', () => {
  assert.ok(existsSync(join(DIST, EN, 'index.html')), 'page anglaise non construite');
  const en = lire(EN);
  assert.match(en, /<html[^>]*lang="en"/);
  assert.match(en, /<h1[^>]*>\s*A plan tied to the commits/);
  const mots = plain(main(en)).toLowerCase().split(/[^\p{L}']+/u);
  const compte = (liste) => mots.filter((w) => liste.includes(w)).length;
  const anglais = compte(['the', 'and', 'of', 'is', 'with', 'what']);
  const francais = compte(['le', 'les', 'des', 'est', 'avec', 'une', 'du', 'qui', 'dans', 'pour']);
  assert.ok(anglais > 300, `trop peu de mots anglais (${anglais})`);
  assert.ok(francais <= 6, `${francais} mots français courants dans la page anglaise`);
});

test('C3 — chaque page française est construite à son adresse de toujours, en français, sans redirection', () => {
  const adresses = adressesFr();
  assert.ok(adresses.length >= 38, `${adresses.length} pages seulement`);
  for (const a of adresses) {
    const f = join(DIST, a, 'index.html');
    assert.ok(existsSync(f), `${a} : non construite`);
    const html = readFileSync(f, 'utf8');
    assert.match(html, /<html[^>]*lang="fr"/, `${a} : lang`);
    assert.doesNotMatch(html, /http-equiv="refresh"/, `${a} : redirection`);
  }
});

test('C4 — hreflang fr, en et x-default réciproques sur les deux versions ; aucun sur une page non traduite', () => {
  const SITE = 'https://claude-code-codex-25m.pages.dev';
  for (const url of [FR, EN]) {
    const html = lire(url);
    assert.ok(html.includes(`<link rel="alternate" hreflang="fr" href="${SITE}${FR}">`), `${url} : hreflang fr`);
    assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="${SITE}${EN}">`), `${url} : hreflang en`);
    assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${SITE}${FR}">`), `${url} : x-default`);
    assert.ok(html.includes(`<link rel="canonical" href="${SITE}${url}">`), `${url} : canonique sur elle-même`);
  }
  // L111 : « No English yet » est un lien (hreflang="en") vers l'étude cadence ; pas de version alternative pour autant.
  assert.doesNotMatch(lire('/about/'), /<link rel="alternate" hreflang=/);
});

test('C6 — contrôle de langue sur chaque page, dans la barre (L112) ; aucun lien ne mène vers une page /en/ absente', () => {
  const pages = [...adressesFr(), EN];
  for (const a of pages) {
    const html = lire(a);
    // L112 : un seul contrôle, dans la barre du haut (plus de sélecteur posé dans chaque page)
    assert.equal(html.split('data-selecteur-langue').length - 1, 1, `${a} : un seul contrôle de langue attendu`);
    assert.match(html.slice(html.indexOf('<header'), html.indexOf('</header>')), /data-selecteur-langue/, `${a} : contrôle hors de la barre`);
    for (const [, href] of html.matchAll(/href="(\/en\/[^"#]*)"/g)) {
      assert.ok(existsSync(join(DIST, href, 'index.html')), `${a} : lien vers ${href}, page absente`);
    }
  }
  // L112 : une page sans traduction mène à sa propre adresse /en/ (texte français et bandeau « Not translated yet »)
  const about = lire('/about/');
  assert.match(about, /<a[^>]*href="\/en\/about\/"[^>]*data-selecteur-langue/);
  assert.doesNotMatch(about, /No English yet/);
});

test('C7 — mêmes chiffres, dates et sources des deux côtés, carte par carte et sur toute la page', () => {
  const fr = lire(FR);
  const en = lire(EN);
  for (const [attr, ids] of [
    ['data-v1-chiffre', ['essai', 'lot', 'tests', 'revue']],
    ['data-v1-cause', ['C1', 'C2', 'C3', 'C4', 'C5']],
    ['data-v2-decision', ['run', 'banc', 'modeles', 'contexte', 'code']],
    ['data-echec', ['classement', 'regression-apparente', 'publication', 'reglages-copies', 'mesure-manquante']],
  ]) {
    for (const id of ids) {
      assert.deepEqual(nombres(plain(bloc(en, attr, id)), 'en'), nombres(plain(bloc(fr, attr, id)), 'fr'), `${attr}=${id} : nombres`);
    }
  }
  assert.deepEqual(nombres(plain(main(en)), 'en'), nombres(plain(main(fr)), 'fr'), 'nombres de toute la page');
  const sources = (html) => [...main(html).matchAll(/href="(https:\/\/[^"]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(sources(en), sources(fr), 'liens vers les sources');
  const images = (html) => [...main(html).matchAll(/<img[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(images(en), images(fr), 'captures');
});

async function ouvrir(env, url, options) {
  const context = await env.browser.newContext(options);
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  await page.goto(`${env.base}${url}`);
  await pageReady(page);
  return { context, page };
}

test('C2 — le contrôle de la barre mène de la page française à sa version anglaise au clavier, et retour au toucher (menu du téléphone)', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await ouvrir(env, FR, { viewport: { width: 1440, height: 900 } });
  // clavier : Tab jusqu'au contrôle « EN » de la barre (il vient tôt dans l'ordre de tabulation), puis Entrée
  let trouve = false;
  for (let i = 0; i < 40 && !trouve; i++) {
    await page.keyboard.press('Tab');
    trouve = await page.evaluate(() => document.activeElement?.matches('header a[data-selecteur-langue][hreflang="en"]'));
  }
  assert.ok(trouve, 'contrôle « EN » jamais atteint au clavier');
  await Promise.all([page.waitForURL(`**${EN}`), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert.match(await page.locator('h1').innerText(), /A plan tied to the commits/);
  await context.close();

  const tel = await ouvrir(env, EN, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await tel.page.locator('button[aria-controls="mobile-menu"]').tap();
  await Promise.all([tel.page.waitForURL(`**${FR}`), tel.page.locator('#mobile-menu a[data-selecteur-langue][hreflang="fr"]').tap()]);
  await tel.page.waitForFunction(() => document.documentElement.lang === 'fr');
  assert.match(await tel.page.locator('h1').innerText(), /Un plan relié aux commits/);
  await tel.context.close();
});

/** Ouvre le menu du téléphone et mesure son contrôle de langue (L112 : il est dans le menu de la barre). */
async function controleDuMenu(page, largeur) {
  await page.locator('button[aria-controls="mobile-menu"]').click();
  const c = page.locator('#mobile-menu a[data-selecteur-langue]');
  await c.waitFor({ state: 'visible' });
  return c.evaluate((e, l) => {
    const b = e.getBoundingClientRect();
    return { texte: e.textContent.trim(), w: b.width, h: b.height, gauche: b.left, droite: b.right, haut: b.top, bas: b.bottom, ecran: innerHeight,
      police: parseFloat(getComputedStyle(e).fontSize), scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth, largeur: l };
  }, largeur);
}

test('C5 — à 390 px : le contrôle de langue du menu est visible dès l’ouverture, cible ≥ 44 px, texte ≥ 14 px, sans défilement horizontal', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const url of [FR, EN, '/about/', '/en/about/']) {
    const { context, page } = await ouvrir(env, url, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const r = await controleDuMenu(page, 390);
    await context.close();
    assert.ok(r.scroll <= 0, `${url} : défilement horizontal de ${r.scroll} px`);
    assert.ok(r.gauche >= 0 && r.droite <= 390, `${url} : « ${r.texte} » hors de l'écran`);
    assert.ok(r.bas <= r.ecran, `${url} : « ${r.texte} » sous le pli du menu (${r.bas} > ${r.ecran})`);
    assert.ok(r.police >= 14, `${url} : « ${r.texte} » à ${r.police} px`);
    assert.ok(r.w >= 44 && r.h >= 44, `${url} : cible « ${r.texte} » de ${r.w}×${r.h} px`);
  }
});

test('C5 bis — texte agrandi de 100 à 200 % à 320 et 390 px : le contrôle de langue du menu reste entier dans l’écran', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const url of ['/', FR, EN, '/about/', '/livre-de-bord/']) {
    for (const largeur of [320, 390]) {
      for (const taille of [100, 125, 150, 175, 200]) {
        const { context, page } = await ouvrir(env, url, { viewport: { width: largeur, height: 800 } });
        await page.evaluate((n) => { document.documentElement.style.fontSize = `${n}%`; }, taille);
        const r = await controleDuMenu(page, largeur);
        await context.close();
        const ou = `${url} @${largeur}px ${taille} %`;
        assert.ok(r.gauche >= 0 && r.droite <= largeur, `${ou} : contrôle hors de l'écran ${JSON.stringify(r)}`);
        assert.ok(r.scroll <= 0, `${ou} : défilement horizontal`);
      }
    }
  }
});

test('Les schémas de la page anglaise : textes dans leurs boîtes, à 390 et 1440 px', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const largeur of [390, 1440]) {
    const { context, page } = await ouvrir(env, EN, { viewport: { width: largeur, height: 900 } });
    const hors = await page.evaluate(() => [...document.querySelectorAll('figure[data-schema] > svg')].flatMap((svg) => {
      const rects = [...svg.querySelectorAll('rect')].map((e) => e.getBBox());
      return [...svg.querySelectorAll('text')].filter((e) => {
        // un texte qui commence dans une boîte doit y finir (« cited by » est entre les boîtes) ; le mot de la
        // boucle est tourné le long de la marge droite, hors des boîtes
        if (e.closest('[data-boucle]')) return false;
        const b = e.getBBox();
        const boite = rects.find((rc) => b.x >= rc.x && b.x <= rc.x + rc.width && b.y >= rc.y && b.y <= rc.y + rc.height);
        return boite && b.x + b.width > boite.x + boite.width - 4;
      }).map((e) => `${svg.closest('figure').dataset.schema} : ${e.textContent}`);
    }));
    await context.close();
    assert.deepEqual(hors, [], `${largeur} px : texte(s) hors de leur boîte`);
  }
});
