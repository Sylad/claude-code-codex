// L39 — règle durable : chaque étude de cas d'une app porte EN TÊTE sa date de mise à jour et la liste des
// dépôts qu'elle décrit (data-testid « date-maj » et « depots-decrits »), pour savoir quelle page suit quel
// dépôt. Et les études avatar-pandora, evatosorus, claude-code-codex décrivent l'état réel du 17-11-2026.
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { apps } from '../src/data/apps.ts';

const html = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const sansBalises = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'")
  .replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ').trim();
const texte = (p) => sansBalises(html(p));

const MOIS = 'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre';
const DATE_FR = new RegExp(`\\b(1er|[12]?\\d|3[01]) (${MOIS}) 20\\d\\d\\b`);

/** Contenu texte de l'élément portant ce data-testid (premier trouvé), ou null. */
function parTestId(h, id) {
  const m = h.match(new RegExp(`<(\\w+)[^>]*data-testid="${id}"[^>]*>([\\s\\S]*?)</\\1>`));
  return m ? { texte: sansBalises(m[2]), index: m.index } : null;
}

const ETUDES_APPS = apps.filter((a) => a.href.startsWith('/case-studies/'));

test('R1 — chaque étude d\'app porte en tête une date de mise à jour et les dépôts qu\'elle décrit', () => {
  assert.ok(ETUDES_APPS.length >= 8, `${ETUDES_APPS.length} études d'apps`);
  for (const a of ETUDES_APPS) {
    const h = html(a.href.slice(1));
    const date = parTestId(h, 'date-maj');
    const depots = parTestId(h, 'depots-decrits');
    assert.ok(date, `${a.href} : pas de date de mise à jour (data-testid="date-maj")`);
    assert.match(date.texte, DATE_FR, `${a.href} : date illisible « ${date.texte} »`);
    assert.ok(depots, `${a.href} : pas de liste des dépôts décrits (data-testid="depots-decrits")`);
    const depot = a.repo ? a.repo.split('/').pop() : null;
    if (depot) assert.ok(depots.texte.includes(depot), `${a.href} : « ${depots.texte} » ne cite pas ${depot}`);
    else assert.match(depots.texte, /:\s*\S/, `${a.href} : liste des dépôts vide`);
    // En tête : avant la première section de l'étude (premier <h2> du contenu).
    const h2 = h.indexOf('<h2', h.indexOf('<main'));
    assert.ok(h2 < 0 || (date.index < h2 && depots.index < h2), `${a.href} : date ou dépôts après la première section`);
  }
});

test('R2 — toute étude datée cite aussi ses dépôts, et inversement', () => {
  const dir = join(DIST, 'case-studies');
  for (const d of readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    let h;
    try { h = html(`case-studies/${d.name}`); } catch { continue; }
    assert.equal(!!parTestId(h, 'date-maj'), !!parTestId(h, 'depots-decrits'), d.name);
  }
});

test('R3 — les trois études relues le 17 novembre 2026 portent cette date', () => {
  for (const p of ['avatar-pandora', 'evatosorus', 'claude-code-codex']) {
    const d = parTestId(html(`case-studies/${p}`), 'date-maj');
    assert.equal(d.texte, 'Mis à jour le 17 novembre 2026', p);
  }
});

test('R4 — avatar-pandora : Astro 7, aucun backend ni proxy d\'images, nouvelle adresse publique', () => {
  const t = texte('case-studies/avatar-pandora');
  assert.match(t, /Astro 7/);
  assert.doesNotMatch(t, /Astro 6 statique|Astro 6 ·/);
  assert.match(t, /avatar-pandora-12q\.pages\.dev/);
  assert.doesNotMatch(t, /eywa-eywa\.pages\.dev|http:\/\/nas|port 3003/);
  assert.match(t, /1er octobre 2026/);
  assert.match(t, /Aucune image tierce/);
  assert.doesNotMatch(t, /· GSAP ·|GSAP — transitions/);
});

test('R5 — evatosorus : Astro 7, 1 500 espèces enrichies en local, pages datées, plus d\'API au build', () => {
  const t = texte('case-studies/evatosorus');
  assert.match(t, /Astro 7/);
  assert.doesNotMatch(t, /astro@6|vite@7|Astro 6 \+/);
  assert.match(t, /1533 pages HTML au 17 novembre 2026/);
  assert.match(t, /llama 3\.1/);
  assert.match(t, /1 422 fiches enrichies/);
  assert.doesNotMatch(t, /GBIF|CARTO/);
});

test('R6 — claude-code-codex : Astro 7, cinq sources, nombre d\'études compté au build', () => {
  const t = texte('case-studies/claude-code-codex');
  assert.match(t, /Astro 7/);
  assert.doesNotMatch(t, /\(Astro 6\)|Frontend — Astro 6/); // seule la montée « depuis Astro 6 » est citée
  assert.match(t, /Human Coders filtré sur\s+Claude et Anthropic/); // scripts/sources/humancoders.ts, KEYWORD_RE
  assert.doesNotMatch(t, /Human Coders filtré sur\s+Claude et MCP/);
  const n = readdirSync(join(DIST, 'case-studies'), { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(DIST, 'case-studies', e.name, 'index.html'))).length;
  assert.match(t, new RegExp(`${n} pages`));
});

test('R7 — rien de privé : ni chemin local ni nom de machine dans les trois études', () => {
  for (const p of ['avatar-pandora', 'evatosorus', 'claude-code-codex']) {
    const t = texte(`case-studies/${p}`);
    assert.doesNotMatch(t, /~\/|\/home\/|<cwd>|dark-blue|Big-Blue|mini-blue|192\.168\./i, p);
    assert.doesNotMatch(t, /\bEva\b|nièce/, p);
  }
});
