// L108 (D-5) — deux langues dans le site. Critères d'acceptation de la consigne du lot :
// 1) /en/case-studies/cadence/ existe et est en anglais ; 2) depuis /case-studies/cadence/ le sélecteur mène
// à la version EN de la même page et retour ; 3) toutes les URL françaises répondent comme avant ;
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

test('C6 — sélecteur sur chaque page ; sans traduction il le dit, et aucun lien ne mène vers une page /en/ absente', () => {
  const pages = [...adressesFr(), EN];
  for (const a of pages) {
    const html = lire(a);
    assert.match(html, /data-selecteur-langue/, `${a} : pas de sélecteur`);
    for (const [, href] of html.matchAll(/href="(\/en\/[^"#]*)"/g)) {
      assert.ok(existsSync(join(DIST, href, 'index.html')), `${a} : lien vers ${href}, page absente`);
    }
  }
  const about = lire('/about/');
  assert.match(about, /data-langue-absente="en"[^>]*>No English yet</);
  assert.doesNotMatch(about, /data-langue="en"/);
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

test('C2 — le sélecteur mène de la page française à sa version anglaise au clavier, et retour au toucher', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await ouvrir(env, FR, { viewport: { width: 1440, height: 900 } });
  // clavier : Tab jusqu'au lien « English » (il vient tôt dans l'ordre de tabulation), puis Entrée
  let trouve = false;
  for (let i = 0; i < 40 && !trouve; i++) {
    await page.keyboard.press('Tab');
    trouve = await page.evaluate(() => document.activeElement?.matches('[data-selecteur-langue] a[hreflang="en"]'));
  }
  assert.ok(trouve, 'lien « English » jamais atteint au clavier');
  await Promise.all([page.waitForURL(`**${EN}`), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert.match(await page.locator('h1').innerText(), /A plan tied to the commits/);
  await context.close();

  const tel = await ouvrir(env, EN, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  await Promise.all([tel.page.waitForURL(`**${FR}`), tel.page.locator('[data-selecteur-langue] a[hreflang="fr"]').tap()]);
  await tel.page.waitForFunction(() => document.documentElement.lang === 'fr');
  assert.match(await tel.page.locator('h1').innerText(), /Un plan relié aux commits/);
  await tel.context.close();
});

test('C5 — à 390 px : cibles du sélecteur ≥ 44 px, visibles, sans défilement horizontal, texte ≥ 14 px', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const url of [FR, EN, '/about/']) {
    const { context, page } = await ouvrir(env, url, { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const r = await page.evaluate(() => {
      const nav = document.querySelector('[data-selecteur-langue]');
      const items = [...nav.querySelectorAll('a, span[lang]')].map((e) => {
        const b = e.getBoundingClientRect();
        return { texte: e.textContent.trim(), lien: e.tagName === 'A', w: b.width, h: b.height, gauche: b.left, droite: b.right, police: parseFloat(getComputedStyle(e).fontSize) };
      });
      return { items, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
    });
    await context.close();
    assert.ok(r.scroll <= 0, `${url} : défilement horizontal de ${r.scroll} px`);
    assert.equal(r.items.length, 2, `${url} : deux langues attendues`);
    for (const it of r.items) {
      assert.ok(it.gauche >= 0 && it.droite <= 390, `${url} : « ${it.texte} » hors de l'écran`);
      assert.ok(it.police >= 14, `${url} : « ${it.texte} » à ${it.police} px`);
      if (it.lien) assert.ok(it.w >= 44 && it.h >= 44, `${url} : cible « ${it.texte} » de ${it.w}×${it.h} px`);
    }
  }
});

test('C5 bis — texte agrandi de 100 à 200 % à 320 et 390 px : le sélecteur reste dans l’écran et ne recouvre rien', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const url of ['/', FR, EN, '/about/', '/livre-de-bord/']) {
    for (const largeur of [320, 390]) {
      const { context, page } = await ouvrir(env, url, { viewport: { width: largeur, height: 800 } });
      for (const taille of [100, 125, 150, 175, 200]) {
        await page.evaluate((n) => { document.documentElement.style.fontSize = `${n}%`; }, taille);
        // la césure du site suit la mise en page à l'image suivante : mesurer après elle (L88)
        await page.waitForFunction(() => {
          const b = document.body.getBoundingClientRect();
          return document.documentElement.dataset.cesureMesure === `${b.width}x${b.height}`;
        });
        const r = await page.evaluate(() => {
          const nav = document.querySelector('[data-selecteur-langue]');
          const n = nav.getBoundingClientRect();
          // le premier texte du contenu après le sélecteur (sur-titre, titre ou chapeau)
          const suivant = [...document.querySelectorAll('main h1, main p')].find((e) => !nav.contains(e) && e.getBoundingClientRect().height > 0);
          const s = suivant.getBoundingClientRect();
          const recouvre = !(n.bottom <= s.top || s.bottom <= n.top || n.right <= s.left || s.right <= n.left);
          return { n: [n.left, n.top, n.right, n.bottom].map(Math.round), s: Math.round(s.top), recouvre, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        const ou = `${url} @${largeur}px ${taille} %`;
        assert.ok(!r.recouvre, `${ou} : le sélecteur ${JSON.stringify(r.n)} recouvre le texte qui commence à ${r.s}`);
        assert.ok(r.n[0] >= 0 && r.n[2] <= largeur, `${ou} : sélecteur hors de l'écran ${JSON.stringify(r.n)}`);
        assert.ok(r.scroll <= 0, `${ou} : défilement horizontal`);
      }
      await context.close();
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
