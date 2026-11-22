// L7 r1 — correctifs de la revue UX de /atelier-ia/ (2026-11-22), mesurés sur le site CONSTRUIT
// (`npx astro build` avant ; tests navigateur en « skip » sans playwright-core/Chromium).
// Majeurs :
//  1 — schéma « Architecture mentale » : à 1440 px, 79 % de sa largeur visible (svg 853 px dans 702),
//      nœuds « Sylvain… » et « Codex » coupés (Nielsen 6).
//  2 — MermaidDiagram : la zone de défilement, focalisable au clavier, n'avait ni rôle ni nom
//      (WCAG 4.1.2) et son anneau de focus était rogné par la figure (overflow-hidden).
//  3 — plein écran à 1440×900 : 74 % de la hauteur du schéma visible, ajusté à la largeur seulement.
//  4 — plein écran : focus ni déplacé dans la fenêtre, ni retenu, ni rendu à « Agrandir » (WCAG 2.4.3, 2.4.11).
// Mineurs : erreur de rendu en anglais sans quoi faire ; curseur par défaut sur « Agrandir » ;
// « Prochaine étape » annonçait un carnet qui existe (/livre-de-bord/) sans y mener.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const FIG = 'figure:has([data-mermaid-inline])';

async function open(env, path, width, height = 900, route) {
  const context = await env.browser.newContext({ viewport: { width, height } });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  if (route) await context.route(route, (r) => r.abort());
  const page = await context.newPage();
  await page.goto(`${env.base}${path}`, { waitUntil: 'networkidle' });
  await page.locator(FIG).first().scrollIntoViewIfNeeded();
  return { context, page };
}

const drawn = (page) => page.waitForSelector(`${FIG} [data-mermaid-inline] svg`, { timeout: 20_000 });

test('L7 r1/1 — le schéma de l\'atelier tient entier dans son cadre à 1024 et 1440 px, texte ≥ 11 px', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1024, 1440]) {
    const { context, page } = await open(env, '/atelier-ia/', width);
    await drawn(page);
    const r = await page.evaluate(() => {
      const c = document.querySelector('[data-mermaid-inline]');
      const svg = c.querySelector('svg');
      const texts = [...svg.querySelectorAll('foreignObject *, text')]
        .filter((n) => [...n.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim()));
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      return {
        frame: c.clientWidth, scroll: c.scrollWidth,
        minText: Math.min(...texts.map((n) => parseFloat(getComputedStyle(n).fontSize) * scale)),
        page: document.documentElement.scrollWidth,
      };
    });
    assert.ok(r.scroll <= r.frame, `${width} px : schéma ${r.scroll} px pour un cadre de ${r.frame} px`);
    assert.ok(r.minText >= 10.9, `${width} px : texte du schéma à ${r.minText.toFixed(1)} px`);
    assert.ok(r.page <= width, `${width} px : page large de ${r.page} px`);
    await context.close();
  }
});

test('L7 r1/2 — une zone de schéma qui défile est une région nommée, à l\'anneau de focus non rogné', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  // 390 px : le schéma de l'atelier (et celui de Cloudflare) défilent dans leur cadre.
  for (const path of ['/atelier-ia/', '/cloudflare-pour-les-nuls/']) {
    const { context, page } = await open(env, path, 390, 844);
    await drawn(page);
    // L9 : depuis que le premier schéma de Cloudflare tient à 390 px, on prend le premier schéma qui DÉFILE
    // (celui de l'atelier, le diagramme de séquence de Cloudflare). Tous les schémas sont amenés à l'écran.
    for (const f of await page.locator(FIG).all()) await f.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('[data-mermaid-inline]')].filter((c) => c.querySelector('svg')).length === document.querySelectorAll('[data-mermaid-inline]').length, null, { timeout: 20_000 });
    const index = await page.evaluate(() => [...document.querySelectorAll('[data-mermaid-inline]')].findIndex((c) => c.scrollWidth > c.clientWidth));
    assert.ok(index >= 0, `${path} : aucun schéma ne défile à 390 px, test sans objet`);
    await page.waitForFunction((i) => document.querySelectorAll('[data-mermaid-inline]')[i].getAttribute('role') === 'region', index, { timeout: 5000 }).catch(() => {});
    const r = await page.evaluate((i) => {
      const c = document.querySelectorAll('[data-mermaid-inline]')[i];
      const caption = c.closest('figure').querySelector('figcaption')?.textContent.trim() ?? '';
      return { role: c.getAttribute('role'), label: c.getAttribute('aria-label') ?? '', tab: c.tabIndex, caption };
    }, index);
    assert.equal(r.role, 'region', `${path} : zone de défilement sans role=region`);
    assert.ok(r.label.includes(r.caption.slice(0, 30)), `${path} : nom « ${r.label} » sans le titre du schéma`);
    assert.equal(r.tab, 0, `${path} : zone de défilement hors de l'ordre de tabulation`);
    // Focus clavier : « Agrandir » puis la zone ; l'anneau est tracé en retrait (non rogné par la figure).
    await page.locator(FIG).nth(index).getByRole('button', { name: /Agrandir/ }).focus();
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => {
      const a = document.activeElement;
      const cs = getComputedStyle(a);
      return { zone: a.hasAttribute('data-mermaid-inline'), style: cs.outlineStyle, w: parseFloat(cs.outlineWidth), off: parseFloat(cs.outlineOffset) };
    });
    assert.ok(f.zone, `${path} : Tab après « Agrandir » ne mène pas à la zone du schéma`);
    assert.notEqual(f.style, 'none', `${path} : zone focalisée sans anneau`);
    assert.ok(f.w >= 2 && f.off + f.w <= 0, `${path} : anneau ${f.w} px décalé de ${f.off} px, rogné par la figure`);
    await context.close();
  }
});

test('L7 r1/3 — plein écran à 1440×900 : le schéma de l\'atelier est entier, sans défiler', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env, '/atelier-ia/', 1440, 900);
  await drawn(page);
  await page.locator(FIG).first().getByRole('button', { name: /Agrandir/ }).click();
  await page.waitForSelector('[role=dialog] svg[id^=mermaid]');
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const d = document.querySelector('[role=dialog]');
    const svg = d.querySelector('svg[id^=mermaid]');
    let zone = svg.parentElement;
    while (zone && getComputedStyle(zone).overflowY !== 'auto') zone = zone.parentElement;
    const z = zone.getBoundingClientRect();
    // Boîte du DESSIN : le contenu du svg (meet) mis à l'échelle et centré dans la boîte du svg.
    const s = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const k = Math.min(s.width / vb.width, s.height / vb.height);
    const dw = vb.width * k, dh = vb.height * k;
    const top = s.top + (s.height - dh) / 2, left = s.left + (s.width - dw) / 2;
    return {
      sh: zone.scrollHeight, ch: zone.clientHeight, sw: zone.scrollWidth, cw: zone.clientWidth,
      visible: { top: top >= z.top - 1, bottom: top + dh <= z.bottom + 1, left: left >= z.left - 1, right: left + dw <= z.right + 1 },
      part: Math.min(1, (z.bottom - Math.max(top, z.top)) / dh),
    };
  });
  assert.ok(r.sh <= r.ch + 1 && r.sw <= r.cw + 1, `zone ${r.sw}×${r.sh} pour ${r.cw}×${r.ch} visibles`);
  assert.deepEqual(r.visible, { top: true, bottom: true, left: true, right: true }, `${(100 * r.part).toFixed(0)} % de la hauteur visible`);
  await context.close();
});

test('L7 r1/4 — plein écran : focus déplacé dans la fenêtre, retenu, rendu à « Agrandir » après Échap', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const [path, width, height] of [['/atelier-ia/', 1440, 900], ['/atelier-ia/', 390, 844], ['/case-studies/finance-tracker/', 1440, 900]]) {
    const { context, page } = await open(env, path, width, height);
    await drawn(page);
    const agrandir = page.locator(FIG).first().getByRole('button', { name: /Agrandir/ });
    await agrandir.focus();
    await page.keyboard.press('Enter');
    await page.waitForSelector('[role=dialog] svg[id^=mermaid]');
    await page.waitForTimeout(250);
    const inside = () => page.evaluate(() => !!document.activeElement?.closest('[role=dialog][aria-modal=true]'));
    assert.ok(await inside(), `${path} ${width} : focus resté hors de la fenêtre à l'ouverture`);
    for (const key of ['Tab', 'Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
      await page.keyboard.press(key);
      assert.ok(await inside(), `${path} ${width} : ${key} sort de la fenêtre modale`);
    }
    // Tout arrêt de la fenêtre a un nom (pas de zone qui défile sans nom, cf. r1/2).
    const sansNom = await page.evaluate(() => [...document.querySelectorAll('[role=dialog] [tabindex="0"]')]
      .filter((n) => !(n.getAttribute('aria-label') ?? '').trim()).length);
    assert.equal(sansNom, 0, `${path} ${width} : arrêt de tabulation sans nom dans la fenêtre`);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.querySelector('[role=dialog]'), null, { timeout: 3000 });
    const r = await page.evaluate(() => ({ t: document.activeElement?.textContent.trim(), overflow: document.body.style.overflow }));
    assert.equal(r.t, 'Agrandir', `${path} ${width} : après Échap, focus sur « ${r.t} »`);
    assert.equal(r.overflow, '', 'défilement de la page non rétabli');
    await context.close();
  }
});

test('L7 r1 — mineurs : erreur de rendu en français avec quoi faire, curseur main sur « Agrandir »', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  // Échec forcé : le module mermaid ne se charge pas.
  const ko = await open(env, '/atelier-ia/', 1440, 900, /\/_astro\/mermaid\.core\./);
  await ko.page.waitForSelector(`${FIG} [role=alert]`, { timeout: 20_000 });
  const e = await ko.page.evaluate(() => {
    const f = document.querySelector('figure:has([data-mermaid-inline])');
    return { alerte: f.querySelector('[role=alert]').textContent.replace(/\s+/g, ' '), source: !!f.querySelector('details pre') };
  });
  assert.match(e.alerte, /Le schéma n'a pas pu s'afficher/);
  assert.match(e.alerte, /Rechargez la page/);
  assert.doesNotMatch(e.alerte, /render failed/i);
  assert.ok(e.source, 'source du schéma non proposée en cas d\'échec');
  await ko.context.close();

  const { context, page } = await open(env, '/atelier-ia/', 1440);
  await drawn(page);
  const cursor = await page.locator(FIG).first().getByRole('button', { name: /Agrandir/ }).evaluate((b) => getComputedStyle(b).cursor);
  assert.equal(cursor, 'pointer');
  await context.close();
});

test('L7 r1 — « Prochaine étape » mène au livre de bord', () => {
  const h = readFileSync(join(DIST, 'atelier-ia', 'index.html'), 'utf8');
  assert.match(h, /href="\/livre-de-bord\/"/);
  assert.doesNotMatch(h, /va devenir le carnet de bord/);
});
