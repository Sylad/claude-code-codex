// L9 — revue UX r1 des guides longs (tmp/ux-codex-L9-r1.md), un test par écart, mesuré sur le site CONSTRUIT
// (`npx astro build` avant ; tests navigateur en « skip » sans playwright-core/Chromium) :
//  R1 (majeur, Nielsen 2 et 4) : la légende du schéma du tunnel de Cloudflare dit ce que montre le dessin —
//     aucune connexion ouverte depuis Internet ; les requêtes passent DANS le tunnel, dessinées du même
//     trait que les connexions sortantes, sens annoté.
//  m1 : à 390 px, ce schéma tient dans son cadre (341 px pour 333 au r1) ; r3 : à 360 px aussi, barre classique.
//  m2 : aucune arête du schéma ne barre le titre d'un cadre (« Chez toi … »).
//  m3 : à 320 px et texte à 200 %, plus de coupure au milieu de « Kubernetes » (h1), « Sommaire », « Spring »
//     (cartes de traduction) ; moins de mots coupés en tout ; toujours aucun défilement horizontal.
//  m4 : « Revenir au sommaire » place le focus sur le sommaire.
// m1 et m2 se mesurent avec la police réelle des schémas (JetBrains Mono, Google Fonts, comme
// mots-coupes.e2e) : sans elle, les libellés sont plus étroits et le débord ne se voit pas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const CF = '/cloudflare-pour-les-nuls/';
const GUIDES = ['k8s-for-java-developers', 'argocd-k8s-pour-les-nuls', 'cloudflare-pour-les-nuls'];
const TUNNEL = 'section#tunnel figure:has([data-mermaid-inline])';

async function ouvrir(env, path, width, { zoom = false, polices = true } = {}) {
  const context = await env.browser.newContext({ viewport: { width, height: 900 } });
  if (!polices) await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  if (zoom) await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'html{font-size:200% !important}';
      document.head.append(s);
    });
  });
  await page.goto(`${env.base}${path}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

/** Schéma du tunnel dessiné, avec la police réelle (sinon : test sans objet). */
async function schemaTunnel(t, page) {
  const fig = page.locator(TUNNEL);
  await fig.scrollIntoViewIfNeeded();
  await page.waitForFunction((s) => document.querySelector(s)?.querySelector('[data-mermaid-inline] svg'), TUNNEL, { timeout: 20_000 });
  const police = await page.evaluate(() => document.fonts.check("13px 'JetBrains Mono'"));
  if (!police) t.skip('JetBrains Mono injoignable (Google Fonts) : débord non mesurable');
  return police;
}

test('R1 — la légende du tunnel ne contredit plus le dessin (texte de la page)', () => {
  const h = readFileSync(join(DIST, 'cloudflare-pour-les-nuls', 'index.html'), 'utf8').replace(/&#39;|&#x27;/g, "'");
  const legendes = [...h.matchAll(/caption(?:=|&quot;:\[0,&quot;)([^\]&]*?Internet[^\]]*?)(?:&quot;\]|")/g)].map((m) => m[1]);
  const vu = (re) => re.test(h) ? 'présent' : 'absent';
  assert.equal(vu(/Aucune flèche n'entre dans la maison/), 'absent', 'ancienne légende');
  assert.equal(vu(/Aucune connexion n'est ouverte depuis Internet vers (la maison|chez toi)/), 'présent', `légende : ${legendes.join(' | ')}`);
  assert.equal(vu(/tunnel que cloudflared a ouvert lui-même/), 'présent', `légende : ${legendes.join(' | ')}`);
  // Le dessin : plus de flèche épaisse (« ==> ») des requêtes qui entrerait chez toi hors du tunnel.
  const def = h.match(/flowchart TB[\s\S]*?cfd --&gt; svc|flowchart TB[\s\S]*?cfd --> svc/)?.[0] ?? '';
  assert.ok(def, 'définition du schéma du tunnel introuvable');
  assert.equal(/==&gt;|==>/.test(def), false, `flèche épaisse dans : ${def.slice(-400)}`);
});

test('R1 — dans le dessin, les requêtes passent par le tunnel : même trait que les connexions sortantes, sens annoté', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await ouvrir(env, CF, 1440, { polices: false });
  const fig = page.locator(TUNNEL);
  await fig.scrollIntoViewIfNeeded();
  await page.waitForFunction((s) => document.querySelector(s)?.querySelector('[data-mermaid-inline] svg'), TUNNEL, { timeout: 20_000 });
  const r = await page.evaluate((s) => {
    const svg = document.querySelector(s).querySelector('[data-mermaid-inline] svg');
    const aretes = [...svg.querySelectorAll('path.flowchart-link')]
      .filter((p) => /^L_(cf_cfd|cfd_cf)_/.test(p.dataset.id ?? ''))
      .map((p) => ({ id: p.dataset.id, dash: getComputedStyle(p).strokeDasharray, w: getComputedStyle(p).strokeWidth }));
    const libelles = [...svg.querySelectorAll('.edgeLabel')].map((l) => l.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
    return { aretes, libelles, legende: document.querySelector(s).querySelector('figcaption')?.textContent ?? '' };
  }, TUNNEL);
  await context.close();
  const sortantes = r.aretes.find((a) => a.id.startsWith('L_cfd_cf_'));
  const requetes = r.aretes.find((a) => a.id.startsWith('L_cf_cfd_'));
  assert.ok(sortantes && requetes, `arêtes du tunnel : ${JSON.stringify(r.aretes)}`);
  assert.equal(requetes.dash, sortantes.dash, `requêtes ${requetes.dash}, connexions sortantes ${sortantes.dash} : pas le même trait`);
  assert.equal(requetes.w, sortantes.w, `requêtes ${requetes.w}, connexions sortantes ${sortantes.w} : pas la même épaisseur`);
  assert.notEqual(sortantes.dash, '0px', 'le tunnel n\'est plus en pointillé');
  // Sens annoté : 1 = cloudflared ouvre le tunnel (sortant), 2 = les requêtes y redescendent.
  assert.ok(r.libelles.some((l) => /^1\b.*(ouvre|sortant)/i.test(l)), `libellés : ${r.libelles.join(' | ')}`);
  assert.ok(r.libelles.some((l) => /^2\b.*requêtes.*tunnel/i.test(l)), `libellés : ${r.libelles.join(' | ')}`);
  assert.match(r.legende, /Aucune connexion n'est ouverte depuis Internet/);
});

// r3 (revue UX r2, n1) : à 360 px, avec une barre de défilement classique (≈ 15 px, celle d'un navigateur de
// bureau rétréci — le Chromium de test la cache par défaut), le schéma débordait encore de 8 px (311 dans 303).
// Mesuré avec et sans cette barre, à 390 et 360 px.
async function navigateurBarreClassique() {
  const require = createRequire(new URL('../package.json', import.meta.url));
  const { chromium } = require('playwright-core');
  return chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
}

test('m1 — à 390 et 360 px, le schéma du tunnel tient dans son cadre (police réelle, barre de défilement classique ou non)', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const classique = await navigateurBarreClassique();
  t.after(() => classique.close());
  for (const [nom, browser] of [['barre cachée', env.browser], ['barre classique', classique]]) {
    for (const width of [390, 360]) {
      const { context, page } = await ouvrir({ ...env, browser }, CF, width);
      if (!(await schemaTunnel(t, page))) { await context.close(); return; }
      const r = await page.evaluate((s) => {
        const c = document.querySelector(s).querySelector('[data-mermaid-inline]');
        return { cadre: c.clientWidth, contenu: c.scrollWidth, region: c.getAttribute('role'), barre: innerWidth - document.documentElement.clientWidth };
      }, TUNNEL);
      await context.close();
      if (nom === 'barre classique') assert.ok(r.barre > 0, `${width} px : barre de défilement non classique, rien de mesuré`);
      assert.ok(r.contenu <= r.cadre, `${width} px, ${nom} : ${r.contenu} px de schéma pour un cadre de ${r.cadre} px`);
      assert.equal(r.region, null, `${width} px, ${nom} : le schéma défile (région)`);
    }
  }
});

test('m2 — aucune arête ne barre le titre d\'un cadre du schéma du tunnel', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1440, 390]) {
    const { context, page } = await ouvrir(env, CF, width);
    if (!(await schemaTunnel(t, page))) { await context.close(); return; }
    const croisements = await page.evaluate((s) => {
      const svg = document.querySelector(s).querySelector('[data-mermaid-inline] svg');
      const titres = [...svg.querySelectorAll('.cluster-label')].map((l) => {
        // La boîte du texte lui-même (le conteneur du libellé peut être plus large que le texte).
        const span = l.querySelector('span, p, text') ?? l;
        const range = document.createRange();
        range.selectNodeContents(span);
        const b = range.getBoundingClientRect();
        return { texte: l.textContent.trim(), b };
      });
      const out = [];
      for (const p of svg.querySelectorAll('path.flowchart-link')) {
        const ctm = p.getScreenCTM();
        const len = p.getTotalLength();
        for (let d = 0; d <= len; d += 1) {
          const pt = p.getPointAtLength(d).matrixTransform(ctm);
          for (const { texte, b } of titres) {
            if (pt.x >= b.left && pt.x <= b.right && pt.y >= b.top && pt.y <= b.bottom) {
              out.push(`${p.dataset.id} barre « ${texte} »`);
              d = len + 1;
              break;
            }
          }
        }
      }
      return out;
    }, TUNNEL);
    await context.close();
    assert.deepEqual(croisements, [], `${width} px`);
  }
});

// Mots coupés au milieu (hors trait d'union), comme le relevé de la revue : un mot = lettres et chiffres.
function coupes() {
  const out = [];
  const range = document.createRange();
  const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const el = n.parentElement;
    if (!el || el.closest('svg, pre, script, style, [aria-hidden="true"]') || !el.getClientRects().length) continue;
    for (const m of n.data.matchAll(/[\p{L}\p{N}]+/gu)) {
      range.setStart(n, m.index);
      range.setEnd(n, m.index + m[0].length);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0.5);
      const ys = [...new Set(rects.map((r) => Math.round(r.top)))].sort((a, b) => a - b);
      if (ys.length > 1 && ys.at(-1) - ys[0] >= rects[0].height / 2) {
        out.push({ mot: m[0], tag: el.tagName.toLowerCase(), carte: !!el.closest('[data-traduction-cartes]'), sommaire: !!el.closest('summary') });
      }
    }
  }
  return out;
}

test('m3 — 320 px, texte 200 % : « Kubernetes », « Sommaire », « Spring » entiers ; moins de mots coupés ; pas de défilement', { timeout: 240_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  // Relevé (ce script, police réelle) : r1 = k8s 65, argocd 80, cloudflare 61 ; après correction 17, 27, 12.
  // Plafond de k8s : son niveau du r0 (18) ; les autres, le relevé corrigé plus une petite marge.
  const PLAFOND = { 'k8s-for-java-developers': 18, 'argocd-k8s-pour-les-nuls': 30, 'cloudflare-pour-les-nuls': 15 };
  for (const g of GUIDES) {
    const { context, page } = await ouvrir(env, `/${g}/`, 320, { zoom: true });
    const c = await page.evaluate(`(${coupes})()`);
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    await context.close();
    assert.equal(debord, 0, `${g} : ${debord} px de défilement horizontal`);
    const resume = c.map((x) => x.mot).join(', ');
    assert.deepEqual(c.filter((x) => x.tag === 'h1').map((x) => x.mot), [], `${g} : titre coupé`);
    assert.deepEqual(c.filter((x) => x.sommaire).map((x) => x.mot), [], `${g} : sommaire coupé`);
    assert.deepEqual(c.filter((x) => x.mot === 'Spring').map((x) => x.mot), [], `${g} : « Spring » coupé`);
    assert.ok(c.length <= PLAFOND[g], `${g} : ${c.length} mots coupés (plafond ${PLAFOND[g]}) : ${resume}`);
  }
});

test('m4 — « Revenir au sommaire » place le focus sur le sommaire', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const g of GUIDES) {
    const { context, page } = await ouvrir(env, `/${g}/`, 390, { polices: false });
    const lien = page.locator('[data-guide-section]').nth(2).locator('[data-retour-sommaire]');
    await lien.scrollIntoViewIfNeeded();
    await lien.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const a = document.activeElement;
      return {
        dansSommaire: !!a?.closest('#sommaire [data-sommaire-mobile]'),
        tag: a?.tagName.toLowerCase(),
        haut: document.getElementById('sommaire').getBoundingClientRect().top,
        visible: a ? a.getBoundingClientRect().top >= 0 && a.getBoundingClientRect().bottom <= innerHeight : false,
      };
    });
    await context.close();
    assert.ok(r.dansSommaire, `${g} : focus sur <${r.tag}>, hors du sommaire`);
    assert.equal(r.tag, 'summary', `${g} : focus sur <${r.tag}>`);
    assert.ok(r.visible && r.haut >= 0 && r.haut < 200, `${g} : sommaire à ${r.haut} px, focus visible ${r.visible}`);
  }
});
