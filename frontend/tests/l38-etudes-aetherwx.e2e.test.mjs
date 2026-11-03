// L38 — études de cas AetherWX et jobmail-assistant à jour (fiche docs/specs/etudes-de-cas-aetherwx/fiche.yaml).
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const ETUDES = {
  'maritime-atlas': ['maritime-atlas'],
  'aetherwx-qa-harness': ['maritime-atlas'],
  'aetherwx-encyclopedia': ['maritime-atlas', 'aetherwx-gitops'],
  'jobmail-assistant': ['jobmail-assistant'],
};
const html = (e) => readFileSync(join(DIST, 'case-studies', e, 'index.html'), 'utf8');
const brut = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ');
const texte = (h) => brut(h).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&nbsp;|[  ]/g, ' ').replace(/\s+/g, ' ');
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DATE = String.raw`(?:1er|\d{1,2}) (?:${MOIS.join('|')}) \d{4}`;
// un élément portant data-testid="<id>" : texte de son contenu
const marques = (h, id) => [...h.matchAll(new RegExp(`<(\\w+)[^>]*data-testid="${id}"[^>]*>([\\s\\S]*?)</\\1>`, 'g'))].map((m) => texte(m[2]).trim());
const jourValide = (s) => {
  const m = s.match(new RegExp(`(1er|\\d{1,2}) (${MOIS.join('|')}) (\\d{4})`));
  if (!m) return false;
  const d = new Date(Date.UTC(+m[3], MOIS.indexOf(m[2]), m[1] === '1er' ? 1 : +m[1]));
  return d.getUTCMonth() === MOIS.indexOf(m[2]) && d.getUTCDate() === (m[1] === '1er' ? 1 : +m[1]);
};

test('R1 — chaque étude touchée porte « Mis à jour le <date> » avec une date valide, en tête de colonne', () => {
  for (const e of Object.keys(ETUDES)) {
    const h = html(e);
    const dates = marques(h, 'date-maj');
    assert.equal(dates.length, 1, `${e} : une seule date de fraîcheur`);
    assert.match(dates[0], new RegExp(`^Mis à jour le ${DATE}$`), e);
    assert.ok(jourValide(dates[0]), `${e} : date existante`);
    assert.equal(dates[0], 'Mis à jour le 3 novembre 2026', e);
    // dans la colonne de contenu, avant la première section (h2)
    const colonne = h.indexOf('max-w-3xl');
    const iDate = h.indexOf('data-testid="date-maj"');
    const iH2 = h.indexOf('<h2', colonne);
    assert.ok(colonne > 0 && iDate > colonne && iDate < iH2, `${e} : bloc avant la première section`);
  }
});

test('R1 — aucune mention « Captures prises en <mois> » ni « Où en est… <mois ancien> » ne contredit la date', () => {
  for (const e of Object.keys(ETUDES)) {
    const t = texte(html(e));
    assert.doesNotMatch(t, /Captures? prises? en/i, e);
    assert.doesNotMatch(t, /Où en est[^.]{0,40}(septembre|octobre|mai|juin) 2026/i, e);
  }
  assert.match(texte(html('maritime-atlas')), /Où en est le projet — novembre 2026/);
});

test('R2 — chaque étude touchée nomme au moins un dépôt', () => {
  for (const [e, depots] of Object.entries(ETUDES)) {
    const [bloc] = marques(html(e), 'depots-decrits');
    assert.ok(bloc, `${e} : bloc dépôts`);
    assert.match(bloc, /^Dépôts? décrits? : /, e);
    for (const d of depots) assert.ok(bloc.includes(d), `${e} nomme ${d}`);
  }
});

test('R3 — aucun chiffre clé sans date de relevé dans les quatre études', () => {
  for (const e of Object.keys(ETUDES)) {
    const h = html(e);
    const chiffres = marques(h, 'chiffre-date');
    assert.ok(chiffres.length >= 1, `${e} : au moins un chiffre daté`);
    for (const c of chiffres) {
      assert.match(c, new RegExp(`(^\\d+ .+ au ${DATE} \\(.+\\)\\.?$)|(non relevé au ${DATE} : .+)`), `${e} : « ${c} »`);
      assert.ok(jourValide(c), `${e} : date existante dans « ${c} »`);
    }
  }
  const ma = texte(html('maritime-atlas'));
  assert.match(ma, /68 couches de données au 3 novembre 2026 \(qa\/layers\.manifest\.json\)/);
  assert.doesNotMatch(texte(html('aetherwx-qa-harness')), /une quarantaine de layers/);
});

test('R3 — aucun chiffre de l\'état réel (pods, lignes, scripts) sans date de relevé dans sa phrase, balisé ou non', () => {
  // un chiffre de l'état réel : effectif de pods, taille d'un fichier, nombre de scripts / commits / couches / layers
  const CLE = /(?:une vingtaine|\d[\d ]*\+?) (?:de )?pods|\d+ scripts?\b|\d+ combinaisons|quatre mois de prod/g;
  const DATEE = new RegExp(`(?:au|le|du|de|en) ${DATE}|(?:au|le|du|de|en) (?:${MOIS.join('|')}) \\d{4}|non relevé`);
  for (const e of Object.keys(ETUDES)) {
    const h = html(e);
    // les extraits de code (diagrammes, scripts) sont des exemples, pas des chiffres de l'étude
    const prose = texte(h.replace(/<pre[\s\S]*?<\/pre>/g, ' ').replace(/<code[^>]*data-language[\s\S]*?<\/code>/g, ' '));
    const phrases = prose.split(/(?<=[.!?])\s+(?=[A-ZÉÈÀ«])/);
    for (const ph of phrases) {
      // la taille de globe.component.ts est un chiffre de l'état réel ; les « N lignes » d'une anecdote (diagnostic, historique) n'en sont pas
      const cles = [...ph.matchAll(CLE)].map((m) => m[0]);
      if (/globe\.component\.ts/.test(ph)) cles.push(...(ph.match(/\d[\d ]*\+? lignes/g) ?? []));
      for (const m of cles.map((c) => [c])) {
        assert.match(ph, DATEE, `${e} : « ${m[0]} » sans date de relevé dans « ${ph.slice(0, 160)} »`);
      }
    }
  }
});

test('R4 — chaque image des études touchées a une légende « Capture du <date> — <description existante> »', () => {
  const attendues = ['Navires AIS live (2500+ positions)', 'SST (température de surface de la mer)', 'Vent (GFS)', 'Vagues — NOAA WaveWatch III',
    'Radar pluie (RainViewer', 'Alerts engine', 'Particules vent style windy.com'];
  for (const e of Object.keys(ETUDES)) {
    const figures = [...html(e).matchAll(/<figure[\s\S]*?<\/figure>/g)].map((m) => m[0]).filter((f) => /<(img|video)\b/.test(f));
    const legendes = figures.map((f) => marques(f, 'legende-capture')[0]);
    legendes.forEach((l, i) => {
      assert.ok(l, `${e} : figure ${i} légendée`);
      assert.match(l, new RegExp(`^Capture du ${DATE}(?: \\(carte 2D, avant le globe\\))? — \\S`), `${e} : « ${l.slice(0, 60)} »`);
    });
    if (e === 'maritime-atlas') {
      assert.equal(legendes.length, attendues.length + 2);
      attendues.forEach((a, i) => assert.ok(legendes[i].includes(a), `description conservée : ${a}`));
      // diagrammes du 17 septembre 2026 : datés, sans la mention de l'ancienne carte 2D
      assert.match(legendes[7], /^Capture du 17 septembre 2026 — État de la prod dark-blue au 2026-09-17\./);
      assert.match(legendes[8], /^Capture du 17 septembre 2026 — La chaîne de livraison/);
      // fichiers d'origine du 11 mai 2026 : la légende le dit
      for (const l of legendes.slice(0, 7)) assert.match(l, /^Capture du 11 mai 2026 \(carte 2D, avant le globe\) — /);
      assert.equal(legendes[0], 'Capture du 11 mai 2026 (carte 2D, avant le globe) — Navires AIS live (2500+ positions) + trajets daily agrégés. Chaque couleur = catégorie de bateau (cargo bleu, tanker rose, pêche jaune, passenger vert).');
    }
  }
});

test('R5 — chiffre sans relevé : message affiché, ni « undefined » ni « NaN »', () => {
  const t = texte(html('aetherwx-encyclopedia'));
  assert.match(t, /Nombre de pods du namespace maritime non relevé au 3 novembre 2026 : .+ Il sera ajouté à la prochaine mise à jour\./);
  // les blocs de L38 seulement : l'étude de l'encyclopédie parle légitimement d'une valeur « undefined » plus bas
  for (const e of Object.keys(ETUDES)) {
    for (const id of ['chiffre-date', 'date-maj', 'depots-decrits', 'legende-capture']) {
      for (const bloc of marques(html(e), id)) assert.doesNotMatch(bloc, /\bundefined\b|\bNaN\b|\bnull\b/, `${e} ${id}`);
    }
  }
});

const ALLER = async (env, route, setup) => {
  const ctx = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  if (setup) await setup(page);
  await page.goto(`${env.base}${route}`, { waitUntil: 'domcontentloaded' });
  return { ctx, page };
};
const CADRE = '[data-capture="01-vessels"]';

test('R6 — cadre de capture réservé avant chargement', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t); if (!env) return;
  const { ctx, page } = await ALLER(env, '/case-studies/maritime-atlas/', (p) => p.route('**/01-vessels.jpg', async (r) => { await new Promise((ok) => setTimeout(ok, 2500)); await r.continue(); }));
  const avant = await page.locator(CADRE).boundingBox();
  assert.ok(avant.height > 100 && Math.abs(avant.height - avant.width * 9 / 16) < 1.5, `cadre 16/9 réservé : ${JSON.stringify(avant)}`);
  await page.locator(CADRE).scrollIntoViewIfNeeded();
  const msg = page.locator(`${CADRE} [data-message="chargement"]`);
  await msg.waitFor({ state: 'visible', timeout: 2000 });
  assert.equal((await msg.innerText()).trim(), 'Capture « Navires AIS live » en cours de chargement. Elle apparaît dans un instant.');
  const pendant = await page.locator(CADRE).boundingBox();
  assert.ok(Math.abs(pendant.height - avant.height) < 1.5, 'le cadre ne bouge pas pendant le chargement');
  await msg.waitFor({ state: 'hidden', timeout: 10_000 });
  const apres = await page.locator(CADRE).boundingBox();
  assert.ok(Math.abs(apres.height - avant.height) < 1.5, 'le cadre ne saute pas à l\'arrivée de l\'image');
  assert.ok(await page.locator(`${CADRE} img`).evaluate((i) => i.naturalWidth > 0));
  await ctx.close();
});

test('R7 — image en échec : message affiché, texte de l\'étude intact', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t); if (!env) return;
  const { ctx, page } = await ALLER(env, '/case-studies/maritime-atlas/', (p) => p.route('**/01-vessels.jpg', (r) => r.abort()));
  await page.locator(CADRE).scrollIntoViewIfNeeded();
  const err = page.locator(`${CADRE} [data-message="erreur"]`);
  await err.waitFor({ state: 'visible', timeout: 10_000 });
  const message = (await err.innerText()).trim();
  assert.equal(message, 'Capture « Navires AIS live » indisponible : le fichier n\'a pas pu être chargé. Recharge la page pour la réafficher ; sa description reste lisible dans la légende ci-dessous.');
  assert.doesNotMatch(message, /github|dépôt/i);
  assert.equal(await page.locator(`${CADRE} [data-message="chargement"]`).isVisible(), false);
  const legende = await page.locator('figure:has(' + CADRE + ') figcaption').innerText();
  assert.match(legende.replace(/\s+/g, ' '), /Capture du 11 mai 2026 \(carte 2D, avant le globe\) — Navires AIS live \(2500\+ positions\)/);
  const cadre = await page.locator(CADRE).boundingBox();
  assert.ok(cadre.height > 100, 'cadre toujours réservé');
  const corps = await page.locator('main').innerText();
  assert.match(corps, /Où en est le projet/i);
  assert.match(corps, /Pourquoi ce projet/i);
  // les autres captures restent affichées
  await page.locator('[data-capture="02-sst"]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('[data-capture="02-sst"] img')?.naturalWidth > 0, null, { timeout: 10_000 });
  await ctx.close();
});

test('R7 — le cadre grandit avec le message d\'erreur, texte rogné nulle part (320 px, police à 200 %)', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t); if (!env) return;
  for (const [largeur, zoom] of [[320, '100%'], [390, '200%']]) {
    const ctx = await env.browser.newContext({ viewport: { width: largeur, height: 800 } });
    const page = await ctx.newPage();
    await page.route('**/01-vessels.jpg', (r) => r.abort());
    await page.addInitScript((z) => { document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = z; }); }, zoom);
    await page.goto(`${env.base}/case-studies/maritime-atlas/`, { waitUntil: 'domcontentloaded' });
    await page.locator(CADRE).scrollIntoViewIfNeeded();
    const err = page.locator(`${CADRE} [data-message="erreur"]`);
    await err.waitFor({ state: 'visible', timeout: 10_000 });
    const m = await err.evaluate((el) => ({ haut: el.scrollHeight, vu: el.clientHeight, cadre: el.parentElement.getBoundingClientRect().height, bas: el.getBoundingClientRect().bottom, basCadre: el.parentElement.getBoundingClientRect().bottom, rogne: getComputedStyle(el.parentElement).overflow }));
    assert.ok(m.cadre >= m.haut, `${largeur}px/${zoom} : cadre ${m.cadre} < texte ${m.haut}`);
    assert.ok(m.bas <= m.basCadre + 0.5, `${largeur}px/${zoom} : le texte dépasse le cadre`);
    await ctx.close();
  }
});

test('R7 — toutes les images chargent (naturalWidth > 0)', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t); if (!env) return;
  for (const e of Object.keys(ETUDES)) {
    const { ctx, page } = await ALLER(env, `/case-studies/${e}/`);
    await page.evaluate(() => document.querySelectorAll('img').forEach((i) => { i.loading = 'eager'; }));
    await page.waitForLoadState('load');
    await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15_000 });
    const casses = await page.evaluate(() => [...document.images].filter((i) => !(i.naturalWidth > 0)).map((i) => i.src));
    assert.deepEqual(casses, [], `${e} : images cassées`);
    await ctx.close();
  }
});
