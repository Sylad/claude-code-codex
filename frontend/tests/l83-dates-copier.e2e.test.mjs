// L83 — suite de la revue UX de L81, mesurée sur le site CONSTRUIT (`npx astro build` avant ; « skip »
// sans playwright-core ni Chromium). Avant L83 (ba68d6c) :
//  m1. /nouveautes à 320 px texte 200 % : le libellé « Copier le lien » sortait de 26 px de son bouton
//      (« Lien copié » 34 px, « Copie impossible » 7 px) (WCAG 1.4.4, 1.4.10) ;
//  m2. « prochaine avant le 22 | décembre 2026 » : jour seul en fin de ligne à 375 et 390 px (bloc
//      « Dernière revue » de /videos, /learning, /theory), et à 200 % sur /nouveautes, /plan-de-travail,
//      /livre-de-bord (typographie française : insécable entre le jour et le mois).
// Une date ne sépare son jour de son mois que si « jour mois » ne tient pas sur une ligne entière de son
// bloc ; elle ne coupe jamais un nombre et son texte ne sort jamais de son bloc.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser, pageReady } from './lib/e2e-dist.mjs';

const zoom200 = () => document.addEventListener('DOMContentLoaded', () => {
  const s = document.createElement('style');
  s.textContent = 'html{font-size:200% !important}';
  document.head.append(s);
});

async function contexte(env, width, zoom) {
  const context = await env.browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage();
  if (zoom) await page.addInitScript(zoom200);
  return { context, page };
}

async function aller(env, page, route) {
  await page.goto(`${env.base}${route}`, { waitUntil: 'networkidle' });
  await pageReady(page);
}

test('L83 (m1) — les trois libellés de « Copier le lien » restent dans leur bouton, 320, 390 et 1440 px, texte 100 et 200 %', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  let mesures = 0;
  for (const width of [320, 390, 1440]) for (const zoom of [false, true]) {
    const { context, page } = await contexte(env, width, zoom);
    await aller(env, page, '/nouveautes/');
    // Chaque état affiché à son tour, comme le fait le script de la page (classe is-hidden).
    for (const etat of ['idle', 'ok', 'ko']) {
      const r = await page.evaluate((etat) => {
        const out = { n: 0, defauts: [] };
        for (const b of document.querySelectorAll('button.news-copy')) {
          b.querySelectorAll('.news-copy-label').forEach((l) => l.classList.toggle('is-hidden', l.dataset.for !== etat));
          const br = b.getBoundingClientRect();
          const l = b.querySelector(`.news-copy-label[data-for="${etat}"]`);
          const rg = document.createRange();
          rg.selectNodeContents(l);
          out.n++;
          for (const q of rg.getClientRects()) {
            const hors = Math.max(q.right - br.right, br.left - q.left, q.bottom - br.bottom, br.top - q.top);
            if (hors > 0.5) { out.defauts.push(`« ${l.textContent} » sort de ${Math.round(hors)} px (${b.dataset.slug})`); break; }
          }
        }
        return out;
      }, etat);
      mesures += r.n;
      failures.push(...r.defauts.map((d) => `@${width} px ${zoom ? '200 %' : '100 %'} ${etat} : ${d}`));
    }
    await context.close();
  }
  assert.ok(mesures >= 6 * 3 * 5, `${mesures} libellé(s) mesuré(s) seulement`);
  assert.deepEqual([...new Set(failures)], []);
});

const ROUTES = ['/nouveautes/', '/plan-de-travail/', '/livre-de-bord/', '/videos/', '/learning/', '/theory/'];
const CONFIGS = [
  { width: 320, zoom: true },
  { width: 375, zoom: false },
  { width: 390, zoom: false },
  { width: 390, zoom: true },
  { width: 1440, zoom: false },
];

test('L83 (m2) — date : jour jamais seul en fin de ligne quand « jour mois » tient sur une ligne, aucun nombre coupé, texte dans son bloc', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  let dates = 0;
  for (const cfg of CONFIGS) {
    const { context, page } = await contexte(env, cfg.width, cfg.zoom);
    for (const route of ROUTES) {
      await aller(env, page, route);
      const r = await page.evaluate(() => {
        const out = { n: 0, defauts: [] };
        for (const el of document.querySelectorAll('main time')) {
          if (!el.getBoundingClientRect().width) continue;
          out.n++;
          const texte = el.textContent.replace(/\s+/g, ' ');
          // Bloc qui contient la date : premier ancêtre qui n'est pas en ligne ; bord de son contenu.
          let blk = el.parentElement;
          while (getComputedStyle(blk).display.startsWith('inline')) blk = blk.parentElement;
          const cs = getComputedStyle(blk);
          const cb = blk.getBoundingClientRect();
          const gauche = cb.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft);
          const droite = cb.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight);
          const mots = [];
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          for (let n = w.nextNode(); n; n = w.nextNode()) {
            for (const x of n.data.matchAll(/[^\s  ]+/g)) {
              const rg = document.createRange();
              rg.setStart(n, x.index);
              rg.setEnd(n, x.index + x[0].length);
              const rs = [...rg.getClientRects()];
              mots.push({ mot: x[0], lignes: new Set(rs.map((q) => Math.round(q.top))), largeur: rs.reduce((a, q) => a + q.width, 0), droite: Math.max(...rs.map((q) => q.right)) });
            }
          }
          for (const m of mots) {
            if (m.lignes.size > 1) out.defauts.push(`« ${m.mot} » coupé dans « ${texte} »`);
            if (m.droite > droite + 0.5) out.defauts.push(`« ${m.mot} » sort de son bloc de ${Math.round(m.droite - droite)} px dans « ${texte} »`);
          }
          const i = mots.findIndex((m) => /^\d+(er)?$/.test(m.mot));
          if (i < 0 || !mots[i + 1]) continue;
          const [jour, mois] = [mots[i], mots[i + 1]];
          if ([...jour.lignes][0] === [...mois.lignes][0]) continue;
          // Séparés : seulement si « jour mois » (avec l'espace) ne tient pas sur une ligne du bloc.
          const sonde = document.createElement('span');
          sonde.textContent = '\u00a0';
          el.append(sonde);
          const espace = sonde.getBoundingClientRect().width;
          sonde.remove();
          const besoin = jour.largeur + espace + mois.largeur;
          if (besoin <= droite - gauche) out.defauts.push(`jour seul en fin de ligne dans « ${texte} » (« jour mois » ${Math.round(besoin)} px, ligne ${Math.round(droite - gauche)} px)`);
        }
        return out;
      });
      dates += r.n;
      failures.push(...r.defauts.map((d) => `@${cfg.width} px ${cfg.zoom ? '200 %' : '100 %'} ${route} ${d}`));
    }
    await context.close();
  }
  assert.ok(dates >= 100, `${dates} date(s) mesurée(s) seulement`);
  assert.deepEqual([...new Set(failures)], []);
});
