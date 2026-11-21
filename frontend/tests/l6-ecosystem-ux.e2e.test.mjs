// L6 — revue UX de /ecosystem (WCAG 2.2 AA, Nielsen), mesurée sur le site CONSTRUIT
// (`npx astro build` avant ; « skip » sans playwright-core/Chromium). Constats de la revue
// (2026-11-21) : filtres sans aria-pressed (B1), « copier » à 2,88:1 (B2), compteur et copie
// jamais annoncés (B3), 15 « commandes » qui sont des phrases (M1), commandes tronquées
// illisibles avant la copie (M2), focus de la recherche à 2,6:1 et sans libellé (M3, M5),
// case « Anthropic-officiel » qui vide la section community et deux recherches de même nom (M4),
// défilement latéral à 390 px police 200 % (M6). Un test par sous-tâche (L6/t1 à t8).
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser, worstPixelContrast } from './lib/e2e-dist.mjs';

// Couleur CSS composée sur un fond opaque → luminance relative (dans la page).
const LUM = `(c, sous = '#000') => { const x = document.createElement('canvas').getContext('2d');
  x.fillStyle = sous; x.fillRect(0, 0, 1, 1); x.fillStyle = c; x.fillRect(0, 0, 1, 1);
  const d = x.getImageData(0, 0, 1, 1).data; const l = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * l(d[0]) + 0.7152 * l(d[1]) + 0.0722 * l(d[2]); }`;

// Boutons de copie d'une commande : les seuls boutons des cartes (r2 : l'invite « $ » ne précède
// plus que les commandes du terminal, elle ne peut donc plus servir à les repérer).
const INSTALL = 'main li button';
const CATEGORY_BUTTONS = 'main button:has(> span.font-mono)';

async function open(env, { width = 1440, height = 900, fontSize } = {}) {
  const context = await env.browser.newContext({ viewport: { width, height } });
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  if (fontSize) {
    await page.addInitScript((z) => {
      document.addEventListener('DOMContentLoaded', () => { document.documentElement.style.fontSize = z; });
    }, fontSize);
  }
  await page.goto(`${env.base}/ecosystem/`, { waitUntil: 'networkidle' });
  // Attendre l'hydratation des deux catalogues (client:load).
  await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every((i) => !i.hasAttribute('ssr')));
  return { context, page };
}

test('L6/t1 — les filtres de catégorie exposent leur état (aria-pressed)', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env);
  const buttons = page.locator(CATEGORY_BUTTONS);
  const n = await buttons.count();
  assert.ok(n >= 4, `${n} filtres de catégorie`);
  const avant = await buttons.evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-pressed')));
  assert.ok(avant.every((v) => v === 'false'), `avant : ${avant}`);
  await buttons.first().click();
  assert.equal(await buttons.first().getAttribute('aria-pressed'), 'true');
  assert.equal(await buttons.nth(1).getAttribute('aria-pressed'), 'false');
  assert.equal(await buttons.first().getAttribute('type'), 'button');
  await buttons.first().click();
  assert.equal(await buttons.first().getAttribute('aria-pressed'), 'false');
  await context.close();
});

test('L6/t2 — le libellé « copier » atteint 4,5:1 au pire pixel', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env);
  const { worst, glyphs } = await worstPixelContrast(page, `${INSTALL} > span:last-child`);
  assert.ok(glyphs > 0, 'aucun glyphe mesuré');
  assert.ok(worst >= 4.5, `« copier » ${worst.toFixed(2)}:1 < 4,5`);
  await context.close();
});

test('L6/t3 — compteur et copie annoncés par une région role=status', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env);
  const compteur = page.locator('main [role="status"]', { hasText: /\d+ \/ \d+ entrées/ }).first();
  assert.ok(await compteur.count(), 'compteur « n / N entrées » hors de toute région role=status');
  await page.locator(CATEGORY_BUTTONS).first().click();
  assert.match(await compteur.textContent(), /\d+ \/ 41 entrées/);
  await page.locator(INSTALL).first().click();
  const annonce = page.locator('main [role="status"], main [aria-live="polite"]', { hasText: /copiée/ });
  await annonce.first().waitFor({ state: 'attached', timeout: 3000 }).catch(() => {});
  assert.ok(await annonce.count(), 'copie non annoncée');
  await context.close();
});

test('L6/t4 — chaque « $ » porte une vraie commande ; une consigne n’a ni « $ » ni bouton copier', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env);
  const commandes = await page.locator(`${INSTALL} span.whitespace-pre-wrap`).allTextContents();
  assert.ok(commandes.length >= 25, `${commandes.length} commandes`);
  // Premier mot d'une commande exécutable : un programme du terminal, une commande de Claude Code
  // (« /plugin ») ou une ligne de workflow GitHub (« uses: »).
  const PROGRAMMES = new Set(['npm', 'pip', 'go', 'git', 'claude', 'npx', '/plugin', 'uses:']);
  const fausses = commandes.map((c) => c.trim()).filter((c) => {
    const premier = c.split(/\s+/)[0];
    return !PROGRAMMES.has(premier) || /\b(dans|ton|Voir|Disponible|ou|browse|et copie)\b/.test(c) || /\(/.test(c);
  });
  assert.deepEqual(fausses, [], 'phrases présentées comme des commandes');
  // L'invite « $ » ne précède qu'une commande du terminal (r2, m1).
  const invites = await page.locator(INSTALL).evaluateAll((bs) => bs.map((b) => ({
    cmd: b.querySelector('span.whitespace-pre-wrap').textContent.trim(),
    dollar: [...b.querySelectorAll('span')].some((s) => s.textContent.trim() === '$'),
  })));
  const mal = invites.filter((i) => i.dollar === (i.cmd.startsWith('/') || i.cmd.startsWith('uses:'))).map((i) => i.cmd);
  assert.deepEqual(mal, [], '« $ » absent devant une commande du terminal, ou présent devant /plugin ou uses:');
  // Le protocole MCP n'a pas de commande d'installation : sa consigne est affichée, sans bouton.
  const carte = page.locator('main li', { has: page.locator('h3', { hasText: /^Model Context Protocol$/ }) });
  assert.equal(await carte.locator('button').count(), 0, 'consigne du protocole MCP dans un bouton copier');
  assert.match(await carte.textContent(), /modelcontextprotocol\.io/);
  await context.close();
});

test('L6/t5 — chaque commande se lit en entier avant la copie, à 1440 et 390 px', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [1440, 390]) {
    const { context, page } = await open(env, { width, height: 900 });
    const coupees = await page.locator(`${INSTALL} span.whitespace-pre-wrap`).evaluateAll((spans) => spans
      .filter((s) => s.scrollWidth > s.clientWidth + 1 || getComputedStyle(s).textOverflow === 'ellipsis')
      .map((s) => s.textContent.trim()));
    assert.deepEqual(coupees, [], `${width} px : ${coupees.length} commandes tronquées`);
    await context.close();
  }
});

test('L6/t6 — la recherche a un nom et un focus visible à 3:1 au moins', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env);
  const recherche = page.locator('main input[type="search"]').first();
  const nom = await recherche.evaluate((i) => i.getAttribute('aria-label') || (i.labels?.[0]?.textContent ?? '').trim());
  assert.ok(nom, 'recherche sans libellé ni aria-label');
  await page.keyboard.press('Tab');
  await recherche.focus();
  const focus = await recherche.evaluate(`(async (e) => { const lum = ${LUM};
    await Promise.all(e.getAnimations().map((a) => a.finished.catch(() => {})));
    const cs = getComputedStyle(e);
    const fond = getComputedStyle(document.body).backgroundColor;
    const L = lum(cs.outlineColor, fond), B = lum(fond);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth),
      ratio: (Math.max(L, B) + 0.05) / (Math.min(L, B) + 0.05) }; })(document.querySelector('main input[type=search]'))`);
  assert.notEqual(focus.style, 'none', 'aucun contour au focus');
  assert.ok(focus.width >= 2, `contour ${focus.width} px`);
  assert.ok(focus.ratio >= 3, `contour à ${focus.ratio.toFixed(2)}:1 < 3`);
  await context.close();
});

test('L6/t7 — aucune case qui vide une section ; les recherches portent un nom propre à leur section', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env);
  assert.equal(await page.locator('main input[type="checkbox"]').count(), 0, 'case « Anthropic-officiel uniquement » encore présente');
  const noms = await page.locator('main input[type="search"]').evaluateAll((is) => is.map((i) => i.getAttribute('aria-label') || ''));
  assert.ok(noms.length >= 1 && noms.every(Boolean), `recherches sans nom : ${JSON.stringify(noms)}`);
  assert.equal(new Set(noms).size, noms.length, `noms en double : ${JSON.stringify(noms)}`);
  // La section community montre son entrée, sans barre de filtres pour une poignée d'entrées.
  const community = page.locator('main section').last();
  assert.ok(await community.locator('h3', { hasText: 'fable-mode' }).isVisible(), 'fable-mode invisible');
  assert.equal(await community.locator(CATEGORY_BUTTONS).count(), 0, 'barre de filtres pour moins de 6 entrées');
  await context.close();
});

test('L6/t8 — aucun défilement latéral à 390 px, police du navigateur à 200 %', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env, { width: 390, height: 844, fontSize: '200%' });
  const { sw, cw, fs } = await page.evaluate(() => ({
    sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth,
    fs: getComputedStyle(document.documentElement).fontSize,
  }));
  assert.equal(fs, '32px');
  assert.ok(sw <= cw, `scrollWidth ${sw} > ${cw}`);
  await context.close();
});

// Revue r2 (2026-11-21). t9 : la consigne de fable-mode était fausse (pas de dossier fable-mode,
// fable-haiku retirée) ; la commande du README du dépôt mrtooher/fable-mode, relue le 21-11, est
// celle-ci. t10 : police à 200 %, « $ » et « copier » ne rétrécissaient pas et laissaient 23 px à
// la commande (un caractère par ligne) à 390 et 768 px.
const FABLE_INSTALL = 'git clone https://github.com/mrtooher/fable-mode.git && cd fable-mode && ./install.sh';
const COMMANDE = `${INSTALL} span.whitespace-pre-wrap`;

test('L6/t9 — fable-mode : la commande du README du dépôt, copiable, sans skill retirée', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  const { context, page } = await open(env);
  const carte = page.locator('main li', { has: page.locator('h3', { hasText: /^fable-mode$/ }) });
  const bouton = carte.locator('button');
  assert.equal(await bouton.count(), 1, 'fable-mode sans bouton copier');
  assert.equal((await bouton.locator('span.whitespace-pre-wrap').textContent()).trim(), FABLE_INSTALL);
  await bouton.click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), FABLE_INSTALL);
  const texte = await carte.textContent();
  assert.doesNotMatch(texte, /fable-haiku|cp -r/, 'skill retirée ou ancienne installation encore citée');
  for (const skill of ['fable-opus', 'fable-sonnet', 'double-check', 'execution-guardrails']) {
    assert.match(texte, new RegExp(skill), `${skill} (jeu v6) absente de la description`);
  }
  await context.close();
});

test('L6/t10 — police à 200 % : la commande garde la largeur du bloc, « copier » passe dessous', { timeout: 180_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [390, 768]) {
    const { context, page } = await open(env, { width, height: 900, fontSize: '200%' });
    const mesures = await page.locator(COMMANDE).evaluateAll((spans) => spans.map((s) => {
      const b = s.closest('button');
      const cs = getComputedStyle(b);
      const interieur = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      return { cmd: s.textContent.trim(), part: s.getBoundingClientRect().width / interieur };
    }));
    assert.ok(mesures.length >= 25, `${width} px : ${mesures.length} commandes`);
    const etroites = mesures.filter((m) => m.part < 0.7).map((m) => `${m.cmd.slice(0, 30)}… ${(m.part * 100).toFixed(0)} %`);
    assert.deepEqual(etroites, [], `${width} px + 200 % : commande à moins de 70 % du bloc`);
    // « copier » reste dans le bouton, visible, sans chevaucher la commande.
    const chevauche = await page.locator('main li button').evaluateAll((bs) => bs.filter((b) => {
      const c = b.querySelector('span.whitespace-pre-wrap').getBoundingClientRect();
      const l = [...b.querySelectorAll('span')].at(-1).getBoundingClientRect();
      const r = b.getBoundingClientRect();
      const dedans = l.left >= r.left && l.right <= r.right + 0.5 && l.bottom <= r.bottom + 0.5;
      const croise = !(l.top >= c.bottom - 0.5 || l.bottom <= c.top + 0.5 || l.left >= c.right - 0.5 || l.right <= c.left + 0.5);
      return !dedans || croise || l.width === 0;
    }).length);
    assert.equal(chevauche, 0, `${width} px + 200 % : « copier » hors du bouton ou sur la commande`);
    await context.close();
  }
  // Police normale, 1440 px : « copier » reste sur la ligne de la commande (pas de bloc qui s'allonge).
  const { context, page } = await open(env);
  const decales = await page.locator('main li button').evaluateAll((bs) => bs.filter((b) => {
    const c = b.querySelector('span.whitespace-pre-wrap').getBoundingClientRect();
    const l = [...b.querySelectorAll('span')].at(-1).getBoundingClientRect();
    return Math.abs(l.top - c.top) > 2;
  }).length);
  assert.equal(decales, 0, '1440 px : « copier » sorti de la ligne de la commande');
  await context.close();
});
