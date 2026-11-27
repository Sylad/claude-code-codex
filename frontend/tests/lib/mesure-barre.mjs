// L17, L111 — mesure de la barre de navigation dans un vrai navigateur, partagée par tests/navbar.e2e.test.mjs
// (page française) et tests/l111-barre-anglaise.e2e.test.mjs (page anglaise) : mêmes configurations, mêmes
// largeurs, mêmes écarts ; seuls les libellés attendus changent (src/lib/libelles-site.mjs).
import { readFileSync } from 'node:fs';
import { badgeLabel } from '../../src/lib/news-badge.ts';
import { libelles } from '../../src/lib/libelles-site.mjs';

export const SEEN_KEY = 'ccc.news.seen-v1';
export const OLD_VISIT = { date: '2026-01-01', slugs: [], at: '2026-01-01T10:00:00.000Z' };
export const BAR_EM = 64;

export const CONFIGS = [
  { name: 'polices web', fontSize: 16, webFonts: true },
  { name: 'polices web bloquées', fontSize: 16, webFonts: false },
  { name: 'police par défaut 18 px', fontSize: 18, webFonts: true },
  { name: 'police par défaut 20 px', fontSize: 20, webFonts: true },
  { name: 'polices bloquées + police 18 px', fontSize: 18, webFonts: false },
  { name: 'polices bloquées + police 20 px', fontSize: 20, webFonts: false },
];

/** Hôtes des polices web joignables ? Hors ligne, les configurations « polices web » se
 *  replient sur les polices de repli (et le disent) au lieu de faire échouer la suite. */
export async function fontHostsReachable(browser) {
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
export const widths = (fs) => [...new Set([...COMMON, BAR_EM * fs - 1, BAR_EM * fs, BAR_EM * fs + 1])].sort((a, b) => a - b);

export async function openPage(env, { width, height = 800, fontSize = 16, webFonts = true, badge = true, path = '/about/' }) {
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
export const measureBar = (page) => page.evaluate(() => {
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

const NB_NOUVEAUTES = JSON.parse(readFileSync(new URL('../../public/nouveautes-data/nouveautes.json', import.meta.url), 'utf8')).entries.length;

/** Libellés que la barre du bureau doit montrer (Nouveautés, Ressources) et ne pas montrer, dans une langue. */
function libellesAttendus(langue) {
  const L = libelles(langue);
  const ressources = L.barre.find((l) => l.id === 'ressources');
  return {
    presents: [L.barre.find((l) => l.href === '/nouveautes').label, ressources.label],
    absents: [...ressources.children.map((c) => c.label), L.telephone.find((c) => c.href === '/about').label],
  };
}

/** Écarts de mise en page de la barre mesurée `m` à la largeur `width` pour la configuration `cfg`. */
function ecartsMiseEnPage(m, { width, cfg, online, fonts }) {
  const bad = [];
  const expected = width / cfg.fontSize >= BAR_EM ? 'barre' : 'menu';
  if (fonts !== (cfg.webFonts && online)) bad.push(`Inter ${fonts ? 'chargée' : 'absente'}`);
  if (m.mode !== expected) bad.push(`mode ${m.mode} au lieu de ${expected}`);
  if (m.page > 0) bad.push(`page déborde de ${m.page}px`);
  if (m.navOverflow > 0) bad.push(`barre déborde de ${m.navOverflow}px`);
  if (m.slack < 16) bad.push(`${m.slack}px après le logo`);
  if (m.lastRight > width) bad.push(`dernier contrôle coupé (${m.lastRight})`);
  if (m.multi.length) bad.push(`sur deux lignes : ${m.multi.join(', ')}`);
  if (m.badge !== badgeLabel(NB_NOUVEAUTES)) bad.push(`pastille « ${m.badge} »`);
  return bad;
}

/** Écarts de libellés de la barre du bureau (rien à vérifier en mode menu). */
function ecartsLibelles(m, langue) {
  if (m.mode !== 'barre') return [];
  const { presents, absents } = libellesAttendus(langue);
  return [
    ...presents.filter((l) => !m.labels.includes(l)).map((l) => `${l} absent`),
    ...absents.filter((l) => m.labels.includes(l)).map((l) => `${l} dans la barre`),
  ];
}

/** Écarts de la barre mesurée `m` à la largeur `width` pour la configuration `cfg`. */
export function ecartsBarre(m, { width, cfg, online, fonts, langue = 'fr' }) {
  return [...ecartsMiseEnPage(m, { width, cfg, online, fonts }), ...ecartsLibelles(m, langue)];
}

const nomConfig = (cfg, online) => (cfg.webFonts && !online ? `${cfg.name} (hors ligne : repli)` : cfg.name);

/**
 * Mesure la barre de la page `path` dans les six configurations, à chaque largeur et seuil ±1 px.
 * @returns {Promise<{ rows: object[], failures: string[], online: boolean }>}
 */
export async function mesurerBarre(env, { path = '/about/', langue = 'fr' } = {}) {
  const rows = [];
  const failures = [];
  const online = await fontHostsReachable(env.browser);
  for (const cfg of CONFIGS) {
    for (const width of widths(cfg.fontSize)) {
      const { context, page } = await openPage(env, { width, fontSize: cfg.fontSize, webFonts: cfg.webFonts, path });
      const fonts = await page.evaluate(() => [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Inter' && f.status === 'loaded'));
      const m = await measureBar(page);
      await context.close();
      rows.push({ cfg: nomConfig(cfg, online), width, ...m, fonts });
      const bad = ecartsBarre(m, { width, cfg, online, fonts, langue });
      if (bad.length) failures.push(`${cfg.name} ${width}px : ${bad.join(' ; ')}`);
    }
  }
  return { rows, failures, online };
}

/** Tableau des mesures (diagnostic du test, ou fichier CCC_NAV_TABLE). */
export const tableBarre = (rows) => ['| configuration | largeur | mode | écart logo→1er (px) | bord droit du dernier | débordement page/barre |', '|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.cfg} | ${r.width} | ${r.mode} | ${r.slack} | ${r.lastRight} (${r.lastLabel}) | ${r.page}/${r.navOverflow} |`)].join('\n');
