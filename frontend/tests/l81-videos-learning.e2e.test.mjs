// L81 — suites de la revue L10 (/videos, /learning) et des dates du site, mesurées sur le site
// CONSTRUIT (`npx astro build` avant ; « skip » sans playwright-core ni Chromium). Avant L81 :
//  2. le texte d'exemple du champ de recherche tronqué à 320 px texte 200 % (« Rechercher ( »)
//     (WCAG 1.4.4 et 3.3.2 ; Nielsen 6 : l'exemple n'est plus lisible, et il disparaît à la saisie) ;
//  3. deux arrêts clavier par carte, le titre et l'icône vers la même adresse (30 pour 15)
//     (WCAG 2.4.3 ; Nielsen 8 : un arrêt sans information nouvelle) ;
//  4. le nombre des filtres de /learning en `opacity-70` : 4,38:1 sur un filtre choisi (< 4,5:1, WCAG 1.4.3) ;
//  5. le nom du bouton GitHub de /about lu « GitHub flèche vers le haut à droite… » (« ↗ » non masqué).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser, pageReady } from './lib/e2e-dist.mjs';

const CONFIGS = [
  { name: '1440 px', width: 1440 },
  { name: '390 px', width: 390 },
  { name: '320 px', width: 320 },
  { name: '320 px texte 200 %', width: 320, zoom: true },
];

async function ouvrir(env, { width, zoom = false }, route) {
  const context = await env.browser.newContext({ viewport: { width, height: 800 } });
  const page = await context.newPage();
  if (zoom) await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'html{font-size:200% !important}';
      document.head.append(s);
    });
  });
  await page.goto(`${env.base}${route}`, { waitUntil: 'networkidle' });
  await pageReady(page);
  return { context, page };
}

function pagesHtml(dir = DIST) {
  const out = [];
  for (const nom of readdirSync(dir)) {
    const p = join(dir, nom);
    if (statSync(p).isDirectory()) out.push(...pagesHtml(p));
    else if (nom.endsWith('.html')) out.push(p);
  }
  return out;
}

// La flèche visible d'un lien est décorative : elle ne doit pas être recopiée dans son nom (un libellé
// de capture qui DÉCRIT la flèche, dans une Nouveauté, n'est pas visé : le lien n'affiche pas de ↗).
test('L81 (5) — aucun lien ni bouton qui affiche « ↗ » ne la recopie dans son nom, sur tout le site', () => {
  const failures = [];
  for (const f of pagesHtml()) {
    for (const [, nom, contenu] of readFileSync(f, 'utf8').matchAll(/<(?:a|button)\b[^>]*aria-label="([^"]*)"[^>]*>([\s\S]*?)<\/(?:a|button)>/g)) {
      if (nom.includes('↗') && contenu.replace(/<[^>]*>/g, '').includes('↗')) failures.push(`${f.slice(DIST.length)} : « ${nom} »`);
    }
  }
  assert.deepEqual(failures, []);
  // Le bouton GitHub de /about (et de l'accueil) garde son nom, son « nouvel onglet », et sa flèche visible.
  for (const route of ['about', '']) {
    const html = readFileSync(join(DIST, route, 'index.html'), 'utf8');
    const a = html.match(/<a\b[^>]*href="https:\/\/github\.com\/Sylad"[^>]*aria-label="GitHub[^>]*>[\s\S]*?<\/a>/)?.[0];
    assert.ok(a, `/${route} : bouton GitHub introuvable`);
    assert.match(a, /aria-label="GitHub — [^"]*\(nouvel onglet\)"/, `/${route}`);
    assert.match(a, /<span aria-hidden="true">↗<\/span>/, `/${route}`);
  }
});

test('L81 (2) — le champ de recherche de /videos et /learning : aucun texte d’exemple tronqué, un libellé visible', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const cfg of CONFIGS) {
    for (const route of ['/videos/', '/learning/']) {
      const { context, page } = await ouvrir(env, cfg, route);
      const m = await page.evaluate(() => {
        const i = document.querySelector('main input[type="search"]');
        const s = getComputedStyle(i);
        const place = i.getAttribute('placeholder') ?? '';
        let largeur = 0;
        if (place) {
          const c = document.createElement('canvas').getContext('2d');
          c.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
          largeur = c.measureText(place).width;
        }
        const dispo = i.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
        const libelle = i.labels?.[0];
        const lb = libelle?.getBoundingClientRect();
        return { place, largeur, dispo, libelle: libelle?.textContent.trim().replace(/\s+/g, ' ') ?? '',
          libelleVisible: !!lb && lb.width > 0 && lb.height > 0, libelleDeborde: !!lb && lb.right > innerWidth + 0.5 };
      });
      const where = `@${cfg.name} ${route}`;
      if (m.place && m.largeur > m.dispo + 0.5) failures.push(`${where} : « ${m.place} » tronqué (${Math.round(m.largeur)} px pour ${Math.round(m.dispo)})`);
      if (!m.libelleVisible) failures.push(`${where} : pas de libellé visible`);
      if (m.libelleDeborde) failures.push(`${where} : libellé hors de l’écran`);
      if (!/auteur/.test(m.libelle)) failures.push(`${where} : libellé sans exemple « ${m.libelle} »`);
      await context.close();
    }
  }
  assert.deepEqual(failures, []);
});

test('L81 (3) — un seul arrêt clavier par carte de /videos et /learning (le RSS de /learning, autre adresse, en plus)', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const route of ['/videos/', '/learning/']) {
    const { context, page } = await ouvrir(env, CONFIGS[0], route);
    const cartes = await page.evaluate(() => [...document.querySelectorAll('main ul.grid > li')].map((li) => {
      const arrets = [...li.querySelectorAll('a[href], button, input, [tabindex]')]
        .filter((e) => e.tabIndex >= 0 && !e.closest('[inert]'));
      return { nom: li.querySelector('h2, h3')?.textContent.trim(), hrefs: arrets.map((e) => e.getAttribute('href')),
        rss: !!li.querySelector('a[title="Flux RSS"]') };
    }));
    assert.ok(cartes.length >= 10, `${route} : ${cartes.length} carte(s)`);
    for (const c of cartes) {
      const attendu = 1 + (c.rss ? 1 : 0);
      if (c.hrefs.length !== attendu) failures.push(`${route} « ${c.nom} » : ${c.hrefs.length} arrêts (attendu ${attendu})`);
      if (new Set(c.hrefs).size !== c.hrefs.length) failures.push(`${route} « ${c.nom} » : deux arrêts vers la même adresse`);
    }
    // Au clavier, vraiment : de la recherche à la fin de la grille, un arrêt par carte (+ RSS).
    const total = cartes.reduce((n, c) => n + 1 + (c.rss ? 1 : 0), 0);
    const vus = await page.evaluate(() => [...document.querySelectorAll('main ul.grid > li a')].filter((a) => a.tabIndex >= 0).length);
    assert.equal(vus, total, route);
    // L'icône reste cliquable à la souris et ouvre la même adresse que le titre.
    const icone = await page.evaluate(() => {
      const li = document.querySelector('main ul.grid > li');
      const liens = [...li.querySelectorAll('a[href]')].filter((a) => !a.matches('[title="Flux RSS"]'));
      return { n: liens.length, memes: new Set(liens.map((a) => a.href)).size, cachee: liens.slice(1).every((a) => a.getAttribute('aria-hidden') === 'true') };
    });
    assert.equal(icone.memes, 1, `${route} : l’icône et le titre vont au même endroit`);
    assert.ok(icone.cachee, `${route} : l’icône en double est cachée aux lecteurs d’écran`);
    await context.close();
  }
  assert.deepEqual(failures, []);
});

test('L81 (4) — nombre des filtres de /learning et /videos : ≥ 4,5:1, au repos et choisi', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const route of ['/learning/', '/videos/']) {
    const { context, page } = await ouvrir(env, CONFIGS[0], route);
    const mesurer = () => page.evaluate(() => {
      // Transition des couleurs au clic (transition-colors) : on mesure l'état final.
      for (const a of document.getAnimations()) a.finish();
      const rgba = (css) => {
        const c = document.createElement('canvas').getContext('2d');
        c.fillStyle = css; c.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = c.getImageData(0, 0, 1, 1).data;
        return [r, g, b, a / 255];
      };
      const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
      const ratio = (x, y) => { const [a, b] = [L(x), L(y)].sort((m, n) => n - m); return (a + 0.05) / (b + 0.05); };
      const paper = rgba(getComputedStyle(document.body).backgroundColor);
      return [...document.querySelectorAll('main button[aria-pressed]')].map((btn) => {
        const n = btn.querySelector('.font-mono');
        let alpha = rgba(getComputedStyle(n).color)[3];
        for (let e = n; e && e !== btn.parentElement; e = e.parentElement) alpha *= Number(getComputedStyle(e).opacity);
        const fondBtn = rgba(getComputedStyle(btn).backgroundColor);
        const fond = fondBtn[3] === 1 ? fondBtn : paper;
        const texte = rgba(getComputedStyle(n).color).slice(0, 3).map((v, i) => v * alpha + fond[i] * (1 - alpha));
        return { nom: btn.textContent.trim().replace(/\s+/g, ' '), choisi: btn.getAttribute('aria-pressed'), k: ratio(texte, fond.slice(0, 3)) };
      });
    });
    const repos = await mesurer();
    assert.ok(repos.length >= 2, `${route} : ${repos.length} filtre(s)`);
    for (const b of await page.locator('main button[aria-pressed]').all()) await b.click();
    const choisis = await mesurer();
    for (const m of [...repos, ...choisis]) {
      if (m.k < 4.5) failures.push(`${route} « ${m.nom} » (choisi : ${m.choisi}) : ${m.k.toFixed(2)}:1`);
    }
    await context.close();
  }
  assert.deepEqual(failures, []);
});
