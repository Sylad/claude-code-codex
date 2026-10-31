// L50 — étude de cas cadence : trois schémas SVG, une capture du panneau des lots, texte découpé
// (intertitres, encadrés), lisibilité en thème clair et sombre. Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

const html = () => readFileSync(join(DIST, 'case-studies', 'cadence', 'index.html'), 'utf8');
const figure = (id) => {
  const m = html().match(new RegExp(`<figure[^>]*data-schema="${id}"[^>]*>([\\s\\S]*?)</figure>`));
  assert.ok(m, `figure « ${id} » absente`);
  return m[1];
};
const plain = (s) => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const IDS = ['plan-commits', 'parcours-lot', 'chaine-livreur'];

test('R1 — trois schémas SVG, chacun avec titre, description et légende', () => {
  for (const id of IDS) {
    const f = figure(id);
    assert.match(f, /<svg[^>]*role="img"[^>]*aria-labelledby="[^"]+"/, `${id} : svg sans role/aria-labelledby`);
    assert.match(f, /<svg[^>]*viewBox="0 0 \d+ \d+"/, `${id} : viewBox absente`);
    assert.match(f, /<title[^>]*>[^<]{10,}<\/title>/, `${id} : titre`);
    assert.match(f, /<desc[^>]*>[^<]{30,}<\/desc>/, `${id} : description`);
    assert.match(f, /<figcaption[^>]*>[^<]{20,}/, `${id} : légende`);
  }
});

test('R2 — le parcours d’un lot suit spec → code → revue → correction → UX → prêt, dans cet ordre', () => {
  const t = plain(figure('parcours-lot'));
  let from = 0;
  for (const step of ['Spec', 'Code', 'Revue', 'Correction', 'UX', 'Prêt']) {
    const at = t.indexOf(step, from);
    assert.ok(at >= 0, `étape « ${step} » absente ou hors ordre`);
    from = at + step.length;
  }
  assert.match(figure('parcours-lot'), /data-boucle="correction-revue"/, 'boucle correction → revue absente');
});

test('R3 — le plan relié aux commits montre un lot, son commit et les trois commandes', () => {
  const t = plain(figure('plan-commits'));
  for (const w of ['L4', 'fix(L4)', 'raf commits', 'raf now', 'raf check']) assert.ok(t.includes(w), `« ${w} » absent`);
});

test('R4 — la chaîne du livreur va du lot prêt à la ligne rendue, dans l’ordre', () => {
  const t = plain(figure('chaine-livreur'));
  let from = 0;
  for (const step of ['Lot prêt', 'Porte de tests', 'Verdict UX', 'Clôture', 'Push', 'Livraison vérifiée', 'Une ligne']) {
    const at = t.indexOf(step, from);
    assert.ok(at >= 0, `étape « ${step} » absente ou hors ordre`);
    from = at + step.length;
  }
});

test('R5 — aucune couleur en dur dans les schémas : tout passe par les jetons', () => {
  for (const id of IDS) {
    const f = figure(id);
    assert.doesNotMatch(f, /(?:fill|stroke|stop-color)="(?!none|currentColor|url)/, `${id} : couleur en attribut`);
    assert.doesNotMatch(f, /style="[^"]*#[0-9a-f]{3,8}/i, `${id} : couleur hexadécimale en style`);
  }
});

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const css = () => {
  const dir = join(DIST, '_astro');
  const own = readdirSync(dir).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(dir, f), 'utf8'));
  return own.join('\n') + html();
};
const tokens = (block) => Object.fromEntries([...block.matchAll(/--sch-([a-z-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2].toLowerCase()]));

test('R6 — clair ET sombre : jetons définis pour les deux thèmes, texte ≥ 4,5:1 sur le fond du schéma et des boîtes', () => {
  const all = css();
  const dark = tokens(all.match(/\.schema\s*\{([^}]*)\}/)[1]);
  const lightBlock = all.match(/prefers-color-scheme:\s*light\)\s*\{\s*(?::root:not\([^)]*\)\s*)?\.schema\s*\{([^}]*)\}/);
  assert.ok(lightBlock, 'variante claire (prefers-color-scheme: light) absente');
  const light = { ...dark, ...tokens(lightBlock[1]) };
  assert.notEqual(light.bg, dark.bg, 'le thème clair ne change pas le fond');
  for (const [name, t] of [['sombre', dark], ['clair', light]]) {
    for (const [fg, bg] of [['text', 'bg'], ['text', 'box'], ['muted', 'box'], ['muted', 'bg'], ['accent', 'box'], ['accent', 'bg']]) {
      assert.ok(ratio(t[fg], t[bg]) >= 4.5, `${name} : ${fg} sur ${bg} = ${ratio(t[fg], t[bg]).toFixed(2)}`);
    }
    assert.ok(ratio(t.line, t.bg) >= 3, `${name} : trait sur fond = ${ratio(t.line, t.bg).toFixed(2)} (< 3:1)`);
  }
});

test('R7 — la capture du panneau des lots est une image réelle, avec alt, dimensions et légende', () => {
  const m = html().match(/<figure[^>]*data-capture="panneau-lots"[^>]*>([\s\S]*?)<\/figure>/);
  assert.ok(m, 'figure de capture absente');
  const img = m[1].match(/<img[^>]*>/)[0];
  assert.match(img, /alt="[^"]{30,}"/, 'alt trop court');
  assert.match(img, /width="\d+"/); assert.match(img, /height="\d+"/);
  assert.match(img, /loading="lazy"/);
  const src = img.match(/src="([^"]+)"/)[1];
  assert.ok(existsSync(join(DIST, src.replace(/^\//, ''))), `fichier ${src} absent de dist`);
  assert.match(m[1], /<figcaption/);
});

test('R8 — le texte est découpé : au moins quatre intertitres h3 hors cartes et deux encadrés', () => {
  const h = html();
  const main = h.slice(h.indexOf('<main'), h.indexOf('</main>'));
  const inter = [...main.matchAll(/<h3[^>]*data-intertitre[^>]*>/g)];
  assert.ok(inter.length >= 4, `${inter.length} intertitres`);
  const encadres = [...main.matchAll(/<aside[^>]*data-encadre[^>]*>/g)];
  assert.ok(encadres.length >= 2, `${encadres.length} encadrés`);
});

test('R9 — un schéma ne fait pas déborder la page : largeur bornée à 100 %', () => {
  assert.match(css(), /\.schema\s+svg\s*\{[^}]*max-width:\s*100%/);
});

test('R10 — le texte des schémas n’hérite d’aucune ombre portée du site (illisible sur fond clair)', () => {
  assert.match(css(), /\.schema\s*\{[^}]*text-shadow:\s*none/);
});

test('R11 — le parcours d’un lot dit QUI fait chaque étape, dans l’ordre des étapes', () => {
  const t = plain(figure('parcours-lot'));
  let from = 0;
  for (const qui of ['spec-writer', 'Sonnet', 'Opus', 'pas écrit le code', 'Fable', 'ux-reviewer', 'lead']) {
    const at = t.indexOf(qui, from);
    assert.ok(at >= 0, `« ${qui} » absent ou hors ordre`);
    from = at + qui.length;
  }
});

test('R12 — l’entrée Nouveautés du parcours dit qui fait chaque étape, comme le schéma affiché', () => {
  const dir = join(import.meta.dirname, '..', '..', 'docs', 'nouveautes');
  const f = readdirSync(dir).find((n) => /etude-de-cas-cadence/.test(n));
  assert.ok(f, 'entrée Nouveautés de L50 introuvable');
  const t = readFileSync(join(dir, f), 'utf8');
  for (const qui of ['spec-writer', 'Sonnet', 'Opus', 'Fable', 'ux-reviewer', 'lead']) {
    assert.ok(t.includes(qui), `« ${qui} » absent de l’entrée Nouveautés`);
  }
});

test('R13 — le nom accessible du parcours (title + desc du svg role=img) nomme qui fait chaque étape, dans l’ordre', () => {
  // Sous role="img", les <text> intérieurs sont présentationnels : seul aria-labelledby (title + desc) est lu.
  const f = figure('parcours-lot');
  const title = f.match(/<title[^>]*>([^<]*)<\/title>/);
  const desc = f.match(/<desc[^>]*>([^<]*)<\/desc>/);
  assert.ok(title && desc, 'title ou desc du svg absent');
  const name = plain(`${title[1]} ${desc[1]}`);
  let from = 0;
  for (const qui of ['spec-writer', 'Sonnet', 'Opus', 'pas écrit le code', 'Fable', 'ux-reviewer', 'lead']) {
    const at = name.indexOf(qui, from);
    assert.ok(at >= 0, `« ${qui} » absent du nom accessible ou hors ordre`);
    from = at + qui.length;
  }
  assert.doesNotMatch(`${title[1]} ${desc[1]}`, /\s{2}/, 'double espace dans le nom accessible');
});
