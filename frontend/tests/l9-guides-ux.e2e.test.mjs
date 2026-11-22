// L9 — revue UX r0 des guides longs (/k8s-for-java-developers/, /argocd-k8s-pour-les-nuls/,
// /cloudflare-pour-les-nuls/), critères tirés du rapport de revue, mesurés sur le site CONSTRUIT
// (`npx astro build` avant ; tests navigateur en « skip » sans playwright-core/Chromium) :
//  B1 (bloquant, WCAG 1.4.3) : la note du diagramme de séquence de Cloudflare tient dans son cadre,
//     aux couleurs du site (plus le jaune de mermaid).
//  M1 (Nielsen 6, 7) : sommaire (colonne dès 80em, bloc repliable en dessous), un id sur chaque section,
//     retour au sommaire, intertitres plus grands que le texte qu'ils annoncent.
//  M2 : à 1440 et 1024 px, les deux schémas de Cloudflare tiennent dans leur cadre ; étapes numérotées.
//  M3 : à 390 et 320 px, le tableau de traduction de k8s ne coupe plus de colonne (une carte par ligne).
//  M4 : « Mis à jour le … » sous le héros (format-date.mjs) ; faits périmés corrigés.
//  Mineurs : m1 étiquettes des schémas en rem, m2 lignes ≤ 80 caractères, m3 bloc qui tient = pas d'arrêt
//  Tab, m4 schéma ASCII décrit dans son sens, m5 libellés cohérents, m6 curseur main sur Guides/Ressources.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { formatDay } from '../src/lib/format-date.mjs';

const GUIDES = ['k8s-for-java-developers', 'argocd-k8s-pour-les-nuls', 'cloudflare-pour-les-nuls'];
const html = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const main = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
const texte = (h) => h.replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&#39;|&#x27;/g, "'").replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');
const FIG = 'figure:has([data-mermaid-inline])';

async function ouvrir(env, path, width, { zoom = false } = {}) {
  const context = await env.browser.newContext({ viewport: { width, height: 900 } });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  if (zoom) await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'html{font-size:200% !important}';
      document.head.append(s);
    });
  });
  await page.goto(`${env.base}${path}`, { waitUntil: 'networkidle' });
  return { context, page };
}

/** Amène chaque schéma à l'écran (client:visible) et attend qu'ils soient tous dessinés. */
async function schemas(page) {
  for (const f of await page.locator(FIG).all()) await f.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const c = [...document.querySelectorAll('[data-mermaid-inline]')];
    return c.length > 0 && c.every((n) => n.querySelector('svg'));
  }, null, { timeout: 20_000 });
}

test('M1 — chaque section a un id, le sommaire les liste toutes dans l\'ordre, chacune ramène au sommaire', () => {
  for (const g of GUIDES) {
    const m = main(html(g));
    const ids = [...m.matchAll(/<section id="([^"]+)"[^>]*data-guide-section/g)].map((x) => x[1]);
    assert.ok(ids.length >= 8, `${g} : ${ids.length} sections avec id`);
    const bloc = m.match(/<details[^>]*data-sommaire-mobile[\s\S]*?<\/details>/)?.[0];
    assert.ok(bloc, `${g} : sommaire repliable absent`);
    assert.deepEqual([...bloc.matchAll(/href="#([^"]+)"/g)].map((x) => x[1]), ids, `${g} : sommaire ≠ sections`);
    const nav = m.match(/<nav aria-label="Table des matières"[\s\S]*?<\/nav>/)?.[0];
    assert.ok(nav, `${g} : colonne de sommaire absente`);
    assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map((x) => x[1]), ids, `${g} : colonne de sommaire ≠ sections`);
    assert.match(m, /id="sommaire"/, `${g} : cible #sommaire absente`);
    assert.equal((m.match(/data-retour-sommaire/g) ?? []).length, ids.length, `${g} : une section sans retour au sommaire`);
  }
});

test('M4 — « Mis à jour le … » une fois, sous le héros, avant la première section', () => {
  for (const g of GUIDES) {
    const m = main(html(g));
    const dates = [...m.matchAll(/data-testid="date-maj">([^<]*)</g)].map((x) => x[1]);
    assert.equal(dates.length, 1, `${g} : ${dates.length} blocs de date`);
    assert.equal(dates[0].replace(/ /g, ' '), `Mis à jour le ${formatDay('2026-11-22')}`.replace(/ /g, ' '));
    assert.ok(m.indexOf('date-maj') > m.indexOf('<h1') && m.indexOf('date-maj') < m.indexOf('data-guide-section'), `${g} : date mal placée`);
  }
});

test('M4 — faits périmés corrigés (dépôt GitOps d\'AetherWX, un seul cluster, dépôt privé)', () => {
  const argocd = texte(main(html('argocd-k8s-pour-les-nuls')));
  assert.doesNotMatch(argocd, /developpeur-gitops/);
  assert.match(argocd, /aetherwx-gitops/);
  assert.doesNotMatch(argocd, /workflow bump-tag|Workflow bump-tag/);
  const k8s = texte(main(html('k8s-for-java-developers')));
  assert.doesNotMatch(k8s, /dual-cluster/);
  assert.match(k8s, /un seul cluster k3s/);
  assert.doesNotMatch(texte(main(html('cloudflare-pour-les-nuls'))), /le repo est public/);
  // L'encyclopédie, à laquelle renvoient les guides, ne se contredit plus sur le dépôt GitOps.
  assert.doesNotMatch(html('case-studies/aetherwx-encyclopedia'), /developpeur-gitops/);
});

test('m5 — titre d\'onglet = h1 ; plus de surtitre anglais, nombres et unités insécables', () => {
  for (const g of GUIDES) {
    const h = html(g);
    const h1 = texte(h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1]).trim();
    const titre = texte(h.match(/<title>([\s\S]*?)<\/title>/)[1]).trim();
    assert.equal(titre, `${h1} · claude-code-codex`, g);
  }
  const k8s = html('k8s-for-java-developers');
  assert.doesNotMatch(k8s, /Java → K8s translator/);
  assert.match(k8s, /80\u00a0% du modèle/);
  assert.match(html('argocd-k8s-pour-les-nuls'), /22\u00a0h hier/);
});

test('M2/m4 — étapes numérotées et légendes justes', () => {
  const cf = html('cloudflare-pour-les-nuls');
  assert.match(cf, /sequenceDiagram\s+autonumber/);
  assert.doesNotMatch(cf, /Les étapes 2 et 3 sont chez Cloudflare/);
  const argocd = html('argocd-k8s-pour-les-nuls');
  assert.doesNotMatch(argocd, /du bas vers le haut/);
  assert.match(argocd, /d&#39;Internet \(en haut\)|d'Internet \(en haut\)/);
});

test('B1 — la note du diagramme de séquence tient dans son cadre, aux couleurs du site', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1440, 390]) {
    const { context, page } = await ouvrir(env, '/cloudflare-pour-les-nuls/', width);
    await schemas(page);
    const notes = await page.evaluate(() => [...document.querySelectorAll('[data-mermaid-inline] svg text.noteText')].map((t) => {
      const rect = t.parentElement.querySelector('rect.note');
      const a = t.getBoundingClientRect();
      const b = rect.getBoundingClientRect();
      return { texte: t.textContent, gauche: a.left - b.left, droite: b.right - a.right, fond: getComputedStyle(rect).fill };
    }));
    assert.ok(notes.length >= 2, `${width} px : ${notes.length} lignes de note`);
    for (const n of notes) {
      assert.ok(n.gauche >= 2 && n.droite >= 2, `${width} px : « ${n.texte} » déborde de sa note (${n.gauche.toFixed(1)} / ${n.droite.toFixed(1)} px)`);
      const [r, g, b] = n.fond.match(/\d+/g).map(Number);
      assert.ok(r + g + b < 200, `${width} px : fond de note clair (${n.fond}), hors de la charte sombre`);
    }
    // Les noms des participants ne touchent plus le bord de leur boîte.
    const acteurs = await page.evaluate(() => [...document.querySelectorAll('[data-mermaid-inline] svg text.actor')].map((t) => {
      const r = t.closest('g').querySelector('rect');
      const a = t.getBoundingClientRect();
      const b = r.getBoundingClientRect();
      return { texte: t.textContent, marge: Math.min(a.left - b.left, b.right - a.right) };
    }));
    for (const a of acteurs) assert.ok(a.marge >= 4, `${width} px : « ${a.texte} » touche le bord de sa boîte (${a.marge.toFixed(1)} px)`);
    await context.close();
  }
});

test('M2 — à 1440 et 1024 px, les deux schémas de Cloudflare tiennent entiers dans leur cadre', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1440, 1024]) {
    const { context, page } = await ouvrir(env, '/cloudflare-pour-les-nuls/', width);
    await schemas(page);
    const r = await page.evaluate(() => [...document.querySelectorAll('[data-mermaid-inline]')].map((c) => {
      const svg = c.querySelector('svg');
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const tailles = [...svg.querySelectorAll('text, foreignObject *')]
        .filter((n) => [...n.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim()))
        .map((n) => parseFloat(getComputedStyle(n).fontSize) * scale);
      return { cadre: c.clientWidth, contenu: c.scrollWidth, texte: Math.min(...tailles) };
    }));
    assert.equal(r.length, 2);
    for (const [i, s] of r.entries()) {
      assert.ok(s.contenu <= s.cadre, `${width} px, schéma ${i + 1} : ${s.contenu} px pour un cadre de ${s.cadre} px`);
      assert.ok(s.texte >= 10.9, `${width} px, schéma ${i + 1} : texte à ${s.texte.toFixed(1)} px`);
    }
    await context.close();
  }
});

test('M3 — au téléphone, le tableau de traduction de k8s devient des cartes entières ; tableau dès 40em', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const [width, zoom] of [[390, false], [320, false], [390, true]]) {
    const { context, page } = await ouvrir(env, '/k8s-for-java-developers/', width, { zoom });
    const r = await page.evaluate(() => {
      const cartes = document.querySelector('[data-traduction-cartes]');
      const table = document.querySelector('#traduction table');
      const lignes = [...cartes.querySelectorAll('li')];
      return {
        visibles: cartes.getClientRects().length > 0,
        tableVisible: !!table && table.getClientRects().length > 0,
        n: lignes.length,
        debord: lignes.filter((l) => l.scrollWidth > l.clientWidth + 1 || l.getBoundingClientRect().right > document.documentElement.clientWidth).length,
        role: lignes.every((l) => /\S/.test(l.querySelectorAll('dd')[2]?.textContent ?? '')),
      };
    });
    const tag = `${width} px${zoom ? ', texte 200 %' : ''}`;
    assert.ok(r.visibles && !r.tableVisible, `${tag} : cartes ${r.visibles}, tableau ${r.tableVisible}`);
    assert.equal(r.n, 16, `${tag} : ${r.n} cartes`);
    assert.equal(r.debord, 0, `${tag} : ${r.debord} cartes coupées`);
    assert.ok(r.role, `${tag} : « Ce qu'il fait vraiment » manque dans une carte`);
    await context.close();
  }
  const { context, page } = await ouvrir(env, '/k8s-for-java-developers/', 1440);
  const r = await page.evaluate(() => ({
    cartes: document.querySelector('[data-traduction-cartes]').getClientRects().length > 0,
    lignes: document.querySelectorAll('#traduction table tbody tr').length,
    table: document.querySelector('#traduction table').getClientRects().length > 0,
  }));
  assert.ok(r.table && !r.cartes && r.lignes === 16, `1440 px : ${JSON.stringify(r)}`);
  await context.close();
});

test('M1 — intertitres plus grands que le texte, sommaire en colonne dès 80em et suivi de la lecture', { timeout: 240_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const g of GUIDES) {
    const { context, page } = await ouvrir(env, `/${g}/`, 1440);
    const r = await page.evaluate(() => {
      const h2 = document.querySelector('[data-guide-section] h2');
      const p = document.querySelector('[data-guide-section] .guide-prose > p');
      return {
        h2: parseFloat(getComputedStyle(h2).fontSize), p: parseFloat(getComputedStyle(p).fontSize),
        poids: Number(getComputedStyle(h2).fontWeight),
        colonne: document.querySelector('nav[aria-label="Table des matières"]').getClientRects().length > 0,
        replie: document.querySelector('[data-sommaire-mobile]').getClientRects().length > 0,
      };
    });
    assert.ok(r.h2 >= r.p * 1.4 && r.poids >= 600, `${g} : h2 ${r.h2} px (${r.poids}) pour un texte de ${r.p} px`);
    assert.ok(r.colonne && !r.replie, `${g} à 1440 px : colonne ${r.colonne}, bloc repliable ${r.replie}`);
    // Un lien du sommaire mène à sa section et la marque comme section en cours (sommaire hydraté d'abord).
    await page.waitForFunction(() => document.querySelector('nav[aria-label="Table des matières"]').closest('astro-island')?.hasAttribute('ssr') === false, null, { timeout: 10_000 });
    const dernier = page.locator('nav[aria-label="Table des matières"] a').nth(4);
    const id = (await dernier.getAttribute('href')).slice(1);
    await dernier.click();
    await page.waitForFunction((i) => document.querySelector(`nav[aria-label="Table des matières"] a[href="#${i}"]`)?.getAttribute('aria-current') === 'true', id, { timeout: 5000 }).catch(() => {});
    const apres = await page.evaluate((i) => ({
      hash: location.hash,
      haut: document.getElementById(i).getBoundingClientRect().top,
      courant: document.querySelector(`nav[aria-label="Table des matières"] a[href="#${i}"]`).getAttribute('aria-current'),
    }), id);
    assert.equal(apres.hash, `#${id}`, g);
    assert.ok(apres.haut < 450, `${g} : la section #${id} est à ${apres.haut} px du haut après le clic`);
    assert.equal(apres.courant, 'true', `${g} : #${id} pas marquée en cours`);
    await context.close();
  }
  // Sous 80em : bloc repliable, pas de colonne ; le retour au sommaire y mène.
  const { context, page } = await ouvrir(env, '/argocd-k8s-pour-les-nuls/', 390);
  const r = await page.evaluate(() => ({
    colonne: document.querySelector('nav[aria-label="Table des matières"]').getClientRects().length > 0,
    replie: document.querySelector('[data-sommaire-mobile]').getClientRects().length > 0,
  }));
  assert.ok(!r.colonne && r.replie, `390 px : ${JSON.stringify(r)}`);
  await page.locator('#cheat-sheet [data-retour-sommaire]').click();
  await page.waitForTimeout(300);
  const haut = await page.evaluate(() => document.getElementById('sommaire').getBoundingClientRect().top);
  assert.ok(haut >= 0 && haut < 200, `390 px : #sommaire à ${haut} px après « Revenir au sommaire »`);
  await context.close();
});

test('m2 — lignes de texte courant de 80 caractères au plus à 1440 px', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const g of GUIDES) {
    const { context, page } = await ouvrir(env, `/${g}/`, 1440);
    const max = await page.evaluate(() => {
      let pire = { n: 0, texte: '', blocs: 0 };
      const range = document.createRange();
      const blocs = document.querySelectorAll('.guide-prose > p, .guide-prose > ul > li, .guide-prose > ol > li');
      pire.blocs = blocs.length;
      for (const bloc of blocs) {
        const lignes = new Map();
        const w = document.createTreeWalker(bloc, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          for (let i = 0; i < n.data.length; i++) {
            range.setStart(n, i);
            range.setEnd(n, i + 1);
            const r = range.getClientRects()[0];
            if (!r || r.width === 0) continue;
            const y = Math.round(r.top / 4);
            lignes.set(y, (lignes.get(y) ?? '') + n.data[i]);
          }
        }
        for (const l of lignes.values()) {
          const s = l.replace(/\s+/g, ' ').trim();
          if (s.length > pire.n) pire = { ...pire, n: s.length, texte: s };
        }
      }
      return pire;
    });
    assert.ok(max.blocs >= 20, `${g} : ${max.blocs} blocs de texte mesurés, test sans objet`);
    assert.ok(max.n <= 80, `${g} : ligne de ${max.n} caractères : « ${max.texte} »`);
    await context.close();
  }
});

test('m1/m3/m6 — étiquettes en rem, blocs qui tiennent hors de l\'ordre Tab, curseur main sur Guides', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  // m3 : à 1440 px, un bloc de code qui ne défile pas n'est pas un arrêt Tab ; un bloc qui défile le reste.
  let ctx = await ouvrir(env, '/argocd-k8s-pour-les-nuls/', 1440);
  await ctx.page.waitForFunction(() => document.querySelector('[data-guide] pre[data-defile]'));
  const pres = await ctx.page.evaluate(() => [...document.querySelectorAll('[data-guide] pre')].map((p) => ({
    defile: p.scrollWidth > p.clientWidth + 1, tab: p.tabIndex, role: p.getAttribute('role'), nom: p.getAttribute('aria-label'),
  })));
  assert.ok(pres.filter((p) => !p.defile).length >= 5, 'trop peu de blocs qui tiennent : test sans objet');
  assert.deepEqual(pres.filter((p) => !p.defile && p.tab >= 0), [], 'bloc qui tient mais reste un arrêt Tab');
  assert.deepEqual(pres.filter((p) => p.defile && (p.tab !== 0 || p.role !== 'region' || !p.nom)), [], 'bloc qui défile sans région nommée');
  // m6 : boutons de la barre.
  const curseurs = await ctx.page.evaluate(() => [...document.querySelectorAll('[data-dropdown-toggle]')].map((b) => getComputedStyle(b).cursor));
  assert.ok(curseurs.length >= 2 && curseurs.every((c) => c === 'pointer'), `curseurs : ${curseurs}`);
  await ctx.context.close();
  // m1 : avec le texte à 200 %, « Architecture » et « Agrandir » grandissent et « Agrandir » tient sur une ligne.
  ctx = await ouvrir(env, '/cloudflare-pour-les-nuls/', 390, { zoom: true });
  await schemas(ctx.page);
  const r = await ctx.page.evaluate(() => {
    const fig = document.querySelector('figure:has([data-mermaid-inline])');
    const bouton = [...fig.querySelectorAll('button')].find((b) => /Agrandir/.test(b.textContent));
    const etiquette = [...fig.querySelectorAll('span')].find((s) => s.textContent.trim() === 'Architecture');
    const range = document.createRange();
    range.selectNodeContents(bouton);
    const lignes = new Set([...range.getClientRects()].filter((x) => x.width > 1).map((x) => Math.round(x.bottom)));
    return { bouton: parseFloat(getComputedStyle(bouton).fontSize), etiquette: parseFloat(getComputedStyle(etiquette).fontSize), lignes: lignes.size };
  });
  assert.ok(r.bouton >= 19 && r.etiquette >= 19, `texte 200 % : Agrandir ${r.bouton} px, Architecture ${r.etiquette} px`);
  assert.equal(r.lignes, 1, '« Agrandir » sur plusieurs lignes');
  await ctx.context.close();
});
