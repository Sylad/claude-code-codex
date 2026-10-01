// L13 — page /nouveautes/ : contenu généré au build depuis nouveautes.json, lien dans la
// barre de navigation (bureau) et le menu du téléphone, visionneuse des captures,
// contraste, clavier et reflow à 320 px.
//
// Lit le site CONSTRUIT (frontend/dist) : lancer `npx astro build` avant. Les tests
// statiques échouent si dist est absent ou périmé ; les tests navigateur se mettent en
// « skip » sans playwright-core ni Chromium.
// CCC_E2E_SHOTS=<dossier> enregistre une capture de la page à 1440, 390 et 320 px.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser, worstPixelContrast } from './lib/e2e-dist.mjs';

const DATA = JSON.parse(readFileSync(new URL('../public/nouveautes-data/nouveautes.json', import.meta.url), 'utf8'));
const PAGE = join(DIST, 'nouveautes', 'index.html');
const html = () => readFileSync(PAGE, 'utf8');

// ── Page construite ─────────────────────────────────────────────────────────
test('dist/nouveautes/index.html est construit, titré « Nouveautés »', () => {
  assert.ok(existsSync(PAGE), 'page absente : lancer `npx astro build`');
  assert.match(html(), /<title>Nouveautés · claude-code-codex<\/title>/);
  assert.match(html(), /<h1[^>]*>\s*Ce qui a changé\s*<\/h1>/);
});

test('une entrée par nouveauté, dans l’ordre du JSON (la plus récente en haut), titre + date + texte + captures', () => {
  const page = html();
  const ids = [...page.matchAll(/<article[^>]*class="news-entry[^"]*"[^>]*id="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(ids, DATA.entries.map((e) => e.slug));
  for (const e of DATA.entries) {
    const start = page.indexOf(`id="${e.slug}"`);
    const block = page.slice(start, page.indexOf('</article>', start));
    assert.ok(block.includes(`<time datetime="${e.date}"`), `${e.slug} : date absente`);
    assert.ok(block.includes(e.title), `${e.slug} : titre absent`);
    assert.ok(block.includes(e.html.slice(0, 60)), `${e.slug} : texte absent`);
    for (const c of e.captures) {
      assert.ok(block.includes(`src="/nouveautes-data/${c}"`), `${e.slug} : capture ${c} absente`);
      assert.ok(existsSync(join(DIST, 'nouveautes-data', c)), `${c} non servie`);
    }
    assert.match(block, /<img [^>]*width="\d+"[^>]*height="\d+"/, `${e.slug} : dimensions des captures absentes`);
  }
});

test('date affichée en français (« 1 octobre 2026 »)', () => {
  assert.match(html(), /<time datetime="2026-10-01"[^>]*>1 octobre 2026<\/time>/);
});

test('pas de doublon non habillé : dist/nouveautes-data/index.html absent', () => {
  assert.ok(!existsSync(join(DIST, 'nouveautes-data', 'index.html')));
});

test('la barre de navigation de toutes les pages mène à /nouveautes, active (aria-current) sur la page', () => {
  for (const p of ['index.html', 'about/index.html', 'case-studies/ruflo/index.html']) {
    assert.match(readFileSync(join(DIST, p), 'utf8'), /<a href="\/nouveautes"/, p);
  }
  assert.match(html(), /<a href="\/nouveautes"[^>]*aria-current="page"/);
  assert.doesNotMatch(readFileSync(join(DIST, 'about/index.html'), 'utf8'), /<a href="\/nouveautes"[^>]*aria-current/);
});

test('le pied de page mène aussi à /nouveautes, à côté d’« À propos »', () => {
  const page = readFileSync(join(DIST, 'index.html'), 'utf8');
  const footer = page.slice(page.indexOf('<footer'));
  assert.match(footer, /href="\/nouveautes"[^>]*>\s*Nouveautés/);
});

// ── Navigateur ──────────────────────────────────────────────────────────────

// Contraste WCAG du texte des cartes sur leur fond, composé au pire cas (fond blanc
// sous un éventuel fond translucide). Couleurs oklch converties en sRGB par un canvas.
const cardContrasts = (page) => page.evaluate(() => {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (s) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const over = ([r, g, b, a], [R, G, B]) => [r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)];
  const out = [];
  for (const card of document.querySelectorAll('.news-entry')) {
    const bg = over(rgba(getComputedStyle(card).backgroundColor), [255, 255, 255]);
    for (const el of card.querySelectorAll('h2, time, p, li, strong, a')) {
      const fg = over(rgba(getComputedStyle(el).color), bg);
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      out.push({ sel: `${card.id} ${el.tagName}`, ratio: (a + 0.05) / (b + 0.05) });
    }
  }
  return out;
});

test('reflow 320/390/1440 px : aucun défilement horizontal, captures dans la largeur, contraste ≥ 4,5:1', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const shots = process.env.CCC_E2E_SHOTS;
  if (shots) mkdirSync(shots, { recursive: true });
  for (const width of [320, 390, 1440]) {
    const context = await env.browser.newContext({ viewport: { width, height: width > 1000 ? 900 : 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${env.base}/nouveautes/`, { waitUntil: 'load' });
    assert.equal(await page.locator('.news-entry').count(), DATA.entries.length, `${width}px : entrées absentes`);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow <= 0, `${width}px : débordement horizontal de ${overflow}px`);
    const wide = await page.evaluate(() => [...document.querySelectorAll('.news-entry img')]
      .filter((i) => i.getBoundingClientRect().right > innerWidth + 0.5).length);
    assert.equal(wide, 0, `${width}px : capture plus large que l'écran`);
    await page.evaluate(() => document.querySelectorAll('.news-entry img').forEach((i) => { i.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.querySelectorAll('.news-entry img')].every((i) => i.complete));
    const broken = await page.evaluate(() => [...document.querySelectorAll('.news-entry img')].filter((i) => !i.naturalWidth).map((i) => i.src));
    assert.deepEqual(broken, [], `${width}px : captures non chargées`);
    for (const { sel, ratio } of await cardContrasts(page)) assert.ok(ratio >= 4.5, `${width}px ${sel} : ${ratio.toFixed(2)}:1`);
    if (shots) await page.screenshot({ path: join(shots, `nouveautes-${width}.png`), fullPage: true });
    await context.close();
  }
});

// L'en-tête (sur-titre, titre, chapeau) est posé sur l'image de fond du site : mesuré
// au PIRE PIXEL sous les glyphes, pas sur la couleur de fond déclarée.
test('en-tête de la page ≥ 4,5:1 au pire pixel de l’image de fond (1440 et 390 px)', { timeout: 90_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const failures = [];
  for (const width of [1440, 390]) {
    const context = await env.browser.newContext({ viewport: { width, height: width > 1000 ? 900 : 844 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(`${env.base}/nouveautes/`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    for (const sel of ['.news-hero .news-eyebrow', '.news-hero h1', '.news-hero .news-lede']) {
      const { worst, glyphs } = await worstPixelContrast(page, sel);
      t.diagnostic(`${sel} @${width}px : ${worst.toFixed(2)}:1 (${glyphs} px)`);
      assert.ok(glyphs > 20, `${sel} @${width}px : glyphes non détectés`);
      if (worst < 4.5) failures.push(`${sel} @${width}px : ${worst.toFixed(2)}:1`);
    }
    await context.close();
  }
  assert.deepEqual(failures, []);
});

// La barre du bureau comptait déjà 9 entrées et débordait de l'écran entre 768 et
// 830 px (mesure du 01-10) : avec « Nouveautés », elle doit tenir à toutes les largeurs,
// sinon c'est le menu du téléphone qui s'affiche.
test('barre de navigation : jamais coupée ni sur deux lignes, de 768 à 1440 px', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 768, height: 800 } });
  const page = await context.newPage();
  for (const width of [768, 900, 1024, 1100, 1180, 1280, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${env.base}/about/`, { waitUntil: 'load' });
    const r = await page.evaluate(() => {
      const list = document.querySelector('header nav ul');
      const burger = document.querySelector('header nav button[aria-controls="mobile-menu"]');
      const shown = (el) => !!el && getComputedStyle(el).display !== 'none';
      const links = list ? [...list.querySelectorAll(':scope > li > a, :scope > li > button')] : [];
      return {
        list: shown(list),
        burger: shown(burger),
        right: list ? list.getBoundingClientRect().right : 0,
        maxH: Math.max(0, ...links.map((a) => a.getBoundingClientRect().height)),
        hasNews: links.some((a) => a.getAttribute('href') === '/nouveautes'),
      };
    });
    assert.ok(r.list !== r.burger, `${width}px : barre et menu téléphone ${r.list ? 'tous deux affichés' : 'tous deux masqués'}`);
    if (r.list) {
      assert.ok(r.right <= width, `${width}px : barre coupée (bord droit ${r.right.toFixed(0)} px)`);
      assert.ok(r.maxH <= 40, `${width}px : un lien passe sur deux lignes (${r.maxH} px de haut)`);
      assert.ok(r.hasNews, `${width}px : « Nouveautés » absent de la barre`);
    }
  }
  await context.close();
});

test('téléphone 390 px : le menu propose « Nouveautés » et y mène', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${env.base}/about/`, { waitUntil: 'load' });
  await page.click('button[aria-controls="mobile-menu"]');
  const link = page.locator('#mobile-menu a[href="/nouveautes"]');
  await link.scrollIntoViewIfNeeded();
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith('/nouveautes')), link.click()]);
  assert.equal(await page.locator('.news-entry').count(), DATA.entries.length);
  await context.close();
});

test('bureau 1440 px, au clavier : Tab atteint « Nouveautés » dans la barre, Entrée y mène', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${env.base}/about/`, { waitUntil: 'load' });
  let reached = false;
  for (let i = 0; i < 30 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => document.activeElement?.getAttribute('href') === '/nouveautes');
  }
  assert.ok(reached, 'lien Nouveautés hors de l’ordre de tabulation');
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith('/nouveautes')), page.keyboard.press('Enter')]);
  await page.locator('.news-entry').first().waitFor();
  await context.close();
});

// ── Visionneuse ─────────────────────────────────────────────────────────────
const viewerOpen = (page) => page.evaluate(() => !!document.querySelector('dialog.news-viewer')?.open);

test('visionneuse : Entrée sur une capture l’ouvre (pas le PNG brut), Échap la ferme et rend le focus', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${env.base}/nouveautes/`, { waitUntil: 'load' });
  const first = page.locator('.news-capture').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  assert.ok(new URL(page.url()).pathname.startsWith('/nouveautes'), 'Entrée a ouvert le PNG brut');
  assert.ok(await viewerOpen(page), 'visionneuse fermée après Entrée');
  const shown = await page.evaluate(() => {
    const img = document.querySelector('dialog.news-viewer img');
    const r = img.getBoundingClientRect();
    return { src: img.getAttribute('src'), alt: img.alt, w: r.width, h: r.height, bottom: r.bottom, right: r.right };
  });
  assert.equal(shown.src, `/nouveautes-data/${DATA.entries[0].captures[0]}`);
  assert.ok(shown.alt.length > 0, 'texte alternatif absent');
  // Au bureau, la capture entière tient à l'écran.
  assert.ok(shown.bottom <= 900 && shown.right <= 1440, `capture hors écran (${shown.right}×${shown.bottom})`);
  assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden', 'la page derrière défile encore');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('dialog.news-viewer').open);
  assert.ok(await first.evaluate((el) => el === document.activeElement), 'focus non rendu à la capture');
  assert.equal(await page.evaluate(() => document.body.style.overflow), '');

  // Clic souris : visionneuse aussi ; bouton « Fermer » la referme.
  await page.locator('.news-capture img').first().click();
  assert.ok(await viewerOpen(page), 'visionneuse fermée après clic');
  await page.locator('dialog.news-viewer button', { hasText: 'Fermer' }).click();
  assert.ok(!(await viewerOpen(page)), 'Fermer ne ferme pas');
  await context.close();
});

// Leçon d'ol-companion L13 : au téléphone, une capture de bureau réduite à la largeur de
// l'écran est illisible. Sous 640 px, elle s'affiche à sa largeur naturelle (au plus deux
// largeurs d'écran) dans une zone focalisable qui défile ; « Fermer » reste hors zone.
test('visionneuse au téléphone (390 px) : capture large à sa largeur naturelle dans une zone qui défile', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${env.base}/nouveautes/`, { waitUntil: 'load' });
  const target = DATA.entries.flatMap((e) => e.captures).find((c) => {
    const buf = readFileSync(new URL(`../public/nouveautes-data/${c}`, import.meta.url));
    return buf.readUInt32BE(16) > 390;
  });
  assert.ok(target, 'aucune capture plus large que 390 px à tester');
  const natural = readFileSync(new URL(`../public/nouveautes-data/${target}`, import.meta.url)).readUInt32BE(16);
  const link = page.locator(`.news-capture[href="/nouveautes-data/${target}"]`);
  await link.scrollIntoViewIfNeeded();
  await link.click();
  assert.ok(await viewerOpen(page));
  await page.waitForFunction(() => document.querySelector('dialog.news-viewer img').complete);
  const r = await page.evaluate(() => {
    const d = document.querySelector('dialog.news-viewer');
    const zone = d.querySelector('.news-viewer-zone');
    const close = [...d.querySelectorAll('button')].find((b) => b.textContent.includes('Fermer'));
    const c = close.getBoundingClientRect();
    return {
      imgW: d.querySelector('img').getBoundingClientRect().width,
      scrollW: zone.scrollWidth, clientW: zone.clientWidth,
      tabindex: zone.getAttribute('tabindex'), label: zone.getAttribute('aria-label'), role: zone.getAttribute('role'),
      closeInZone: zone.contains(close),
      closeVisible: c.top >= 0 && c.bottom <= innerHeight && c.left >= 0 && c.right <= innerWidth,
      pageOverflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  assert.ok(Math.abs(r.imgW - Math.min(natural, 780)) <= 1, `largeur ${r.imgW} au lieu de ${Math.min(natural, 780)}`);
  assert.ok(r.scrollW > r.clientW, 'la zone ne défile pas');
  assert.equal(r.tabindex, '0');
  assert.equal(r.role, 'region');
  assert.match(r.label, /faire défiler/);
  assert.ok(!r.closeInZone, '« Fermer » défile avec la capture');
  assert.ok(r.closeVisible, '« Fermer » hors de l’écran');
  assert.ok(r.pageOverflow <= 0, 'la page elle-même déborde');
  await page.keyboard.press('Escape');
  await context.close();
});

// Le site navigue par transitions Astro (ClientRouter) : le script de la visionneuse
// doit fonctionner aussi quand on arrive sur la page par un lien interne.
test('visionneuse après une navigation interne (transition Astro) depuis /about', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${env.base}/about/`, { waitUntil: 'load' });
  await Promise.all([page.waitForURL((u) => u.pathname.startsWith('/nouveautes')), page.locator('header a[href="/nouveautes"]').click()]);
  await page.locator('.news-capture img').first().click();
  assert.ok(await viewerOpen(page), 'visionneuse fermée après navigation interne');
  await context.close();
});

// Avant leur chargement, les captures occupent déjà leur place (pas de saut de mise en page).
test('320 px, captures pas encore chargées : la place est réservée aux bonnes proportions', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const context = await env.browser.newContext({ viewport: { width: 320, height: 700 } });
  const page = await context.newPage();
  await page.route('**/nouveautes-data/captures/**', (route) => route.abort());
  await page.goto(`${env.base}/nouveautes/`, { waitUntil: 'domcontentloaded' });
  const boxes = await page.evaluate(() => [...document.querySelectorAll('.news-capture img')].map((i) => {
    const r = i.getBoundingClientRect();
    return { src: i.getAttribute('src'), w: r.width, h: r.height, ratio: +i.getAttribute('width') / +i.getAttribute('height') };
  }));
  assert.ok(boxes.length > 0);
  for (const b of boxes) {
    assert.ok(b.w > 50, `${b.src} : largeur ${b.w}px`);
    assert.ok(Math.abs(b.w / b.h - b.ratio) < 0.05 * b.ratio, `${b.src} : ${b.w}×${b.h} au lieu du ratio ${b.ratio.toFixed(2)}`);
  }
  await context.close();
});

// ── Lien permanent par entrée (repris d'AetherWX) ───────────────────────────
test('chaque titre est un lien vers sa propre ancre (#slug)', () => {
  const page = html();
  for (const e of DATA.entries) {
    assert.match(page, new RegExp(`<h2[^>]*id="${e.slug}-titre"[^>]*>\\s*<a [^>]*href="#${e.slug}"`), e.slug);
  }
});

test('ouvrir /nouveautes/#<slug> au téléphone amène l’entrée sous la barre fixe et la signale', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const slug = DATA.entries.at(-1).slug;
  const context = await env.browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${env.base}/nouveautes/#${slug}`, { waitUntil: 'load' });
  await page.waitForTimeout(300);
  const r = await page.evaluate((s) => {
    const el = document.getElementById(s);
    const header = document.querySelector('header').getBoundingClientRect();
    return { top: el.getBoundingClientRect().top, headerBottom: header.bottom, target: el.classList.contains('is-target'), focused: document.activeElement === el };
  }, slug);
  assert.ok(r.top >= r.headerBottom && r.top <= r.headerBottom + 60, `entrée à ${r.top}px (barre jusqu'à ${r.headerBottom}px)`);
  assert.ok(r.target, 'entrée visée non signalée');
  assert.ok(r.focused, 'focus pas sur l’entrée visée');
  await context.close();
});

test('cliquer le titre met l’ancre dans l’URL, copie le lien et l’annonce', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const e = DATA.entries[0];
  const context = await env.browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: env.base });
  const page = await context.newPage();
  await page.goto(`${env.base}/nouveautes/`, { waitUntil: 'load' });
  await page.locator(`[id="${e.slug}-titre"] a`).click();
  await page.waitForFunction((s) => location.hash === `#${s}`, e.slug);
  const status = page.locator(`[id="${e.slug}"] [role="status"]`);
  await status.filter({ hasText: 'Lien copié' }).waitFor({ timeout: 3000 });
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), `${env.base}/nouveautes/#${e.slug}`);
  await context.close();
});
