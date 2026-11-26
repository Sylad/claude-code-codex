// L8 r2 (revue UX r2, Nielsen 4) — à 390 et 320 px, texte 100 %, aucun mot court (≤ 12 lettres ou chiffres)
// n'est coupé au milieu sur deux lignes, hors code. Régression de 211c6c3 : la règle globale
// `overflow-wrap: anywhere` + `min-width: 0` des enfants de flex coupait « TYPESCRI|PT », « LICENS|E »,
// les numéros « 1. » de k8s et « 02 » du sommaire de /theory. Toutes les pages de dist sont parcourues
// (la règle vaut pour tout le site). Une coupure à un trait d'union n'est pas une coupure de mot (le trait
// d'union n'appartient pas au mot mesuré). Lit le site CONSTRUIT : `npx astro build` avant.
// L105 — la mesure attend la fin du calcul de la césure (src/lib/cesure.mjs, lancé à l'image qui suit le
// chargement des polices) : mesurée avant, /nouveautes/ à 320 px montrait « chang|é » coupé une fois sur
// trois, mise en page que le visiteur ne voit pas. Un témoin vérifie que la mesure rougit toujours sur un
// vrai mot coupé, la césure finie.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { DIST, attendreCesure, setupBrowser } from './lib/e2e-dist.mjs';
import { motsCoupes } from './lib/mots-coupes.mjs';

function pages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return pages(p);
    return e.name === 'index.html' ? [`/${relative(DIST, dir).split(sep).join('/')}/`.replace(/^\/\/$/, '/')] : [];
  });
}
const ROUTES = pages(DIST);

// Pages où la revue a mesuré des coupures : elles doivent être dans le lot parcouru.
const CITEES = [
  '/case-studies/k8s-migration-overnight/', '/case-studies/aetherwx-qa-harness/',
  '/case-studies/alexgreensh-polyform/', '/theory/', '/argocd-k8s-pour-les-nuls/', '/cloudflare-pour-les-nuls/',
];

test('les pages citées par la revue sont dans dist', () => {
  for (const r of CITEES) assert.ok(ROUTES.includes(r), `${r} absent de dist : lancer astro build`);
});

test('aucun mot court coupé sur deux lignes à 390 et 320 px, texte 100 %', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [390, 320]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(`${env.base}${route}`, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      await attendreCesure(page);
      const coupes = await page.evaluate(motsCoupes);
      if (coupes.length) failures.push(`${route} @${width}px : ${coupes.slice(0, 6).join(', ')}${coupes.length > 6 ? ` (+${coupes.length - 6})` : ''}`);
    }
    await context.close();
  }
  assert.deepEqual(failures, []);
});

// Témoin (L105) : la page attendue comme le test ci-dessus, un mot court coupé exprès dans <main> est vu ;
// le même mot qui tient sur sa ligne ne l'est pas. Injection et mesure dans la même tâche : la césure
// (image suivante) ne peut pas passer entre les deux.
test('témoin : un mot court coupé exprès est vu, la césure finie', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${env.base}/nouveautes/`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await attendreCesure(page);
  const mesurer = (style) => page.evaluate(`(() => {
    const p = document.createElement('p');
    p.setAttribute('style', '${style}');
    p.textContent = 'Un changement visible.';
    document.querySelector('main').append(p);
    const coupes = (${motsCoupes.toString()})();
    p.remove();
    return coupes;
  })()`);
  const coupe = await mesurer('width: 3ch; overflow-wrap: anywhere; hyphens: none');
  assert.ok(coupe.some((c) => c.startsWith('« changement »')), `mot coupé exprès non vu : ${JSON.stringify(coupe)}`);
  assert.deepEqual(await mesurer('width: auto'), []);
  await context.close();
});
