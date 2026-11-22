// L8 (revue UX, constat bloquant WCAG 1.4.3) — les textes discrets et les textes colorés des études de cas
// prennent leur couleur dans les JETONS de la charte (src/styles/global.css), plus dans un style local
// (`text-ink/40`, `text-ink/50`, `text-rose-400/70`… mesurés de 3,2 à 4,4:1 par la revue).
//  R1 : chaque jeton de texte atteint 4,5:1 sur chaque fond de la charte, y compris le fond de page le plus
//       clair (image de fond à 50 % sous le voile paper à 70 %, pire cas : image blanche) et les cartes
//       teintées à 5 % (bg-claude/5, bg-rose-500/5…) posées sur ce fond.
//  R2 : garde statique, aucune couleur de texte semi-transparente dans l'index des études ni dans les études.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { jetons, poser, contraste } from './lib/contraste.mjs';

const J = jetons();
const BLANC = [255, 255, 255];
// Teintes Tailwind 500 des cartes (valeurs oklch de Tailwind 4) : couleurs de FOND seulement, à 5 %.
const TEINTES = {
  rose: [255, 32, 86], emerald: [0, 188, 125], amber: [254, 154, 0], claude: J['claude-orange'],
};

const fonds = () => {
  // BaseLayout : image à opacity-50 sur paper, puis voile from-paper/70 (le moins couvrant).
  const pageClaire = poser(J.paper, 0.7, poser(BLANC, 0.5, J.paper));
  const f = { paper: J.paper, 'paper-elevated': J['paper-elevated'], card: J.card, 'page (pire pixel de l’image)': pageClaire };
  for (const [n, c] of Object.entries(TEINTES)) {
    f[`${n}/5 sur la page`] = poser(c, 0.05, pageClaire);
    f[`${n}/5 sur paper-elevated`] = poser(c, 0.05, J['paper-elevated']);
  }
  return f;
};

test('les jetons de texte existent dans la charte', () => {
  for (const n of ['ink', 'ink-muted', 'positive', 'negative', 'caution', 'paper', 'paper-elevated', 'card']) {
    assert.ok(J[n], `jeton --${n} absent de global.css`);
  }
  const css = readFileSync(fileURLToPath(new URL('../src/styles/global.css', import.meta.url)), 'utf8');
  for (const n of ['positive', 'negative', 'caution']) assert.match(css, new RegExp(`--color-${n}: var\\(--${n}\\)`));
});

test('R1 — chaque jeton de texte ≥ 4,5:1 sur chaque fond de la charte', () => {
  const ecarts = [];
  // L'accent --claude-orange n'y est pas : sur l'image de fond, il est mesuré au pire pixel RÉEL par
  // l74-contraste-accent.e2e.test.mjs (le pire cas théorique, image blanche, est trop sévère pour lui).
  for (const t of ['ink', 'ink-muted', 'positive', 'negative', 'caution', 'claude-orange-soft']) {
    for (const [nf, f] of Object.entries(fonds())) {
      const r = contraste(J[t], f);
      if (r < 4.5) ecarts.push(`--${t} sur ${nf} : ${r.toFixed(2)}:1`);
    }
  }
  assert.deepEqual(ecarts, []);
});

test('R1 — témoin : l’ancien style local text-ink/50 sur le fond de page clair était sous le seuil', () => {
  const page = fonds()['page (pire pixel de l’image)'];
  assert.ok(contraste(poser(J.ink, 0.5, page), page) < 4.5);
  assert.ok(contraste(poser(J.ink, 0.4, page), page) < 4.5);
});

test('R2 — aucune couleur de texte semi-transparente dans l’index des études et les études', () => {
  const SRC = fileURLToPath(new URL('../src/', import.meta.url));
  const fichiers = [
    join(SRC, 'pages/case-studies.astro'),
    ...readdirSync(join(SRC, 'pages/case-studies')).map((f) => join(SRC, 'pages/case-studies', f)),
    join(SRC, 'components/site/CaseStudySection.astro'),
    join(SRC, 'components/site/EtudeFraicheur.astro'),
  ];
  const hits = [];
  for (const f of fichiers) {
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/(^|[\s"'`{])((?:[a-z-]+:)*)text-([a-z]+(?:-\d+)?)\/[\w.[\]]+/g)) {
        if (/(hover|focus|focus-visible|active|group-hover):$/.test(m[2])) continue;
        hits.push(`${f.slice(SRC.length)}:${i + 1} ${m[0].trim()}`);
      }
    });
  }
  assert.deepEqual(hits, []);
});
