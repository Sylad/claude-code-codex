// L12 — revue UX du gabarit commun (barre de navigation, en-tête de page, pied), WCAG 2.2 AA et
// Nielsen, mesurée sur le site CONSTRUIT (`npx astro build` avant ; « skip » sans playwright-core
// ni Chromium) à 1440, 390, 320 px et 320 px texte 200 %. Avant L12 (1c7fac7) :
//  1. contour de focus = celui du navigateur : `outline: auto 1px`, dessin et couleur laissés au
//     navigateur (Chromium : anneau fin blanc et noir ; la couleur calculée, rgb(16,16,16), ne dit
//     rien de ce qui est peint), alors que les sommaires du site ont déjà un contour orange de 2 px
//     (2.4.7, 1.4.11 ; Nielsen 4). Mesuré ici : contour plein, ≥ 2 px, ≥ 3:1 sur le papier ;
//  2. à 320 px texte 200 %, le nom du site dans la barre tronqué à « c… » (44 px montrés sur 277)
//     (1.4.4, 1.4.10 ; Nielsen 4 : un logo illisible) ;
//  3. au clavier en remontant (Maj+Tab), à 320 px texte 200 %, deux liens de /about entièrement
//     cachés sous la barre fixe (2.4.11, focus non masqué) ;
//  4. en-têtes numérotés « 01 · Théorie » … « 06 · À propos » sans rapport avec l'ordre de la barre
//     (Théorie y est 3e, Démarrer et Atelier IA sans numéro, Learning et Vidéos rangés sous
//     « Ressources », À propos absent de la barre) (Nielsen 4, cohérence ; WCAG 3.2.4) ;
//  5. trois liens du pied ouvrent un nouvel onglet sans le dire, quand /about le dit (L11)
//     (Nielsen 1 et 4, WCAG G201).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser, pageReady } from './lib/e2e-dist.mjs';
import { jetons } from './lib/contraste.mjs';

const html = (route) => readFileSync(join(DIST, route, 'index.html'), 'utf8');
const NAVBAR = readFileSync(new URL('../src/components/site/Navbar.vue', import.meta.url), 'utf8');

/** Les quatre configurations de la revue. `zoom` : texte de la page à 200 % (html font-size). */
const CONFIGS = [
  { name: '1440 px', width: 1440 },
  { name: '390 px', width: 390 },
  { name: '320 px', width: 320 },
  { name: '320 px texte 200 %', width: 320, zoom: true },
];

async function ouvrir(env, { width, zoom = false, fontSize = 16 }, route = '/about/') {
  const context = await env.browser.newContext({ viewport: { width, height: 800 } });
  const page = await context.newPage();
  if (fontSize !== 16) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: fontSize, fixed: Math.round(fontSize * 13 / 16) } });
  }
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

/** Ratio WCAG entre deux couleurs sRGB [r, g, b]. */
function ratio(a, b) {
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = ([r, g, bl]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(bl);
  const [x, y] = [L(a), L(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

test('L12 (4) — l’en-tête des pages de la barre reprend son libellé (et son groupe), sans numéro', () => {
  const attendus = {
    theory: 'Théorie',
    ecosystem: 'Écosystème',
    'case-studies': 'Case studies',
    learning: 'Ressources · Learning',
    videos: 'Ressources · Vidéos',
    about: 'Le site · À propos',
  };
  for (const [route, eyebrow] of Object.entries(attendus)) {
    const hero = html(route).split('<main')[1].split('</h1>')[0];
    const p = hero.match(/<p[^>]*tracking-\[0\.2em\][^>]*>\s*([\s\S]*?)\s*<\/p>/);
    assert.ok(p, `/${route}/ : surtitre introuvable`);
    const texte = p[1].replace(/&#39;/g, "'").trim();
    assert.doesNotMatch(texte, /^\d+\s*·/, `/${route}/ : surtitre numéroté « ${texte} »`);
    assert.equal(texte, eyebrow, `/${route}/`);
    // Chaque partie est un libellé réel de la barre (ou du pied, pour « Le site »).
    for (const part of texte.split(' · ').filter((x) => x !== 'Le site')) {
      assert.match(NAVBAR, new RegExp(`label: "${part}"`), `« ${part} » n’est pas un libellé de la barre`);
    }
  }
  assert.match(readFileSync(new URL('../src/components/site/Footer.astro', import.meta.url), 'utf8'), /aria-label="Le site"/);
});

test('L12 (5) — tout lien du pied qui ouvre un nouvel onglet le dit (↗ visible et « nouvel onglet » lu)', () => {
  const pied = html('about').split('<footer')[1].split('</footer>')[0];
  const liens = [...pied.matchAll(/<a\b[^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g)].map((x) => x[0]);
  assert.ok(liens.length >= 3, `${liens.length} lien(s) externe(s) dans le pied`);
  for (const a of liens) {
    assert.match(a, /↗/, `sans ↗ : ${a.slice(0, 90)}`);
    assert.match(a, /aria-label="[^"]*\(nouvel onglet\)"/, `sans « nouvel onglet » : ${a.slice(0, 90)}`);
  }
});

test('L12 (1) — contour de focus du clavier : plein, ≥ 2 px, ≥ 3:1 sur le papier, dans la barre et le pied, aux quatre configurations', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const paper = jetons().paper;
  const failures = [];
  let vus = 0;
  for (const cfg of CONFIGS) {
    const { context, page } = await ouvrir(env, cfg);
    // Barre : lien d'évitement, logo, puis contrôles de la barre (ou bouton du menu).
    // Pied : on part juste avant lui pour en parcourir les liens.
    const parcours = [];
    for (let i = 0; i < 6; i++) parcours.push(async () => page.keyboard.press('Tab'));
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'avant-pied';
      b.textContent = 'x';
      document.querySelector('footer').before(b);
    });
    const mesurer = () => page.evaluate(() => {
      for (const a of document.getAnimations()) if (Number.isFinite(a.effect?.getComputedTiming().endTime)) a.finish();
      const e = document.activeElement;
      const s = getComputedStyle(e);
      const c = document.createElement('canvas').getContext('2d');
      c.fillStyle = s.outlineColor;
      c.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = c.getImageData(0, 0, 1, 1).data;
      return {
        nom: (e.getAttribute('aria-label') || e.textContent).trim().replace(/\s+/g, ' ').slice(0, 30),
        zone: e.closest('header') ? 'barre' : e.closest('footer') ? 'pied' : 'autre',
        style: s.outlineStyle, largeur: parseFloat(s.outlineWidth), rgb: [r, g, b], alpha: a,
      };
    });
    const relevés = [];
    for (const step of parcours) { await step(); relevés.push(await mesurer()); }
    await page.focus('#avant-pied');
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); relevés.push(await mesurer()); }
    for (const m of relevés) {
      if (m.zone === 'autre') continue;
      vus++;
      const where = `@${cfg.name} ${m.zone} « ${m.nom} »`;
      if (m.style !== 'solid') failures.push(`${where} : contour ${m.style}`);
      if (m.largeur < 2) failures.push(`${where} : contour de ${m.largeur} px`);
      if (m.alpha < 255) failures.push(`${where} : contour translucide`);
      const k = ratio(m.rgb, paper);
      if (k < 3) failures.push(`${where} : contour à ${k.toFixed(2)}:1 sur le papier`);
    }
    await context.close();
  }
  assert.ok(vus >= 30, `${vus} contrôle(s) mesuré(s) seulement`);
  assert.deepEqual(failures, []);
});

test('L12 (2) — le nom du site dans la barre est entier ou absent (icône seule), jamais tronqué ; le lien garde son nom', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  // Texte 200 % des deux façons : taille du texte de la page, et police par défaut du navigateur à 32 px.
  const cfgs = [...CONFIGS, { name: '320 px police par défaut 32 px', width: 320, fontSize: 32 },
    { name: '390 px texte 200 %', width: 390, zoom: true }, { name: '600 px texte 200 %', width: 600, zoom: true }];
  const etats = {};
  for (const cfg of cfgs) {
    const { context, page } = await ouvrir(env, cfg, '/');
    const m = await page.evaluate(() => {
      const a = document.querySelector('header nav > a');
      const w = a.querySelector('[data-wordmark]');
      const shown = getComputedStyle(w).display !== 'none';
      return { shown, tronque: shown && w.scrollWidth > w.clientWidth + 0.5, nom: a.getAttribute('aria-label'),
        page: document.documentElement.scrollWidth - innerWidth };
    });
    etats[cfg.name] = m.shown ? 'entier' : 'icône';
    if (m.tronque) failures.push(`@${cfg.name} : nom tronqué`);
    if (m.nom !== 'Claude Code Codex — accueil') failures.push(`@${cfg.name} : nom du lien « ${m.nom} »`);
    if (m.page > 0) failures.push(`@${cfg.name} : défilement horizontal de ${m.page} px`);
    await context.close();
  }
  t.diagnostic(JSON.stringify(etats));
  // Aux largeurs ordinaires, le nom reste affiché.
  for (const k of ['1440 px', '390 px', '320 px']) assert.equal(etats[k], 'entier', k);
  assert.deepEqual(failures, []);
});

test('L12 (3) — en remontant au clavier (Maj+Tab), aucun élément ne finit entièrement caché sous la barre fixe', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  let vus = 0;
  for (const cfg of [CONFIGS[1], CONFIGS[3]]) {
    for (const route of ['/about/', '/theory/']) {
      const { context, page } = await ouvrir(env, cfg, route);
      for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
      for (let i = 0; i < 20; i++) {
        await page.keyboard.press('Shift+Tab');
        const r = await page.evaluate(() => {
          const e = document.activeElement;
          // La barre elle-même et le lien d'évitement (posé au-dessus de la barre) ne comptent pas.
          if (e.closest('header') || e.getAttribute('href') === '#main') return null;
          const b = e.getBoundingClientRect();
          return { bas: b.bottom, barre: document.querySelector('header').getBoundingClientRect().bottom,
            nom: e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) };
        });
        if (!r) continue;
        vus++;
        if (r.bas <= r.barre + 1) failures.push(`@${cfg.name} ${route} « ${r.nom} » sous la barre (bas ${Math.round(r.bas)} ≤ ${Math.round(r.barre)})`);
      }
      await context.close();
    }
  }
  assert.ok(vus >= 40, `${vus} focus mesurés seulement`);
  assert.deepEqual(failures, []);
});

// L81 : /plan-de-travail (92 px à 320 px texte 200 %), /nouveautes (27 px) et /livre-de-bord (24 px) ajoutées.
test('L12 — gabarit sans défilement horizontal aux quatre configurations (accueil, /about, /theory, /learning, /plan-de-travail, /nouveautes, /livre-de-bord)', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const cfg of CONFIGS) {
    for (const route of ['/', '/about/', '/theory/', '/learning/', '/plan-de-travail/', '/nouveautes/', '/livre-de-bord/']) {
      const { context, page } = await ouvrir(env, cfg, route);
      const d = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (d > 0) failures.push(`@${cfg.name} ${route} : ${d} px`);
      await context.close();
    }
  }
  assert.deepEqual(failures, []);
});

// L81 — une date passe à la ligne entre ses mots, jamais au milieu d'un nombre (« 202|6 » dans le bloc
// « Dernière revue » à 320 px texte 200 %), et ne sort jamais de l'écran (« 22 novembre 2026 » insécable
// et `whitespace-nowrap` : /plan-de-travail, /nouveautes, /livre-de-bord) (WCAG 1.4.4, 1.4.10).
test('L81 (1) — dates : aucun nombre coupé, aucune date hors de l’écran, aux quatre configurations', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  let vues = 0;
  for (const cfg of CONFIGS) {
    for (const route of ['/plan-de-travail/', '/nouveautes/', '/livre-de-bord/', '/theory/', '/videos/']) {
      const { context, page } = await ouvrir(env, cfg, route);
      const r = await page.evaluate(() => {
        const out = { vues: 0, defauts: [] };
        for (const el of document.querySelectorAll('main time')) {
          const b = el.getBoundingClientRect();
          if (!b.width) continue;
          out.vues++;
          if (b.right > innerWidth + 0.5 || b.left < -0.5) out.defauts.push(`« ${el.textContent} » hors de l’écran (${Math.round(b.right - innerWidth)} px)`);
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n; n = w.nextNode()) {
            for (const m of n.data.matchAll(/\S+/g)) {
              const rg = document.createRange();
              rg.setStart(n, m.index);
              rg.setEnd(n, m.index + m[0].length);
              if (new Set([...rg.getClientRects()].map((x) => Math.round(x.top))).size > 1) out.defauts.push(`« ${m[0]} » coupé dans « ${el.textContent} »`);
            }
          }
        }
        return out;
      });
      vues += r.vues;
      for (const d of r.defauts) failures.push(`@${cfg.name} ${route} ${d}`);
      await context.close();
    }
  }
  assert.ok(vues >= 40, `${vues} date(s) mesurée(s) seulement`);
  assert.deepEqual([...new Set(failures)], []);
});
