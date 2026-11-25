// L100 — la stack annoncée du site suit ses dépendances réelles.
// Le 25-11-2026, README, /about, apps.ts et l'étude de cas claude-code-codex citaient shadcn-vue et
// reka-ui alors qu'aucun fichier ne les importait. Ce test relève chaque bibliothèque nommée dans les
// textes qui décrivent la stack du site et exige qu'elle soit dans package.json (frontend ou racine),
// à la version majeure annoncée ; il exige aussi que chaque dépendance du frontend serve quelque part.
// Lit les sources : pas besoin de build.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apps } from '../src/data/apps.ts';

const FRONT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RACINE = join(FRONT, '..');
const lire = (...p) => readFileSync(join(...p), 'utf8');

const pkgFront = JSON.parse(lire(FRONT, 'package.json'));
const pkgRacine = JSON.parse(lire(RACINE, 'package.json'));
const deps = {
  ...pkgRacine.dependencies, ...pkgRacine.devDependencies,
  ...pkgFront.dependencies, ...pkgFront.devDependencies,
};
const majeure = (v) => Number(String(v).replace(/^[^\d]*/, '').split('.')[0]);

// Nom cité dans un texte → paquet(s) qui doivent être présents. Un nom absent de cette liste n'est pas
// contrôlé : l'ajouter ici quand une page cite une nouvelle bibliothèque.
const BIBLIOTHEQUES = [
  { motif: /\bshadcn(?:-vue|\/ui)?\b/i, paquets: ['reka-ui', 'class-variance-authority'], nom: 'shadcn-vue' },
  { motif: /\breka-ui\b/i, paquets: ['reka-ui'], nom: 'reka-ui' },
  { motif: /\bradix(?:-vue)?\b/i, paquets: ['radix-vue'], nom: 'Radix Vue' },
  { motif: /\bReact\b/, paquets: ['react'], nom: 'React' },
  { motif: /\bAstro\b(?:\s+(\d+))?/, paquets: ['astro'], nom: 'Astro' },
  { motif: /\bVue\b(?:\s+(\d+))?/, paquets: ['vue', '@astrojs/vue'], nom: 'Vue' },
  { motif: /\bTailwind\b(?:\s+(\d+))?/, paquets: ['tailwindcss'], nom: 'Tailwind' },
  { motif: /\btw-animate-css\b/, paquets: ['tw-animate-css'], nom: 'tw-animate-css' },
  { motif: /\bLucide\b/i, paquets: ['lucide-vue-next'], nom: 'Lucide' },
  { motif: /\bMermaid\b(?:\s+(\d+))?/, paquets: ['mermaid'], nom: 'Mermaid' },
  { motif: /\bVite\b(?:\s+(\d+))?/, paquets: ['vite'], nom: 'Vite' },
  { motif: /\btsx\b/, paquets: ['tsx'], nom: 'tsx' },
  { motif: /\bAnthropic SDK\b|\bSDK Anthropic\b/, paquets: ['@anthropic-ai/sdk'], nom: 'SDK Anthropic' },
];

// Extrait le texte entre un début et une fin (exclue), en échouant si le repère a disparu.
function entre(texte, debut, fin, ou) {
  const i = texte.indexOf(debut);
  assert.ok(i >= 0, `${ou} : repère « ${debut} » introuvable`);
  const j = texte.indexOf(fin, i + debut.length);
  assert.ok(j > i, `${ou} : fin « ${fin} » introuvable`);
  return texte.slice(i, j);
}

const etude = lire(FRONT, 'src/pages/case-studies/claude-code-codex.astro');
const DECLARATIONS = [
  { ou: 'README.md, section Stack', texte: entre(lire(RACINE, 'README.md'), '## Stack', '\n## ', 'README') },
  { ou: '/about, Stack du site', texte: entre(lire(FRONT, 'src/pages/about.astro'), 'Stack du site', '</ul>', 'about') },
  { ou: 'apps.ts, claude-code-codex', texte: apps.find((a) => a.name === 'claude-code-codex').stack },
  { ou: 'étude claude-code-codex, schéma Architecture', texte: entre(etude, 'eyebrow="Architecture"', '</CaseStudySection>', 'étude') },
  { ou: 'étude claude-code-codex, Stack & data flow', texte: entre(etude, 'eyebrow="Stack & data flow"', '</CaseStudySection>', 'étude') },
];

/** Écarts entre un texte de stack et les dépendances : une ligne par bibliothèque absente ou à la mauvaise version. */
export function ecartsStack(texte, dependances) {
  const ecarts = [];
  for (const b of BIBLIOTHEQUES) {
    const re = new RegExp(b.motif.source, b.motif.flags.includes('g') ? b.motif.flags : `${b.motif.flags}g`);
    for (const m of texte.matchAll(re)) {
      const manquants = b.paquets.filter((p) => !(p in dependances));
      if (manquants.length) { ecarts.push(`${b.nom} cité, ${manquants.join(', ')} absent de package.json`); break; }
      // « la montée depuis Astro 6 » raconte l'histoire : la version passée n'est pas annoncée.
      const historique = /depuis\s+$/.test(texte.slice(Math.max(0, m.index - 10), m.index));
      if (m[1] && !historique && majeure(dependances[b.paquets[0]]) !== Number(m[1])) {
        ecarts.push(`${b.nom} ${m[1]} cité, package.json a ${b.paquets[0]} ${dependances[b.paquets[0]]}`);
      }
    }
  }
  return [...new Set(ecarts)];
}

for (const d of DECLARATIONS) {
  test(`${d.ou} : chaque bibliothèque citée est dans package.json, à la version annoncée`, () => {
    assert.deepEqual(ecartsStack(d.texte, deps), []);
  });
}

test('le contrôle repère bien une bibliothèque absente ou une mauvaise version', () => {
  const sans = { astro: '^7.0.0', vue: '^3.5.0', '@astrojs/vue': '^7.0.0', tailwindcss: '^4.0.0' };
  assert.deepEqual(ecartsStack('Vue 3 + shadcn-vue + Tailwind 4', sans), [
    'shadcn-vue cité, reka-ui, class-variance-authority absent de package.json',
  ]);
  assert.deepEqual(ecartsStack('Îlots Vue 3 + reka-ui', sans), ['reka-ui cité, reka-ui absent de package.json']);
  assert.deepEqual(ecartsStack('Astro 6, Tailwind 4', sans), ['Astro 6 cité, package.json a astro ^7.0.0']);
  assert.deepEqual(ecartsStack('Astro 7 ; la montée depuis Astro 6', sans), []);
});

function fichiers(dossier) {
  return readdirSync(dossier).flatMap((n) => {
    const p = join(dossier, n);
    return statSync(p).isDirectory() ? fichiers(p) : [p];
  });
}

test('chaque dépendance du frontend est importée par le code (aucune dépendance orpheline)', () => {
  const code = [join(FRONT, 'astro.config.mjs'), ...fichiers(join(FRONT, 'src'))]
    .filter((p) => /\.(astro|vue|ts|mjs|js|css)$/.test(p))
    .map((p) => readFileSync(p, 'utf8'))
    .join('\n');
  const orphelines = Object.keys(pkgFront.dependencies).filter((p) => {
    const esc = p.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
    return !new RegExp(`(?:from\\s+|import\\s*\\(?\\s*|@import\\s+)["']${esc}(?:/[^"']*)?["']`).test(code);
  });
  assert.deepEqual(orphelines, []);
});
