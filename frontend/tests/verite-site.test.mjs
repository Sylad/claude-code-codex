// L52 — relecture de vérité : le rapport docs/verite-site.md couvre toutes les pages, classe chaque ligne.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = fileURLToPath(new URL('../', import.meta.url));
const rapport = readFileSync(join(racine, '../docs/verite-site.md'), 'utf8');
const CLASSES = ['faux', 'dépassé', 'non sourcé', 'ok'];

function pages(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return pages(p);
    return p.endsWith('.astro') ? [p] : [];
  });
}
const routes = pages(join(racine, 'src/pages')).map((p) => '/' + relative(join(racine, 'src/pages'), p).replace(/\.astro$/, '').replace(/(^|\/)index$/, '') );

const sections = new Map();
let courante = null;
for (const l of rapport.split('\n')) {
  const h = l.match(/^## `([^`]+)`/);
  if (h) { courante = h[1]; sections.set(courante, []); } else if (l.startsWith('## ')) courante = null; else if (courante && l.startsWith('- ')) sections.get(courante).push(l);
}

test('R1 — chaque page du site a sa section « ## `/route` » dans le rapport', () => {
  assert.ok(routes.length > 20, 'les pages du site sont bien listées');
  for (const r of routes) assert.ok(sections.has(r || '/'), `section manquante pour ${r || '/'}`);
});

test('R2 — chaque ligne du rapport porte une classe parmi faux / dépassé / non sourcé / ok, et une source', () => {
  let n = 0;
  for (const [route, lignes] of sections) {
    for (const l of lignes) {
      n++;
      const m = l.match(/^- \*\*(faux|dépassé|non sourcé|ok)\*\* — (.+)/);
      assert.ok(m, `${route} : ligne sans classe valide : ${l.slice(0, 60)}`);
      assert.match(m[2], /\(source : [^)]+\)/, `${route} : ligne sans source : ${l.slice(0, 60)}`);
    }
  }
  assert.ok(n >= 10);
});

test("R3 — le rapport ne contient pas de section pour une page qui n'existe pas", () => {
  for (const r of sections.keys()) assert.ok(routes.includes(r === '/' ? '' : r) || r === '/', `page inconnue : ${r}`);
});

test('R4 — le rapport donne un décompte par classe cohérent avec ses lignes', () => {
  for (const c of CLASSES) {
    const reel = [...sections.values()].flat().filter((l) => l.startsWith(`- **${c}**`)).length;
    const m = rapport.match(new RegExp(`\\| ${c} \\| (\\d+) \\|`));
    assert.ok(m, `décompte manquant pour ${c}`);
    assert.equal(Number(m[1]), reel, `décompte de ${c}`);
  }
});

test("R5 — aucune page n'est laissée « non relue » : chaque section a une ligne vérifiée contre une source", () => {
  for (const [route, lignes] of sections) {
    assert.ok(lignes.length > 0, `${route} : section vide`);
    for (const l of lignes) assert.ok(!/non relue/.test(l), `${route} : page non relue : ${l.slice(0, 60)}`);
  }
  assert.ok(!/non relue/i.test(rapport.split('## Par page')[0].replace(/ne sont pas relues|ne pas relue/g, '')), "le préambule ne déclare plus de page non relue");
});

const ligne = (route, re) => (sections.get(route) || []).find((l) => re.test(l));

test('R6 — l’accueil et /about relèvent « déployées sur Kubernetes » comme faux (4 apps sur 8 seulement)', () => {
  for (const route of ['/', '/about']) {
    assert.ok(ligne(route, /^- \*\*faux\*\*.*Kubernetes/), `${route} : ligne faux sur Kubernetes manquante`);
  }
});

test('R7 — un chiffre juste à sa date (~70 fichiers .md, CLAUDE.md de 130 lignes) est « dépassé », pas « faux »', () => {
  assert.ok(ligne('/case-studies/claude-code-codex', /^- \*\*dépassé\*\*.*~70 fichiers/), '~70 fichiers .md');
  assert.ok(ligne('/case-studies/warhammer40k', /^- \*\*dépassé\*\*.*130 lignes/), 'CLAUDE.md de 130 lignes');
  assert.ok(!ligne('/case-studies/claude-code-codex', /^- \*\*faux\*\*.*~70 fichiers/));
  assert.ok(!ligne('/case-studies/warhammer40k', /^- \*\*faux\*\*.*130 lignes/));
});

test('R8 — les fonctionnalités de Claude Code de /theory et /start sont classées contre la documentation, pas « non sourcé » en bloc', () => {
  assert.ok(ligne('/theory', /^- \*\*ok\*\*.*Task.*Agent.*2\.1\.63.*code\.claude\.com/), 'renommage Task → Agent');
  assert.ok(ligne('/theory', /^- \*\*ok\*\*.*MEMORY\.md.*200 lignes.*25/), 'MEMORY.md 200 lignes / 25 KB');
  assert.ok(ligne('/theory', /^- \*\*ok\*\*.*événements de hooks.*5 types de handler/), 'hooks');
  assert.ok(ligne('/theory', /^- \*\*faux\*\*.*sous-agents ne peuvent pas spawner/), 'nesting des sous-agents');
  assert.ok(!ligne('/theory', /^- \*\*non sourcé\*\*.*Task renommé/), 'plus de bloc non sourcé sur Task');
  assert.ok(ligne('/start', /^- \*\*(ok|non sourcé)\*\*.*tableau Claude Code \/ Copilot.*Mémoire/), 'ligne /start « Mémoire » classée ok ou non sourcé');
  assert.ok(ligne('/start', /^- \*\*non sourcé\*\*.*colonne Copilot/), 'colonne Copilot classée non sourcé');
});

test('R10 — les étoiles sont attribuées au bon outil : code-review-graph 16 940 → 32 516, TanStack Start 14 360 → 15 267, Convex relu', () => {
  const stars = ligne('/case-studies', /^- \*\*dépassé\*\*.*étoiles figées/) || '';
  assert.ok(/code-review-graph 16 940 → 32 516/.test(stars), 'code-review-graph relevé');
  assert.ok(/tanstack-start 14 360 → 15 267/.test(stars), 'TanStack Start relevé avec sa vraie valeur');
  assert.ok(!/tanstack-start 16 940/.test(stars), 'les étoiles de code-review-graph ne sont plus attribuées à TanStack Start');
  assert.ok(ligne('/case-studies', /Convex.*12 570 → 12 770/), 'Convex relu');
  assert.ok(ligne('/case-studies/code-review-graph', /^- \*\*dépassé\*\*.*16\.9k★.*32/), 'le 16.9k★ de la page code-review-graph est classé');
});

test('R11 — /case-studies/finance-tracker classe « Sonnet 4.5 » contre le modèle du code (claude-sonnet-5-5 depuis le 2026-10-15)', () => {
  const l = ligne('/case-studies/finance-tracker', /^- \*\*(dépassé|faux)\*\*.*Sonnet 4\.5/);
  assert.ok(l, 'ligne sur le modèle Sonnet 4.5 manquante');
  assert.match(l, /claude-sonnet-5-5/, 'le modèle réel du code est nommé');
  assert.match(l, /2026-10-15/, 'la date du changement de modèle est donnée');
  assert.match(l, /claude-model\.ts/, 'la source est le fichier du modèle');
});

test('R12 — la section « Corrections à faire, par page » liste exactement les pages ayant une ligne faux ou dépassé', () => {
  const corr = rapport.split('## Corrections à faire, par page')[1] || '';
  const listees = [...corr.matchAll(/^- `([^`]+)` — /gm)].map((m) => m[1]).sort();
  const attendues = [...sections].filter(([, l]) => l.some((x) => /^- \*\*(faux|dépassé)\*\*/.test(x))).map(([r]) => r).sort();
  assert.deepEqual(listees, attendues);
});
