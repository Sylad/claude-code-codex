// L37 — études de cas des apps loisir à jour d'après leur état réel (ol-companion, warhammer40k, finance-tracker).
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

const texte = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8')
  .replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');
const html = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const PAGES = ['ol-companion', 'warhammer40k', 'finance-tracker'];

test('R1 — chaque étude est datée du 31 octobre 2026 en tête et porte le dépôt qu\'elle décrit', () => {
  for (const p of PAGES) {
    const t = texte(`case-studies/${p}`);
    assert.match(t, /Mise à jour 31 octobre 2026/, p);
    assert.match(t, new RegExp(`github\\.com/Sylad/${p}`), p);
  }
});

test('R2 — plus de NAS Synology ni d\'adresse LAN : les trois apps tournent sur le k3s de dark-blue, via ArgoCD', () => {
  for (const p of PAGES) {
    const t = texte(`case-studies/${p}`);
    assert.doesNotMatch(t, /Synology|http:\/\/nas:|docker-compose sur NAS/, p);
    assert.match(t, /k3s/, p);
    assert.match(t, /ArgoCD/, p);
  }
});

test('R3 — ol-companion : carte L1, Équipe de France, 8 crons, URL publique', () => {
  const t = texte('case-studies/ol-companion');
  assert.match(t, /https:\/\/ol\.sladoire\.dev/);
  assert.match(t, /Équipe de France/);
  assert.match(t, /18 clubs/);
  assert.match(t, /8 services planifiés/);
  assert.doesNotMatch(t, /6 crons/);
  assert.doesNotMatch(t, /Snapshot 2026-05-08/);
});

test('R4 — warhammer40k : les 15 modules réels, Concepts & Lieux, galaxie, URL publique', () => {
  const t = texte('case-studies/warhammer40k');
  assert.match(t, /https:\/\/warhammer\.sladoire\.dev/);
  assert.match(t, /Concepts & Lieux/);
  assert.match(t, /visionneuse/);
  assert.match(t, /timeline/);
  assert.doesNotMatch(t, /claude-usage/);
  assert.match(t, /134 lignes au 8 mai 2026/); // fixé par L57 R5
});

test('R5 — finance-tracker : Crédits, Abonnements, démo seule sur le cluster, données réelles en local', () => {
  const t = texte('case-studies/finance-tracker');
  assert.match(t, /https:\/\/finance\.sladoire\.dev/);
  assert.match(t, /Abonnements/);
  assert.match(t, /données de démo/);
  assert.match(t, /claude-sonnet-5-5/); // fixé par L57 R2
  assert.doesNotMatch(t, /URL éphémère|URL de tunnel régénérée/);
});

test('R6 — chaque capture ajoutée a un alt et un fichier servi par le site', () => {
  for (const [p, n] of [['ol-companion', 2], ['warhammer40k', 2], ['finance-tracker', 2]]) {
    const h = html(`case-studies/${p}`);
    const imgs = [...h.matchAll(/<img[^>]+src="(\/case-studies\/[^"]+\.png)"[^>]*>/g)];
    assert.ok(imgs.length >= n, `${p} : ${imgs.length} captures`);
    for (const m of imgs) {
      assert.match(m[0], /alt="[^"]{10,}"/, `${p} alt`);
      readFileSync(join(DIST, m[1]));
    }
  }
});

test('R7 — la ligne de date n\'affiche aucune barre oblique inverse', () => {
  for (const p of PAGES) {
    const t = texte(`case-studies/${p}`);
    assert.doesNotMatch(t, /\\/, `${p} : barre oblique inverse affichée`);
    assert.match(t, /état relu d'après son README/, p);
  }
});

test('R8 — warhammer40k ne décrit plus le flux SSE /api/events, supprimé en L24', () => {
  const t = texte('case-studies/warhammer40k');
  assert.doesNotMatch(t, /api\/events/);
  assert.doesNotMatch(t, /\bSSE\b/);
});

test('R9 — ol-companion parle des animations du direct (carton rouge, remplacement, but annulé)', () => {
  const t = texte('case-studies/ol-companion');
  assert.match(t, /animations? du direct/i);
  assert.match(t, /carton rouge/i);
  assert.match(t, /but annulé/i);
  assert.match(t, /poteau/i);
});

test('R10 — warhammer40k : le contenu éditorial est lu dans seed/, jamais dans data/ (pas de readFileSync data/factions.json)', () => {
  const t = texte('case-studies/warhammer40k');
  assert.doesNotMatch(t, /data\/factions\.json|data\/units\.json|data\/subfactions\.json/);
  assert.doesNotMatch(t, /JSON files\s*data\//);
  assert.match(t, /seed\/\*\.json/);
});
