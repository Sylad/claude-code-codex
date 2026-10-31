// L63 — corrections de vérité de L37 (revue du 31-10) sur les études ol-companion, warhammer40k, finance-tracker.
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

const brut = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const texte = (p) => brut(p).replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');
const PAGES = ['ol-companion', 'warhammer40k', 'finance-tracker'];
const chemin = (p) => `case-studies/${p}`;

test('R1 — aucune barre oblique inverse affichée sur les trois études, et « d\'après » est écrit sans', () => {
  for (const p of PAGES) {
    const t = texte(chemin(p));
    assert.doesNotMatch(t, /\\/, `${p} : antislash affiché`);
    assert.match(t, /d'après/, p);
  }
});

test('R2 — warhammer40k : plus de puce « Live — SSE », le contenu est lu dans seed/ et non data/', () => {
  const t = texte(chemin('warhammer40k'));
  assert.doesNotMatch(t, /Live\s*[—-]\s*SSE|api\/events|\bSSE\b/);
  assert.match(t, /seed\/factions\.json/);
  assert.doesNotMatch(t, /data\/factions\.json|JSON files\s*data\//);
  assert.match(t, /seed\//);
});

test('R3 — ol-companion : le pod du frontend écoute sur 80, plus de 4202, plus de réseau Docker', () => {
  const h = brut(chemin('ol-companion'));
  const t = texte(chemin('ol-companion'));
  assert.doesNotMatch(h, /4202/);
  assert.match(t, /port 80/);
  assert.match(t, /80 \/ 3002 dans les pods/);
  assert.doesNotMatch(t, /réseau Docker/);
});

test('R4 — ol-companion : les animations du direct sont décrites (carton rouge, remplacement, but annulé, poteau sans animation)', () => {
  const t = texte(chemin('ol-companion'));
  assert.match(t, /animations du direct/);
  assert.match(t, /carton rouge[^.]*animation rouge/);
  assert.match(t, /remplacement la sienne/);
  assert.match(t, /but annulé \(VAR\) une animation dédiée/);
  assert.match(t, /poteau n'en a pas/);
});

test('R5 — finance-tracker : 24 modules, « Connu, masquer », plus de réseau Docker', () => {
  const t = texte(chemin('finance-tracker'));
  assert.match(t, /24 modules/);
  assert.doesNotMatch(t, /~\s?20 modules/);
  assert.match(t, /Connu, masquer/);
  assert.doesNotMatch(t, /Connu-masquer/);
  assert.doesNotMatch(t, /réseau Docker/);
});

test('R6 — finance-tracker : les six captures (dont Crédits actions et Abonnements, ajoutées) ont un alt et un fichier servi', () => {
  const h = brut(chemin('finance-tracker'));
  const imgs = [...h.matchAll(/<img[^>]+src="(\/case-studies\/finance-tracker\/[^"]+\.png)"[^>]*>/g)];
  const noms = imgs.map((m) => m[1].split('/').pop()).sort();
  assert.deepEqual(noms, ['01-dashboard.png', '02-health.png', '03-expenses.png', '04-loans.png', '05-credits-actions.png', '06-abonnements.png']);
  const servis = new Set(readdirSync(join(DIST, 'case-studies', 'finance-tracker')));
  for (const m of imgs) {
    assert.match(m[0], /alt="[^"]{10,}"/, m[1]);
    assert.ok(servis.has(m[1].split('/').pop()), `${m[1]} absent de dist`);
    assert.ok(readFileSync(join(DIST, m[1])).length > 1000, `${m[1]} vide`);
  }
});

test('R7 — une seule forme de date par page : aucune date ISO aaaa-mm-jj affichée', () => {
  for (const p of PAGES) {
    const t = texte(chemin(p));
    assert.doesNotMatch(t, /\b20\d\d-\d\d-\d\d\b/, `${p} : date ISO affichée`);
    assert.match(t, /Mise à jour 31 octobre 2026/, p);
  }
});
