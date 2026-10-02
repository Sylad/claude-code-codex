// L17 — barre de navigation dans un vrai navigateur, sur le site CONSTRUIT (dist).
// Barre du bureau dès 64em (seuil Tailwind `lg` = 64rem : en requête média, rem = em =
// taille de police par défaut du navigateur ; le site ne fixe pas `html { font-size }`).
// Leçon de warhammer40k L30 : mesurée aux largeurs courantes ET à chaque seuil ±1 px dans
// six configurations — polices web chargées, polices web bloquées (repli), police par
// défaut 18 px et 20 px (CDP Page.setFontSizes), polices bloquées + 18 px et + 20 px.
// Hors ligne (ou CCC_FONTS_OFFLINE=1 pour le simuler), les configurations « polices web »
// sont mesurées avec les polices de repli, et la sortie du test le dit.
//
// Lit le site CONSTRUIT : lancer `npx astro build` avant. Tests en « skip » sans
// playwright-core ni Chromium. CCC_NAV_TABLE=<fichier> écrit le tableau des mesures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const SEEN_KEY = 'ccc.news.seen-v1';
const OLD_VISIT = { date: '2026-01-01', slugs: [], at: '2026-01-01T10:00:00.000Z' };
const BAR_EM = 64;

const CONFIGS = [
  { name: 'polices web', fontSize: 16, webFonts: true },
  { name: 'polices web bloquées', fontSize: 16, webFonts: false },
  { name: 'police par défaut 18 px', fontSize: 18, webFonts: true },
  { name: 'police par défaut 20 px', fontSize: 20, webFonts: true },
  { name: 'polices bloquées + police 18 px', fontSize: 18, webFonts: false },
  { name: 'polices bloquées + police 20 px', fontSize: 20, webFonts: false },
];

/** Hôtes des polices web joignables ? Hors ligne, les configurations « polices web » se
 *  replient sur les polices de repli (et le disent) au lieu de faire échouer la suite. */
async function fontHostsReachable(browser) {
  if (process.env.CCC_FONTS_OFFLINE) return false;
  const context = await browser.newContext();
  try {
    const r = await context.request.get('https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap', { timeout: 5000 });
    return r.ok();
  } catch {
    return false;
  } finally {
    await context.close();
  }
}
const COMMON = [1024, 1280, 1366, 1440, 1920];
const widths = (fs) => [...new Set([...COMMON, BAR_EM * fs - 1, BAR_EM * fs, BAR_EM * fs + 1])].sort((a, b) => a - b);

async function openPage(env, { width, height = 800, fontSize = 16, webFonts = true, badge = true, path = '/about/' }) {
  const context = await env.browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  if (fontSize !== 16) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: fontSize, fixed: Math.round(fontSize * 13 / 16) } });
  }
  if (!webFonts || process.env.CCC_FONTS_OFFLINE) await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  if (badge) await page.addInitScript(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [SEEN_KEY, OLD_VISIT]);
  await page.goto(`${env.base}${path}`, { waitUntil: 'load' });
  if (badge) await page.waitForSelector('header .news-badge', { state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

/** Mesures de la barre : mode, débordements, marge logo → premier lien, dernier contrôle. */
const measureBar = (page) => page.evaluate(() => {
  const box = (e) => e.getBoundingClientRect();
  const shown = (e) => !!e && getComputedStyle(e).display !== 'none' && box(e).width > 0;
  const nav = document.querySelector('header nav');
  const brand = nav.querySelector(':scope > a');
  const ul = nav.querySelector(':scope > ul');
  const burger = nav.querySelector('button[aria-controls="mobile-menu"]');
  const bar = shown(ul);
  const items = bar ? [...ul.querySelectorAll(':scope > li > a, :scope > li > button')] : [];
  const last = bar ? items.at(-1) : burger;
  const multi = [];
  for (const root of [brand, ...items]) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim() || n.parentElement.closest('.sr-only')) continue;
      const r = document.createRange();
      r.selectNodeContents(n);
      if (new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size > 1) multi.push(n.textContent.trim());
    }
  }
  return {
    mode: bar ? 'barre' : 'menu',
    burger: shown(burger),
    page: document.documentElement.scrollWidth - innerWidth,
    navOverflow: nav.scrollWidth - nav.clientWidth,
    slack: Math.round(((bar ? box(items[0]).left : box(burger).left) - box(brand).right) * 10) / 10,
    lastRight: Math.round(box(last).right * 10) / 10,
    lastLabel: (last.textContent || last.getAttribute('aria-label')).trim().split(/\s+/)[0],
    labels: items.map((a) => {
      const c = a.cloneNode(true);
      c.querySelectorAll('.news-badge, .sr-only').forEach((x) => x.remove());
      return c.textContent.trim().replace(/\s+/g, ' ');
    }),
    multi,
    badge: document.querySelector(bar ? 'header ul .news-badge' : 'header nav button .news-badge')?.textContent.trim() ?? '',
  };
});

test('barre : mode attendu à chaque largeur et seuil ±1 px, six configurations ; aucun débordement, ≥ 16 px après le logo, dernier contrôle entier à l’écran', { timeout: 600_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const rows = [];
  const failures = [];
  const online = await fontHostsReachable(env.browser);
  if (!online) t.diagnostic('hôtes des polices web injoignables : les configurations « polices web » sont mesurées avec les polices de repli (même attente que « polices web bloquées »)');
  for (const cfg of CONFIGS) {
    for (const width of widths(cfg.fontSize)) {
      const { context, page } = await openPage(env, { width, fontSize: cfg.fontSize, webFonts: cfg.webFonts });
      const fonts = await page.evaluate(() => [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Inter' && f.status === 'loaded'));
      const m = await measureBar(page);
      await context.close();
      const expected = width / cfg.fontSize >= BAR_EM ? 'barre' : 'menu';
      rows.push({ cfg: cfg.webFonts && !online ? `${cfg.name} (hors ligne : repli)` : cfg.name, width, ...m, fonts });
      const bad = [];
      const expectFonts = cfg.webFonts && online;
      if (fonts !== expectFonts) bad.push(`Inter ${fonts ? 'chargée' : 'absente'}`);
      if (m.mode !== expected) bad.push(`mode ${m.mode} au lieu de ${expected}`);
      if (m.page > 0) bad.push(`page déborde de ${m.page}px`);
      if (m.navOverflow > 0) bad.push(`barre déborde de ${m.navOverflow}px`);
      if (m.slack < 16) bad.push(`${m.slack}px après le logo`);
      if (m.lastRight > width) bad.push(`dernier contrôle coupé (${m.lastRight})`);
      if (m.multi.length) bad.push(`sur deux lignes : ${m.multi.join(', ')}`);
      if (m.badge !== String(JSON.parse(readFileSync(new URL('../public/nouveautes-data/nouveautes.json', import.meta.url), 'utf8')).entries.length)) bad.push(`pastille « ${m.badge} »`);
      if (m.mode === 'barre') {
        if (!m.labels.includes('Nouveautés')) bad.push('Nouveautés absent');
        if (!m.labels.includes('Ressources')) bad.push('Ressources absent');
        for (const gone of ['Learning', 'Vidéos', 'À propos']) if (m.labels.includes(gone)) bad.push(`${gone} dans la barre`);
      }
      if (bad.length) failures.push(`${cfg.name} ${width}px : ${bad.join(' ; ')}`);
    }
  }
  const table = ['| configuration | largeur | mode | écart logo→1er (px) | bord droit du dernier | débordement page/barre |', '|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.cfg} | ${r.width} | ${r.mode} | ${r.slack} | ${r.lastRight} (${r.lastLabel}) | ${r.page}/${r.navOverflow} |`)].join('\n');
  t.diagnostic(`\n${table}`);
  if (process.env.CCC_NAV_TABLE) writeFileSync(process.env.CCC_NAV_TABLE, `${table}\n`);
  assert.deepEqual(failures, []);
});

test('320 et 390 px, avec et sans pastille : barre sans débordement, bouton du menu entier, 44 px, nom accessible', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [320, 390]) {
    for (const badge of [true, false]) {
      const { context, page } = await openPage(env, { width, badge, path: '/plan-de-travail/' });
      if (!badge) await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const b = document.querySelector('button[aria-controls="mobile-menu"]');
        const r = b.getBoundingClientRect();
        const nav = document.querySelector('header nav');
        return {
          page: document.documentElement.scrollWidth - innerWidth, nav: nav.scrollWidth - nav.clientWidth,
          left: r.left, right: r.right, w: r.width, h: r.height, label: b.getAttribute('aria-label'),
          badge: b.querySelector('.news-badge')?.getBoundingClientRect().right ?? null,
        };
      });
      await context.close();
      const where = `${width}px pastille ${badge}`;
      assert.ok(m.page <= 0 && m.nav <= 0, `${where} : débordement ${m.page}/${m.nav}`);
      assert.ok(m.right <= width && m.w >= 44 && m.h >= 44, `${where} : bouton ${JSON.stringify(m)}`);
      assert.equal(m.badge !== null, badge, `${where} : pastille`);
      if (badge) {
        assert.ok(m.badge <= width, `${where} : pastille coupée`);
        assert.match(m.label, /^Ouvrir le menu \(\d+ nouveautés? non vues?\)$/);
      } else assert.equal(m.label, 'Ouvrir le menu');
    }
  }
});

test('menu du téléphone (390 px) : Ressources dépliées, Nouveautés avec pastille, Plan de travail et À propos ; chaque lien y mène', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await openPage(env, { width: 390, height: 844, path: '/' });
  await page.click('button[aria-controls="mobile-menu"]');
  const hrefs = await page.$$eval('#mobile-menu a', (as) => as.map((a) => a.getAttribute('href')));
  for (const h of ['/learning', '/videos', '/nouveautes', '/plan-de-travail', '/about']) assert.ok(hrefs.includes(h), `${h} absent du menu`);
  assert.equal(await page.locator('#mobile-menu a[href="/nouveautes"] .news-badge').count(), 1);
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith('/plan-de-travail')), page.locator('#mobile-menu a[href="/plan-de-travail"]').click()]);
  await page.waitForFunction(() => !document.getElementById('mobile-menu'));
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'main', 'focus après la navigation');
  await context.close();
});

const panelState = (page) => page.evaluate(() => Object.fromEntries(['guides', 'ressources'].map((k) => {
  const p = document.getElementById(`panneau-${k}`);
  return [k, !!p && getComputedStyle(p).display !== 'none'];
})));

test('« Ressources ▾ » au clavier (1440 px) : bouton à divulgation, Entrée/Espace, Tab parcourt les liens, Échap rend le focus, sortir par Tab ferme', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await openPage(env, { width: 1440, height: 900 });
  const btn = page.locator('button[data-dropdown-toggle="Ressources"]');
  assert.equal(await btn.getAttribute('aria-controls'), 'panneau-ressources');
  assert.equal(await page.locator('#panneau-ressources').count(), 1, 'aria-controls vise un élément absent');
  assert.equal(await btn.getAttribute('aria-haspopup'), null);
  assert.equal(await page.locator('[role="menu"], [role="menuitem"]').count(), 0, 'menu ARIA');
  const active = () => page.evaluate(() => document.activeElement.getAttribute('href') ?? document.activeElement.dataset.dropdownToggle ?? document.activeElement.tagName);
  await btn.focus();
  await page.keyboard.press('Enter');
  assert.equal(await btn.getAttribute('aria-expanded'), 'true');
  assert.equal(await active(), 'Ressources', 'le focus doit rester sur le bouton');
  await page.keyboard.press('Tab');
  assert.equal(await active(), '/learning');
  await page.keyboard.press('Tab');
  assert.equal(await active(), '/videos');
  await page.keyboard.press('Escape');
  assert.equal(await btn.getAttribute('aria-expanded'), 'false');
  assert.equal(await active(), 'Ressources');
  await page.keyboard.press('Space');
  assert.equal(await btn.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Space');
  assert.equal(await btn.getAttribute('aria-expanded'), 'false', 'Espace referme');
  await page.keyboard.press('Enter');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  assert.equal(await active(), '/nouveautes');
  assert.equal(await btn.getAttribute('aria-expanded'), 'false', 'le focus a quitté le groupe : fermé');
  await context.close();
});

test('panneaux (1440 px) : jamais deux ouverts, fermés par un clic à l’extérieur, pas d’ouverture au survol, fermés et focus sur le contenu après une navigation', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await openPage(env, { width: 1440, height: 900 });
  await page.hover('button[data-dropdown-toggle="Ressources"]');
  await page.waitForTimeout(150);
  assert.deepEqual(await panelState(page), { guides: false, ressources: false }, 'ouvert au survol');
  await page.click('button[data-dropdown-toggle="Guides"]');
  assert.deepEqual(await panelState(page), { guides: true, ressources: false });
  await page.click('button[data-dropdown-toggle="Ressources"]');
  assert.deepEqual(await panelState(page), { guides: false, ressources: true }, 'deux panneaux ouverts');
  await page.mouse.click(700, 500);
  assert.deepEqual(await panelState(page), { guides: false, ressources: false }, 'clic extérieur');
  // Navigation par le clavier depuis le panneau : arrivée sur /videos, panneau fermé, focus sur le contenu.
  await page.focus('button[data-dropdown-toggle="Ressources"]');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith('/videos')), page.keyboard.press('Enter')]);
  await page.waitForFunction(() => document.activeElement?.id === 'main', null, { timeout: 5000 });
  assert.deepEqual(await panelState(page), { guides: false, ressources: false });
  assert.equal(await page.locator('button[data-dropdown-toggle="Ressources"]').getAttribute('aria-expanded'), 'false');
  assert.ok(await page.locator('button[data-dropdown-toggle="Ressources"].text-claude').count() === 1, 'Ressources non signalé actif sur /videos');
  await context.close();
});

test('captures des Nouveautés (CCC_E2E_SHOTS) : accueil 1440×500 « Ressources ▾ » ouvert, menu du téléphone ouvert à 390 px', { timeout: 60_000 }, async (t) => {
  const shots = process.env.CCC_E2E_SHOTS;
  if (!shots) { t.skip('CCC_E2E_SHOTS non défini'); return; }
  const env = await setupBrowser(t);
  if (!env) return;
  let { context, page } = await openPage(env, { width: 1440, height: 500, path: '/', badge: false });
  await page.click('button[data-dropdown-toggle="Ressources"]');
  await page.waitForTimeout(250);
  await page.mouse.move(1400, 480);
  await page.screenshot({ path: join(shots, 'codex-news-L17-1440.png') });
  await context.close();
  ({ context, page } = await openPage(env, { width: 390, height: 844, path: '/', badge: false }));
  await page.click('button[aria-controls="mobile-menu"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(shots, 'codex-news-L17-390.png') });
  await context.close();
});

// ── Pied de page et accueil ─────────────────────────────────────────────────
test('pied de page de toutes les pages : rangée Nouveautés, Plan de travail, À propos (sans séparateur)', () => {
  for (const p of ['index.html', 'about/index.html', 'nouveautes/index.html', 'plan-de-travail/index.html', 'case-studies/ruflo/index.html', 'videos/index.html']) {
    const html = readFileSync(join(DIST, p), 'utf8');
    const footer = html.slice(html.indexOf('<footer'));
    const row = footer.slice(footer.indexOf('aria-label="Le site"'), footer.indexOf('</nav>'));
    const hrefs = [...row.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(hrefs, ['/nouveautes', '/plan-de-travail', '/about'], p);
    assert.doesNotMatch(row.replace(/<[^>]+>/g, ''), /[·|•]/, `${p} : séparateur`);
  }
  // L'accueil mène aussi aux deux pages hors du pied de page.
  const home = readFileSync(join(DIST, 'index.html'), 'utf8');
  const main = home.slice(home.indexOf('<main'), home.indexOf('</main>'));
  for (const h of ['/nouveautes', '/plan-de-travail']) assert.match(main, new RegExp(`href="${h}"`), `accueil → ${h}`);
});

test('pied de page : la page courante est marquée (aria-current + style actif) sur Nouveautés, Plan de travail, À propos ; aucune ailleurs', () => {
  const row = (p) => {
    const html = readFileSync(join(DIST, p), 'utf8');
    const footer = html.slice(html.indexOf('<footer'));
    return footer.slice(footer.indexOf('aria-label="Le site"'), footer.indexOf('</nav>'));
  };
  for (const [p, href] of [['nouveautes/index.html', '/nouveautes'], ['plan-de-travail/index.html', '/plan-de-travail'], ['about/index.html', '/about']]) {
    const current = [...row(p).matchAll(/<a [^>]*aria-current="page"[^>]*>/g)].map((m) => m[0]);
    assert.equal(current.length, 1, `${p} : ${current.length} lien(s) courant(s)`);
    assert.match(current[0], new RegExp(`href="${href}"`), p);
    assert.match(current[0], /text-claude/, `${p} : style actif absent`);
  }
  for (const p of ['index.html', 'videos/index.html']) assert.doesNotMatch(row(p), /aria-current/, p);
});

test('pied de page après une navigation interne (routeur Astro) : le lien courant suit la page', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await openPage(env, { width: 1440, height: 900, path: '/about/', badge: false });
  const current = () => page.$$eval('footer nav[aria-label="Le site"] a[aria-current="page"]', (as) => as.map((a) => a.getAttribute('href')));
  assert.deepEqual(await current(), ['/about']);
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith('/plan-de-travail')), page.locator('footer a[href="/plan-de-travail"]').click()]);
  await page.waitForFunction(() => document.querySelector('footer a[aria-current="page"]')?.getAttribute('href') === '/plan-de-travail', null, { timeout: 5000 });
  assert.deepEqual(await current(), ['/plan-de-travail']);
  await context.close();
});

test('pied de page (320 px tactile, 1440 px) : cibles ≥ 44 px, rien hors de l’écran', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [320, 1440]) {
    const context = await env.browser.newContext({ viewport: { width, height: 800 }, hasTouch: width < 400, isMobile: width < 400 });
    const page = await context.newPage();
    await page.goto(`${env.base}/`, { waitUntil: 'load' });
    const r = await page.$$eval('footer nav[aria-label="Le site"] a', (as) => as.map((a) => { const b = a.getBoundingClientRect(); return { t: a.textContent.trim(), h: b.height, l: b.left, r: b.right }; }));
    assert.equal(r.length, 3);
    for (const x of r) assert.ok(x.h >= 44 && x.l >= 0 && x.r <= width, `${width}px ${x.t} : ${JSON.stringify(x)}`);
    await context.close();
  }
});

// WCAG 1.4.4 (texte agrandi) et 1.4.12 (espacement du texte) sur l'accueil à 320 px.
const TEXT_SPACING = '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }';

test('accueil à 320 px, police racine ×1,25 puis espacement WCAG 1.4.12 : aucun élément à x < 0, page ≤ 320 px', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const [name, css] of [['racine ×1,25', 'html { font-size: 125% !important; }'], ['espacement 1.4.12', TEXT_SPACING], ['les deux', `html { font-size: 125% !important; } ${TEXT_SPACING}`]]) {
    const context = await env.browser.newContext({ viewport: { width: 320, height: 568 } });
    const page = await context.newPage();
    await page.goto(`${env.base}/`, { waitUntil: 'load' });
    await page.addStyleTag({ content: css });
    await page.waitForTimeout(100);
    const m = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('body *')) {
        if (el.closest('.sr-only, [aria-hidden="true"], script, style') || el.classList.contains('sr-only')) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(el).position === 'fixed' && el.closest('.-z-10')) continue;
        if (r.left < -0.5) out.push(`${el.tagName}.${String(el.className).slice(0, 40)} @${r.left.toFixed(1)}`);
      }
      return { left: out.slice(0, 5), width: document.documentElement.scrollWidth };
    });
    await context.close();
    assert.deepEqual(m.left, [], `${name} : éléments à gauche de l’écran`);
    assert.ok(m.width <= 320, `${name} : page de ${m.width} px`);
  }
});

test('accueil 320×568, 360×640, 390×844 : aucun élément interactif n’en chevauche un autre (menu fermé puis ouvert)', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const overlaps = () => page.evaluate(() => {
    const els = [...document.querySelectorAll('a[href], button, [tabindex="0"]')].filter((e) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('.sr-only') && !e.classList.contains('sr-only');
    });
    const scrollY = window.scrollY;
    const boxes = els.map((e) => {
      const r = e.getBoundingClientRect();
      const fixed = !!e.closest('header');
      return { e, l: r.left, t: r.top + (fixed ? 0 : scrollY), r: r.right, b: r.bottom + (fixed ? 0 : scrollY), fixed };
    });
    const out = boxes.length < 15 ? [`seulement ${boxes.length} éléments interactifs mesurés`] : [];
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i], b = boxes[j];
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
      const w = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const h = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (w > 0.5 && h > 0.5) out.push(`${a.e.textContent.trim().slice(0, 25) || a.e.getAttribute('aria-label')} × ${b.e.textContent.trim().slice(0, 25) || b.e.getAttribute('aria-label')}`);
    }
    return out;
  });
  let page;
  for (const [w, h] of [[320, 568], [360, 640], [390, 844]]) {
    const context = await env.browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    page = await context.newPage();
    await page.addInitScript(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [SEEN_KEY, OLD_VISIT]);
    await page.goto(`${env.base}/`, { waitUntil: 'load' });
    await page.waitForSelector('header nav button .news-badge');
    assert.deepEqual(await overlaps(), [], `${w}×${h} menu fermé`);
    await page.click('button[aria-controls="mobile-menu"]');
    await page.waitForTimeout(300);
    const inMenu = await page.evaluate(() => {
      const els = [...document.querySelectorAll('header a[href], header button')].filter((e) => e.getBoundingClientRect().height > 0 && e.getBoundingClientRect().bottom <= innerHeight);
      const out = [];
      for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
        const [a, b] = [els[i].getBoundingClientRect(), els[j].getBoundingClientRect()];
        if (els[i].contains(els[j]) || els[j].contains(els[i])) continue;
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0.5 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 0.5) out.push(`${els[i].textContent.trim()} × ${els[j].textContent.trim()}`);
      }
      return out;
    });
    assert.deepEqual(inMenu, [], `${w}×${h} menu ouvert`);
    await context.close();
  }
});
