// L114 — /ecosystem, bascules de filtre (Plugin, Serveur MCP, Skill, Outil / SDK) : le visiteur voit
// l'effet de son clic sans défiler, et rien ne bouge sous son doigt. Constats des revues :
// - revue UX de L109 (27-11) : à 390 px, le compteur « n / N entrées », placé sous les bascules, sortait
//   de la vue (861-877 px pour un écran de 844) ;
// - revue de code de L114 (28-11) : à police 200 %, l'apparition de « Réinitialiser » faisait descendre
//   les 4 bascules de 32 px ; à 112,5 % (390 px) et 125 % (320 px), la bascule pressée s'élargissait
//   (coche ajoutée) et changeait de ligne ;
// - revue UX de L114 (28-11) : à 390 × 844, la première carte restait sous le pli (917 px) après le clic ;
//   « Réinitialiser » faisait 20 px de haut (< 24) ; après lui, au clavier, le focus tombait sur <body>.
// Mesuré sur le site CONSTRUIT (`npx astro build` avant), polices web bloquées.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';

const BASCULES = 'button[aria-pressed]';

async function open(env, { width, height, fontSize }) {
  const context = await env.browser.newContext({ viewport: { width, height } });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  if (fontSize !== '100%') {
    await page.addInitScript((z) => {
      document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = z; });
    }, fontSize);
  }
  await page.goto(`${env.base}/ecosystem/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every((i) => !i.hasAttribute('ssr')));
  return { context, page };
}

// Position de chaque bascule du catalogue (relative au document), compteur et première carte (vue).
const MESURE = (ile) => {
  const statut = [...ile.querySelectorAll('[role="status"]')].find((s) => /entrées/.test(s.textContent));
  const r = statut.getBoundingClientRect();
  const carte = ile.querySelector(':scope ul > li:has(h3)');
  return {
    bascules: [...ile.querySelectorAll('button[aria-pressed]')].map((b) => {
      const q = b.getBoundingClientRect();
      return [Math.round(q.left + scrollX), Math.round(q.top + scrollY), Math.round(q.width)];
    }),
    compteur: { top: r.top, bottom: r.bottom, texte: statut.textContent.trim() },
    cartes: ile.querySelectorAll(':scope ul > li:has(h3)').length,
    carte: carte ? { top: carte.getBoundingClientRect().top, etiquette: carte.querySelector('p').getBoundingClientRect().bottom } : null,
    vue: innerHeight,
    scrollY,
  };
};

// Écarts d'un clic sur la bascule i : compteur hors de la vue, bascule déplacée, largeur changée, compte faux.
function ecartsDuClic(avant, m, i, ou) {
  const constats = [];
  if (m.compteur.top < 0 || m.compteur.bottom > m.vue) {
    constats.push(`${ou} : compteur à ${Math.round(m.compteur.top)}..${Math.round(m.compteur.bottom)} hors de la vue (${m.vue})`);
  }
  m.bascules.forEach((p, j) => {
    const a = avant.bascules[j];
    if (p[0] !== a[0] || p[1] !== a[1]) constats.push(`${ou} : bascule ${j + 1} passée de (${a[0]}, ${a[1]}) à (${p[0]}, ${p[1]})`);
    if (j === i && p[2] !== a[2]) constats.push(`${ou} : largeur de la bascule pressée ${a[2]} → ${p[2]} px`);
  });
  const [affiche] = m.compteur.texte.match(/^\d+/) ?? [];
  if (Number(affiche) !== m.cartes) constats.push(`${ou} : compteur « ${m.compteur.texte} » pour ${m.cartes} cartes`);
  return constats;
}

const CONFIGS = [
  ...['100%', '112.5%', '200%'].flatMap((fontSize) => [
    { width: 390, height: 844, fontSize },
    { width: 1440, height: 900, fontSize },
  ]),
  { width: 320, height: 844, fontSize: '125%' },
  { width: 320, height: 844, fontSize: '200%' },
];

for (const cfg of CONFIGS) {
  test(`L114 — ${cfg.width} px, police ${cfg.fontSize} : chaque clic sur une bascule se voit, aucune bascule ne bouge`, { timeout: 180_000 }, async (t) => {
    const env = await setupBrowser(t);
    if (!env) return;
    const { context, page } = await open(env, cfg);
    const iles = page.locator('astro-island:has(button[aria-pressed])');
    const nIles = await iles.count();
    assert.ok(nIles >= 1, 'aucun catalogue filtrable');
    const constats = [];
    for (let k = 0; k < nIles; k++) {
      const ile = iles.nth(k);
      const bascules = ile.locator(BASCULES);
      const n = await bascules.count();
      assert.ok(n >= 4, `${n} bascules`);
      for (let i = 0; i < n; i++) {
        const b = bascules.nth(i);
        for (const clic of ['premier', 'second']) {
          await b.scrollIntoViewIfNeeded();
          const avant = await ile.evaluate(MESURE);
          await b.click();
          const m = await ile.evaluate(MESURE);
          const nom = (await b.textContent()).replace(/\s+/g, ' ').trim();
          constats.push(...ecartsDuClic(avant, m, i, `catalogue ${k + 1}, ${nom}, ${clic} clic`));
        }
      }
      // Une recherche fait aussi apparaître « Réinitialiser » : les bascules restent en place.
      const avant = await ile.evaluate(MESURE);
      await ile.locator('input[type="search"]').fill('claude');
      const apres = await ile.evaluate(MESURE);
      if (JSON.stringify(apres.bascules.map((p) => p.slice(0, 2))) !== JSON.stringify(avant.bascules.map((p) => p.slice(0, 2)))) {
        constats.push(`catalogue ${k + 1}, saisie d'une recherche : bascules ${JSON.stringify(avant.bascules)} → ${JSON.stringify(apres.bascules)}`);
      }
      await ile.locator('input[type="search"]').fill('');
    }
    assert.deepEqual(constats, []);
    await context.close();
  });
}

test('L114 — 390 × 844 : sans défiler, chaque clic sur une bascule du catalogue officiel montre le début de la liste', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env, { width: 390, height: 844, fontSize: '100%' });
  const ile = page.locator('astro-island:has(button[aria-pressed])').first();
  const bascules = ile.locator(BASCULES);
  const n = await bascules.count();
  const constats = [];
  const repos = await ile.evaluate(MESURE);
  repos.bascules.forEach(([, top], j) => {
    if (top + 34 > repos.vue) constats.push(`au repos, bascule ${j + 1} sous le pli (${top} px)`);
  });
  for (let i = 0; i < n; i++) {
    for (const clic of ['premier', 'second']) {
      await bascules.nth(i).click();
      const m = await ile.evaluate(MESURE);
      const ou = `bascule ${i + 1}, ${clic} clic`;
      if (m.scrollY !== 0) constats.push(`${ou} : la page a défilé (${m.scrollY} px)`);
      // Début de la liste : la carte ET son étiquette de catégorie (« Outil / SDK · officiel ») entières.
      if (!m.carte || m.carte.etiquette > m.vue) {
        constats.push(`${ou} : première carte à ${Math.round(m.carte?.top)} px, étiquette jusqu'à ${Math.round(m.carte?.etiquette)} (vue ${m.vue})`);
      }
    }
  }
  assert.deepEqual(constats, []);
  await context.close();
});

test('L114 — « Réinitialiser » : 24 px de haut au moins ; après lui, au clavier, le focus va au champ de recherche', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const constats = [];
  for (const width of [320, 390, 1440]) {
    const { context, page } = await open(env, { width, height: 844, fontSize: '100%' });
    const ile = page.locator('astro-island:has(button[aria-pressed])').first();
    const reset = ile.locator('[data-reinitialiser]');
    // Sans filtre, le bouton n'est ni visible ni atteignable au clavier.
    if (await reset.isVisible()) constats.push(`${width} : « Réinitialiser » visible sans filtre`);
    await ile.locator(BASCULES).first().click();
    const h = await reset.evaluate((el) => el.getBoundingClientRect().height);
    if (h < 24) constats.push(`${width} : « Réinitialiser » fait ${h} px de haut`);
    await reset.focus();
    await page.keyboard.press('Enter');
    const actif = await page.evaluate(() => {
      const a = document.activeElement;
      return a.type ? `${a.tagName}[${a.type}]` : a.tagName;
    });
    if (actif !== 'INPUT[search]') constats.push(`${width} : après « Réinitialiser », focus sur ${actif}`);
    if (await ile.locator('button[aria-pressed="true"]').count()) constats.push(`${width} : filtre encore actif`);

    // Liste vide : « Réinitialiser les filtres » renvoie aussi au champ de recherche.
    await ile.locator('input[type="search"]').fill('zzzz-aucune-entree');
    const vide = ile.getByRole('button', { name: 'Réinitialiser les filtres' });
    await vide.focus();
    await page.keyboard.press('Enter');
    const actif2 = await page.evaluate(() => document.activeElement?.getAttribute('type'));
    if (actif2 !== 'search') constats.push(`${width} : après « Réinitialiser les filtres », focus sur ${actif2}`);
    await context.close();
  }
  assert.deepEqual(constats, []);
});
