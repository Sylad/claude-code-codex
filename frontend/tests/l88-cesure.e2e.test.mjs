// L88 (WCAG 1.4.10, revue UX de L87, revue r1) — à 320 px avec le texte à 200 %, des titres se coupaient au
// milieu d'un mot sans trait d'union (« chang|é », « vérific|ation », « alexgreensh/tok|en-optimizer »).
// Attendu, d'après la spec du lot et la revue r1 :
//   - aucun mot coupé sans trait à 320, 390 et 768 px, texte de 100 à 200 %, sur toutes les pages ; un nom
//     ou un identifiant (titres compris) se coupe à sa ponctuation, sa casse ou ses chiffres ;
//   - la césure ne touche que le mot qui ne tient pas sur une ligne (M1) ; au moins 3 lettres de chaque
//     côté, pas plus de 2 lignes à trait de suite (M2) ;
//   - aucun U+00AD dans le texte copié ni dans le nom accessible (m1) ;
//   - les h1 doublent avec le texte (WCAG 1.4.4, F94 : M4) ;
//   - au réglage normal (texte 100 %, 390 à 1440 px), rien n'est posé : le rendu ne change pas ;
//   - la césure suit la taille du texte et la navigation interne ;
//   - revue r3 : un nom se coupe avec un trait quelle que soit la largeur de la ligne au pixel près (M3-ter :
//     « jdbccon|fig. » sans trait dans le Chrome de la revue, pas dans le Chromium des tests) ; aucun signe
//     seul sur sa ligne, insécables et code en ligne compris (m-a-bis : « -- | dry-run », « 46,9 | % »).
// Oracle : tests/lib/coupures.mjs, qui juge chaque coupure sur le rendu (trait dessiné ou mot entier), sans
// rien reprendre de src/lib/cesure.mjs. Texte agrandi simulé comme dans la revue : html { font-size: N % }.
// Lit le site CONSTRUIT : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DIST, attendreCesure, setupBrowser } from './lib/e2e-dist.mjs';
import { chargerImages, releverCoupures, releverSignesSeuls, verifierCoupures } from './lib/coupures.mjs';

function pages(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return pages(p);
    return e.name === 'index.html' ? [`/${relative(DIST, dir).split(sep).join('/')}/`.replace(/^\/\/$/, '/')] : [];
  });
}
const ROUTES = pages(DIST);
const LARGEURS = [320, 390, 768];
const TAILLES = [100, 125, 150, 175, 200];
const CITEES = ['/nouveautes/', '/livre-de-bord/', '/plan-de-travail/', '/learning/', '/case-studies/k8s-migration-overnight/'];
// Ce que le script de césure peut poser dans la page.
const POSE = '[data-cesure], [data-cesure-vu], [data-cesure-copie]';


async function ouvrir(page, url) {
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await attendreCesure(page);
  // Le texte des <details> fermés compte aussi (revue L87, m2) : on les ouvre tous.
  await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  await chargerImages(page);
  await attendreCesure(page);
}

async function taille(page, n) {
  await page.evaluate((v) => { document.documentElement.style.fontSize = v ? `${v}%` : ''; }, n);
  await attendreCesure(page);
}

// U+00AD dans le texte que lisent les aides techniques et que copie le lecteur (hors <script>, hors texte vu
// d'un mot doublé, masqué aux aides techniques et non sélectionnable).
function shyLisibles() {
  let n = 0;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (t) => (t.parentElement.closest('script, style, [data-cesure-vu]') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let t = w.nextNode(); t; t = w.nextNode()) n += t.data.split('­').length - 1;
  return n;
}

test('les pages citées par les revues sont dans dist', () => {
  for (const r of CITEES) assert.ok(ROUTES.includes(r), `${r} absent de dist : lancer astro build`);
});

test('la césure automatique n\'est donnée qu\'à [data-cesure], avec 3 lettres au moins de chaque côté', () => {
  const src = fileURLToPath(new URL('../src/', import.meta.url));
  const fichiers = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory()
    ? fichiers(join(d, e.name)) : /\.(css|astro|vue)$/.test(e.name) ? [join(d, e.name)] : []));
  const trouves = [];
  for (const f of fichiers(src)) {
    const texte = readFileSync(f, 'utf8');
    for (const m of texte.matchAll(/hyphens\s*:\s*auto|\bhyphens-auto\b/g)) trouves.push(`${relative(src, f)}@${m.index}`);
  }
  const css = readFileSync(join(src, 'styles/global.css'), 'utf8');
  assert.match(css, /\[data-cesure\]\s*\{\s*-webkit-hyphens:\s*auto;\s*hyphens:\s*auto;\s*hyphenate-limit-chars:\s*6 3 3;\s*\}/);
  assert.equal(trouves.length, 2, `hyphens: auto ailleurs que sous [data-cesure] : ${trouves.join(', ')}`);
});

test('marges bornées : une seule source (jetons --spacing-borne-*), plus aucune valeur recopiée', () => {
  const src = fileURLToPath(new URL('../src/', import.meta.url));
  const fichiers = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory()
    ? fichiers(join(d, e.name)) : /\.(astro|vue|ts|mjs)$/.test(e.name) ? [join(d, e.name)] : []));
  const recopies = [];
  for (const f of fichiers(src)) {
    const texte = readFileSync(f, 'utf8');
    for (const m of texte.matchAll(/min\(\s*[0-9.]+rem\s*,\s*[0-9.]+px\s*\)/g)) recopies.push(`${relative(src, f)} : ${m[0]}`);
  }
  assert.deepEqual(recopies, []);
  const css = readFileSync(join(src, 'styles/global.css'), 'utf8');
  for (const n of [3, 4, 5, 6, 10]) {
    assert.match(css, new RegExp(`--spacing-borne-${n}: min\\(${n * 0.25}rem, ${n * 4}px\\);`), `--spacing-borne-${n}`);
  }
});

test('l\'oracle voit une coupure sans trait, une césure trop courte, une césure inutile et 3 traits de suite', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const page = await env.browser.newPage({ viewport: { width: 600, height: 600 } });
  const juger = async (corps) => {
    await page.setContent(`<html lang="fr"><body style="margin:0;background:#111;color:#eee;font:20px/1.4 sans-serif">${corps}</body></html>`);
    return verifierCoupures(page);
  };
  const bloc = (style, texte, largeur = 80) => `<p style="width:${largeur}px;overflow-wrap:anywhere;${style}">${texte}</p>`;
  const f1 = await juger(bloc('', 'confiance'));
  assert.equal(f1.length, 1, `mot coupé de force : ${f1}`);
  assert.match(f1[0], /^sans trait/);
  assert.deepEqual(await juger(bloc('hyphens:auto;hyphenate-limit-chars:6 3 3', 'vérification')), [], 'césure au dictionnaire');
  assert.deepEqual(await juger(bloc('', 'post­gresql')), [], 'césure conditionnelle dessinée');
  assert.deepEqual(await juger(bloc('', 'Persistent<wbr>Volume<wbr>Claim warhammer<wbr>40k /geoserver/<wbr>web/', 120)), [], 'nom coupé à sa casse, ses chiffres, sa ponctuation');
  const f2 = await juger(bloc('', 'so­lidement', 40));
  assert.ok(f2.some((x) => /^moins de 3 lettres/.test(x)), `coupure à 2 lettres : ${f2}`);
  // Chromium ne coupe au dictionnaire qu'un mot qui ne tient pas : le cas vu en r1 est un U+00AD posé
  // dans un mot qui tenait sur la ligne suivante (« dé-crit », « Vi-déos »).
  const f3 = await juger(bloc('', 'des bana\u00adnes', 100));
  assert.ok(f3.some((x) => /^césure d'un mot qui tient/.test(x)), `mot qui tient sur une ligne : ${f3}`);
  const f4 = await juger(bloc('', 'abc­def­ghi­jkl­mno', 60));
  assert.ok(f4.some((x) => /^3 lignes à trait de suite/.test(x)), `suite de traits : ${f4}`);
  // Revue r2, M3-bis : un nom coupé hors syllabe, même avec son trait (« modelcontextp-rotocol », « tok-ens »,
  // « prot-ocol ») ; une borne lettre/chiffre qui laisse moins de 3 caractères (« warhammer40|k »).
  // Largeur d'un texte dans la police du bloc (+ 4 px) : la ligne tient ce texte et pas plus.
  const largeur = async (texte) => Math.ceil(await page.evaluate((t) => {
    const s = document.createElement('span');
    s.style.cssText = 'font:20px/1.4 sans-serif;white-space:pre';
    s.textContent = t;
    document.body.append(s);
    const w = s.getBoundingClientRect().width;
    s.remove();
    return w;
  }, texte)) + 4;
  // Ligne qui tient chaque morceau d'un mot césuré à son U+00AD, trait compris.
  const ligne = async (texte) => {
    const [g, d] = texte.split('­');
    return Math.max(await largeur(`${g}-`), await largeur(d));
  };
  for (const texte of ['modelcontextp­rotocol', 'tok­ens', 'modelcontextprot­ocol']) {
    const f = await juger(bloc('', texte, await ligne(texte)));
    assert.ok(f.some((x) => /^césure hors syllabe/.test(x)), `${texte} : ${f}`);
  }
  for (const texte of ['modelcontext­protocol', 'proto­col', 'post­gresql']) {
    assert.deepEqual(await juger(bloc('', texte, await ligne(texte))), [], `${texte} : frontière de syllabe`);
  }
  const f5 = await juger(bloc('', 'warhammer40<wbr>k', await largeur('warhammer40')));
  assert.ok(f5.length > 0, `borne lettre/chiffre à 1 caractère : ${f5}`);
  // Revue r2, m-a : ponctuation seule en début de ligne (« , utiliser », « ) ») ou en fin de ligne (« / »).
  const f6 = await juger(bloc('', 'comprendre<wbr>, utiliser', await largeur('comprendre')));
  assert.ok(f6.some((x) => /^ponctuation seule/.test(x)), `virgule seule en début de ligne : ${f6}`);
  const f7 = await juger(bloc('', '(NousResearch<wbr>)', await largeur('(NousResearch')));
  assert.ok(f7.some((x) => /^ponctuation seule/.test(x)), `parenthèse seule : ${f7}`);
  const f8 = await juger(bloc('', 'pas /<wbr>geoserver/web/', await largeur('geoserver/web/')));
  assert.ok(f8.some((x) => /^ponctuation seule/.test(x)), `barre seule en fin de ligne : ${f8}`);
  // Revue r3, M3-ter : un nom coupé sans trait reste une faute quand il finit par un point (« jdbccon|fig. ») ;
  // un sigle sans voyelle se détache de la syllabe qui le suit (« jdbc-config »).
  const f9 = await juger(bloc('', 'Le jdbcconfig.', await largeur('jdbccon')));
  assert.ok(f9.some((x) => /^sans trait/.test(x)), `nom à point final coupé sans trait : ${f9}`);
  assert.deepEqual(await juger(bloc('', 'jdbc­config.', await ligne('jdbc­config.'))), [], 'sigle détaché de la syllabe suivante');
  const f10 = await juger(bloc('', 'jd­bcconfig', await ligne('jd­bcconfig')));
  assert.ok(f10.length > 0, `sigle coupé en son milieu : ${f10}`);
  // Revue de code r4 : après un sigle, le mot qui suit garde son « s » d'attaque (« jdbc-store »,
  // « JDBC|Store » à la casse), jamais « jdbcs-tore », « wmss-tore » ni « JDBCS|tore ».
  for (const texte of ['jdbcs\u00adtore', 'JDBCS\u00adtore', 'wmss\u00adtore']) {
    const f = await juger(bloc('', texte, await ligne(texte)));
    assert.ok(f.some((x) => /^césure hors syllabe/.test(x)), `${texte} : ${f}`);
  }
  for (const texte of ['jdbc\u00adstore', 'wms\u00adstore']) {
    assert.deepEqual(await juger(bloc('', texte, await ligne(texte))), [], `${texte} : sigle détaché du mot suivant`);
  }
  assert.deepEqual(await juger(bloc('', 'JDBC<wbr>Store', await largeur('JDBCSt'))), [], 'JDBC|Store : coupure à la casse');
  const f11 = await juger(bloc('', 'JDBCS<wbr>tore', await largeur('JDBCS')));
  assert.ok(f11.length > 0, `JDBCS|tore sans trait : ${f11}`);
  // Revue r3, m-a-bis : signe seul après une insécable, après un <code>, « -- » d'une option dans un <code>.
  const code = (t) => `<code style="font:inherit;overflow-wrap:anywhere">${t}</code>`;
  const seul = async (corps, l, quoi) => {
    const f = await juger(bloc('', corps, l));
    assert.ok(f.some((x) => /^signe seul/.test(x)), `${quoi} : ${f}`);
  };
  await seul('«\u00a0Réinitialiser\u00a0»,', await largeur('«\u00a0Réinitialiser'), 'guillemet fermant seul après une insécable');
  await seul('46,9\u00a0%', await largeur('46,9'), '« % » seul après une insécable');
  await seul(`un ${code('~/.claude/skills/')},`, await largeur('~/.claude/skills/'), 'virgule seule après un <code>');
  await seul(`un ${code('--<wbr>dry-run')}`, await largeur('un --'), '« -- » d\'une option seul en fin de ligne');
  await seul(`un ${code('-<wbr>-dry-run')}`, await largeur('un -'), 'option coupée entre ses deux traits');
  assert.deepEqual(await juger(bloc('', `un ${code('~/.claude/<wbr>skills/')}, ${code('--dry-<wbr>run')} «\u00a0Réini\u00adtialiser\u00a0»,`, await largeur('un ~/.claude/'))), [],
    'code coupé à sa ponctuation, option coupée après son nom, mot césuré avant son guillemet');
  await page.close();
});

test('aucun mot coupé sans trait, aucune césure inutile ni trop courte, aucun U+00AD lisible ni défilement latéral — 320, 390 et 768 px, texte de 100 à 200 %', { timeout: 1_500_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const fautes = [];
  const exemptees = new Set();
  for (const width of LARGEURS) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await ouvrir(page, `${env.base}${route}`);
      for (const n of TAILLES) {
        await taille(page, n);
        const ici = `${route} @${width}px ${n} %`;
        // Un nom (commande, chemin) dans un îlot Vue hors titre : le script n'y touche pas au DOM (Vue le
        // réécrit), sa coupure reste celle d'overflow-wrap ; de même pour une ponctuation seule (« -- » d'une
        // option) dans un îlot, hors du champ de la revue r2. Compté à part, pas jugé.
        const ex = [];
        const f = await verifierCoupures(page, { exempter: (c) => (c.nom || c.ponctuation) && c.ilot && !c.titre, exemptees: ex });
        for (const x of ex) exemptees.add(`${route} ${x}`);
        if (f.length) fautes.push(`${ici} : ${f.slice(0, 5).join(' ; ')}${f.length > 5 ? ` (+${f.length - 5})` : ''}`);
        const shy = await page.evaluate(shyLisibles);
        if (shy) fautes.push(`${ici} : ${shy} U+00AD dans le texte lisible`);
        const deborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (deborde > 0) fautes.push(`${ici} : défilement latéral de ${deborde} px`);
      }
    }
    await context.close();
  }
  t.diagnostic(`noms coupés sans trait dans un îlot Vue (non jugés) : ${exemptees.size}`);
  assert.deepEqual(fautes, []);
});

test('réglage normal (texte 100 %, 390 à 1440 px) : aucune césure posée ; des <wbr> ou un signe collé seulement là où la prod coupe un nom sans trait ou laisse un signe seul', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const marques = [];
  const corriges = [];
  for (const width of [390, 768, 1440]) {
    const context = await env.browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await ouvrir(page, `${env.base}${route}`);
      const servi = (readFileSync(join(DIST, route, 'index.html'), 'utf8').match(/<wbr/g) ?? []).length;
      // Les <wbr> et les signes collés (« -- » d'une option de code, revue r3) comptent ensemble.
      const n = await page.evaluate((sel) => ({ pose: document.querySelectorAll(sel).length, wbr: document.querySelectorAll('wbr, [data-cesure-colle]').length }), POSE);
      if (n.pose) marques.push(`${route} @${width}px : ${n.pose} élément(s) posé(s) à 100 %`);
      if (n.wbr === servi) continue;
      // Des <wbr> ajoutés ne se justifient que si la page servie, sans le script, coupe un mot ici : sans le
      // script, ni U+00AD ni césure automatique, toute coupure au milieu d'un mot y est donc sans trait.
      const fautes = await verifierCoupures(page);
      if (fautes.length) marques.push(...fautes.map((f) => `${route} @${width}px : ${f}`));
      const brut = await env.browser.newContext({ viewport: { width, height: 900 }, javaScriptEnabled: false });
      const pb = await brut.newPage();
      await pb.goto(`${env.base}${route}`);
      await pb.evaluate(() => document.fonts.ready);
      const avant = [...await pb.evaluate(releverCoupures), ...await pb.evaluate(releverSignesSeuls)];
      await brut.close();
      if (!avant.length) marques.push(`${route} @${width}px : ${n.wbr - servi} <wbr> ou signe collé ajouté(s) sans coupure à corriger`);
      corriges.push(`${route} @${width}px : ${n.wbr - servi} (${avant.map((c) => c.vu).join(' ; ')})`);
    }
    await context.close();
  }
  t.diagnostic(`<wbr> et signes collés posés à 100 % (coupures de la page servie sans le script) : ${corriges.join(' ; ') || 'aucun'}`);
  assert.deepEqual(marques, []);
});

test('la césure suit la taille du texte : posée à 200 %, entièrement défaite au retour à 100 %', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  for (const route of ['/nouveautes/', '/case-studies/k8s-migration-overnight/']) {
    await ouvrir(page, `${env.base}${route}`);
    const avant = await page.evaluate(() => document.querySelector('main').innerHTML);
    await taille(page, 200);
    const poses = await page.evaluate((sel) => document.querySelectorAll(`${sel}, main wbr`).length, POSE);
    assert.ok(poses > 0, `${route} 200 % : rien de posé`);
    // Le titre cité par la revue (« chang|é ») est entier.
    if (route === '/nouveautes/') assert.match(await page.evaluate(() => document.querySelector('h1').textContent), /changé/);
    await taille(page, 100);
    assert.equal(await page.evaluate(() => document.querySelector('main').innerHTML), avant, `${route} : retour à 100 %, la page n'est pas revenue à son état servi`);
  }
  await context.close();
});

// Revue r3, M3-ter : « Le jdbcconfig.properties du data_dir surcharge les env vars » (h3 de l'étude k8s) à
// 320 px, texte 200 %, montrait « jdbccon|fig. » sans trait dans le Chrome de la revue et un trait dans le
// Chromium des tests : à un pixel près, le trait ne tenait plus sur la ligne. Le titre est jugé sur toute une
// plage de largeurs autour de 320 px (une barre de défilement en retire jusqu'à 17).
test('M3-ter : le h3 « jdbcconfig.properties » de l\'étude k8s garde un trait à chaque coupure, texte 200 %, de 296 à 330 px', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const fautes = [];
  const context = await env.browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await ouvrir(page, `${env.base}/case-studies/k8s-migration-overnight/`);
  await taille(page, 200);
  const lu = new Set();
  for (let width = 296; width <= 330; width += 1) {
    await page.setViewportSize({ width, height: 844 });
    await attendreCesure(page);
    const titre = await page.evaluate(() => [...document.querySelectorAll('main h3')].find((h) => h.textContent.includes('jdbcconfig.properties'))?.textContent);
    assert.ok(titre, 'titre « jdbcconfig.properties » absent de la page');
    const f = await verifierCoupures(page, { exempter: (c) => !c.el.includes('jdbcconfig.properties') });
    for (const x of f) fautes.push(`${width}px : ${x}`);
    lu.add(width);
  }
  assert.equal(lu.size, 35);
  assert.deepEqual(fautes, []);
  await context.close();
});

// Revue r3, m-a-bis : les cas cités, sur le rendu.
test('m-a-bis : « --dry-run » de /nouveautes (390 px, 150 %) et « 46,9 % » de /case-studies (320 et 768 px, 200 %) d\'un seul tenant', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  // Lignes (haut arrondi) occupées par un texte dans la page : une seule s'il n'est pas coupé.
  const lignesDe = (page, sel, texte) => page.evaluate(([s, tx]) => {
    const out = [];
    const r = document.createRange();
    for (const el of document.querySelectorAll(s)) {
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let tout = '';
      const pos = [];
      for (let n = w.nextNode(); n; n = w.nextNode()) for (let i = 0; i < n.data.length; i++) { tout += n.data[i]; pos.push([n, i]); }
      for (let i = tout.indexOf(tx); i >= 0; i = tout.indexOf(tx, i + 1)) {
        const hauts = new Set();
        for (const [n, k] of pos.slice(i, i + tx.length)) {
          r.setStart(n, k);
          r.setEnd(n, k + 1);
          for (const q of r.getClientRects()) if (q.width > 0.5) hauts.add(Math.round(q.top));
        }
        out.push(hauts.size);
      }
    }
    return out;
  }, [sel, texte]);
  for (const [route, width, n, sel, texte] of [
    ['/nouveautes/', 390, 150, 'main :not(pre) > code', '--d'],
    ['/nouveautes/', 320, 200, 'main :not(pre) > code', '--d'],
    ['/case-studies/', 390, 200, 'main :not(pre) > code', '--f'],
    ['/case-studies/', 320, 200, 'main p', '46,9\u00a0%'],
    ['/case-studies/', 768, 200, 'main p', '46,9\u00a0%'],
  ]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    await ouvrir(page, `${env.base}${route}`);
    await taille(page, n);
    const l = await lignesDe(page, sel, texte);
    assert.ok(l.length > 0, `${route} : « ${texte} » absent de ${sel}`);
    assert.ok(l.every((x) => x === 1), `${route} @${width}px ${n} % : « ${texte} » sur ${l} ligne(s)`);
    // Aucun <code> en ligne ne sort de son bloc (« --dry-run » débordait de 12 px à gauche de la colonne).
    const dehors = await page.evaluate(() => [...document.querySelectorAll('main :not(pre) > code')].flatMap((c) => {
      let b = c.parentElement;
      while (b && getComputedStyle(b).display === 'inline') b = b.parentElement;
      const cadre = b.getBoundingClientRect();
      return [...c.getClientRects()].filter((q) => q.left < cadre.left - 1 || q.right > cadre.right + 1).map((q) => `${c.textContent.slice(0, 30)} : ${Math.round(q.left - cadre.left)} px`);
    }));
    assert.deepEqual(dehors, [], `${route} @${width}px ${n} % : <code> hors de son bloc`);
    await context.close();
  }
});

test('M3 : les noms des titres se coupent à leur ponctuation — h1 « alexgreensh/token-optimizer » à 320 px', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await ouvrir(page, `${env.base}/case-studies/alexgreensh-polyform/`);
  const h1 = await page.evaluate(() => document.querySelector('h1').textContent);
  assert.match(h1, /alexgreensh\/token-optimizer/);
  assert.deepEqual(await verifierCoupures(page), []);
  // La coupure est à la barre oblique : « alexgreensh/ » finit sa ligne.
  const fin = await page.evaluate(() => {
    const h = document.querySelector('h1');
    const r = document.createRange();
    const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    let txt = '';
    let haut = null;
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      for (let i = 0; i < n.data.length; i++) {
        r.setStart(n, i);
        r.setEnd(n, i + 1);
        const q = [...r.getClientRects()].at(-1);
        if (q && haut !== null && q.top - haut > q.height / 2) txt += '|';
        if (q) haut = q.top;
        txt += n.data[i];
      }
    }
    return txt;
  });
  assert.match(fin, /alexgreensh\/\|token/, `coupure du h1 : ${fin}`);
  await context.close();
});

test('m1 : texte copié et nom accessible sans U+00AD, texte agrandi (320 px, 200 %)', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  for (const route of ['/nouveautes/', '/case-studies/k8s-migration-overnight/']) {
    await ouvrir(page, `${env.base}${route}`);
    await taille(page, 200);
    const copies = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('main h1, main h2, main h3, main p, main li')) {
        if (!el.querySelector('[data-cesure], [data-cesure-vu]')) continue;
        const r = document.createRange();
        r.selectNodeContents(el);
        getSelection().removeAllRanges();
        getSelection().addRange(r);
        out.push(getSelection().toString());
      }
      getSelection().removeAllRanges();
      return out;
    });
    assert.ok(copies.length > 0, `${route} : aucun passage césuré à copier`);
    for (const c of copies) assert.ok(!c.includes('­'), `${route} : U+00AD copié dans « ${c.slice(0, 60)} »`);
    const doubles = await page.evaluate(() => [...document.querySelectorAll('[data-cesure-vu]')].map((v) => [v.textContent.replace(/­/g, ''), v.nextSibling?.textContent]));
    for (const [vu, copie] of doubles) assert.equal(copie, vu, `${route} : la copie d'un mot doublé diffère du texte vu`);
    const { nodes } = await cdp.send('Accessibility.getFullAXTree');
    const noms = nodes.map((n) => n.name?.value ?? '').filter((v) => v.includes('­'));
    assert.deepEqual(noms, [], `${route} : U+00AD dans un nom accessible`);
    // Revue r2, m-b : la copie d'un mot doublé ne coupe pas le nom accessible (« postgresql .parameters »,
    // « warhammer 40k ») : le nom d'un titre qui en contient une est son texte, sans espace ajoutée.
    const titres = await page.evaluate(() => [...document.querySelectorAll('main :is(h1, h2, h3):has([data-cesure-vu])')].map((h) => {
      const c = h.cloneNode(true);
      c.querySelectorAll('[data-cesure-vu]').forEach((v) => v.remove());
      return c.textContent.replace(/\s+/g, ' ').trim();
    }));
    for (const nom of titres) {
      assert.ok(await page.getByRole('heading', { name: nom, exact: true }).count() > 0, `${route} : nom accessible du titre « ${nom} » altéré`);
    }
  }
  if (!(await page.evaluate(() => document.querySelector('[data-cesure-vu]')))) t.diagnostic('aucun mot doublé sur la dernière page');
  await context.close();
});

test('M4 (WCAG 1.4.4, F94) : les h1 doublent avec le texte, rien n\'est plafonné par la largeur', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const ecarts = [];
  for (const width of [320, 390, 768]) {
    const context = await env.browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    for (const route of ['/', '/nouveautes/', '/livre-de-bord/', '/plan-de-travail/']) {
      await ouvrir(page, `${env.base}${route}`);
      const corps = () => page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('h1')).fontSize));
      const a = await corps();
      await taille(page, 200);
      const b = await corps();
      await taille(page, 100);
      if (Math.abs(b / a - 2) > 0.01) ecarts.push(`${route} @${width}px : h1 ${a} → ${b} px (× ${(b / a).toFixed(2)})`);
    }
    await context.close();
  }
  assert.deepEqual(ecarts, []);
});

test('navigation interne (transitions Astro) : la césure suit la nouvelle page', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await ouvrir(page, `${env.base}/`);
  await taille(page, 200);
  for (const cible of ['/nouveautes', '/livre-de-bord']) {
    // La promesse reste dans la page (window survit à l'échange du <body>) : evaluateHandle l'attendrait.
    await page.evaluate(() => { window.__chargee = new Promise((r) => document.addEventListener('astro:page-load', () => r(true), { once: true })); });
    // Clic sur un lien de la page (pied de page, présent partout) : le ClientRouter échange le <body>.
    await page.evaluate((href) => document.querySelector(`footer a[href="${href}"], footer a[href="${href}/"]`).click(), cible);
    await page.evaluate(() => window.__chargee);
    assert.equal(new URL(page.url()).pathname.replace(/\/$/, ''), cible);
    // Le ClientRouter recopie les attributs du nouveau <html> : le style posé par le test disparaît. Le réglage
    // réel de taille du texte vient du navigateur et survit à la navigation : on le rétablit ici.
    await taille(page, 200);
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
    await chargerImages(page);
    await attendreCesure(page);
    const poses = await page.evaluate((sel) => document.querySelectorAll(sel).length, POSE);
    assert.ok(poses > 0, `${cible} : rien de posé après la navigation interne`);
    assert.deepEqual(await verifierCoupures(page), [], `${cible} après navigation interne`);
  }
  await context.close();
});

// Revue de code r4 (mineur) : sur /ecosystem, chaque calcul allait au plafond de 8 passes (les blocs coupés
// d'un îlot Vue, que le script ne peut pas changer, revenaient à chaque passe). Une passe qui ne change rien
// arrête la boucle : le calcul converge avant sa borne, au réglage normal comme en texte agrandi.
test('la césure converge avant sa borne de 8 passes — /ecosystem, 320 et 1440 px, texte 100 et 200 %', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [320, 1440]) {
    const page = await env.browser.newPage({ viewport: { width, height: 844 } });
    await ouvrir(page, `${env.base}/ecosystem/`);
    for (const n of [100, 200]) {
      await taille(page, n);
      const passes = Number(await page.evaluate(() => document.documentElement.dataset.cesurePasses));
      assert.ok(passes < 8, `${width} px, ${n} % : ${passes} passes`);
    }
    await page.close();
  }
});
