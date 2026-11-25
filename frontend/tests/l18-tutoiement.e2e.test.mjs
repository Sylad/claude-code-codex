// L18 — le site TUTOIE son lecteur, partout. Mesuré sur le site CONSTRUIT (`npx astro build` avant) :
// le texte visible de chaque page de dist/ ne s'adresse jamais au lecteur par « vous » (pronoms, possessifs,
// verbes conjugués en -ez / -iez). Relevé avant L18 : 16 « vous/votre/vos » et 4 verbes en -ez sur 6 pages
// (À propos, Nouveautés, une étude de cas…), contre ~460 marques du tutoiement ; après : 0.
//
// Hors contrôle, parce que ce n'est pas le site qui parle au lecteur :
//  - les citations entre guillemets français « … » (libellé d'un relevé bancaire, mot cité) ;
//  - les éléments marqués `data-texte-tiers` (titres et résumés des flux RSS de /learning) ;
//  - le code (<pre>, <code>), les scripts, les styles, et le texte en anglais (lang="en").
// Les libellés écrits dans la page par le navigateur (séparateur et annonce des Nouveautés) sont vérifiés
// dans les scripts servis (dist/_astro/*.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

const VOUS = /(?<![\p{L}\d'’-])(vous|votre|vos|vôtres?)(?![\p{L}\d-])/giu;
// Verbe à la 2e personne du pluriel : minuscules, éventuellement une capitale en tête (« Utilisez »).
const EZ = /(?<![\p{L}\d'’-])\p{Lu}?\p{Ll}+i?ez(?![\p{L}\d-])/gu;
// Mots en -ez qui ne sont pas des verbes conjugués.
const PAS_VERBES = new Set(['chez', 'assez', 'nez', 'rez', 'lez', 'sez']);

function* pages(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) yield* pages(p);
    else if (p.endsWith('.html')) yield p;
  }
}

/** Retire chaque élément dont la balise ouvrante vérifie `ouvrante`, avec tout son contenu (balises de même nom équilibrées). */
export function retirerElements(html, ouvrante) {
  let out = html;
  for (;;) {
    const m = ouvrante.exec(out);
    if (!m) return out;
    const nom = m[1].toLowerCase();
    const balise = new RegExp(`<(/?)${nom}\\b[^>]*>`, 'gi');
    balise.lastIndex = m.index + m[0].length;
    let profondeur = 1;
    let fin = out.length;
    let b = balise.exec(out);
    while (b) {
      profondeur += b[1] ? -1 : 1;
      if (profondeur === 0) { fin = b.index + b[0].length; break; }
      b = balise.exec(out);
    }
    out = out.slice(0, m.index) + ' ' + out.slice(fin);
  }
}

/** Remplace par `par` chaque segment qui va de `debut` au `fin` suivant (parcours linéaire, sans expression régulière). */
function remplacerEntre(texte, debut, fin, par) {
  let out = '';
  let i = 0;
  for (;;) {
    const a = texte.indexOf(debut, i);
    const b = a < 0 ? -1 : texte.indexOf(fin, a + 1);
    if (b < 0) return out + texte.slice(i);
    out += texte.slice(i, a) + par;
    i = b + 1;
  }
}

export function texteAdresse(html) {
  let h = html.replace(/<(script|style|pre|code|svg)\b[\s\S]*?<\/\1>/gi, ' ');
  h = retirerElements(h, /<([a-z][\w-]*)\b[^>]*\sdata-texte-tiers\b[^>]*>/i);
  h = retirerElements(h, /<([a-z][\w-]*)\b[^>]*\slang="en"[^>]*>/i);
  const texte = remplacerEntre(h, '<', '>', ' ')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&nbsp;|&#160;|&#x202f;/gi, ' ')
    .replace(/&amp;/g, '&');
  return remplacerEntre(texte, '«', '»', ' « » ').replace(/\s+/g, ' ');
}

export function vouvoiements(texte) {
  const ez = (texte.match(EZ) ?? []).filter((m) => !PAS_VERBES.has(m.toLowerCase()));
  return [...(texte.match(VOUS) ?? []), ...ez];
}

test('L18 — le détecteur voit le vouvoiement et laisse passer citations, tiers et faux amis', () => {
  assert.deepEqual(vouvoiements(texteAdresse('<p>Si vous trouvez une typo, passez par GitHub.</p>')), ['vous', 'trouvez', 'passez']);
  assert.deepEqual(vouvoiements(texteAdresse('<p>Utilisez votre appareil.</p>')), ['votre', 'Utilisez']);
  assert.deepEqual(vouvoiements(texteAdresse('<p>La section « vos autres comptes » du relevé, chez moi, assez court.</p>')), []);
  assert.deepEqual(vouvoiements(texteAdresse('<ul data-texte-tiers><li><ul><li>x</li></ul>vos données</li></ul><p>Tu lis.</p>')), []);
  assert.deepEqual(vouvoiements(texteAdresse('<ul data-texte-tiers><li>x</li></ul><p>Vous lisez.</p>')), ['Vous', 'lisez']);
  assert.deepEqual(vouvoiements(texteAdresse('<code>chmod --vous</code><p lang="en">Vous</p>')), []);
});

test('L18 — aucune page du site construit ne vouvoie le lecteur', () => {
  const fautes = [];
  let n = 0;
  for (const f of pages(DIST)) {
    n++;
    const trouves = vouvoiements(texteAdresse(readFileSync(f, 'utf8')));
    if (trouves.length) fautes.push(`${relative(DIST, f)} : ${trouves.join(', ')}`);
  }
  assert.ok(n >= 30, `seulement ${n} pages dans dist (build à jour ?)`);
  assert.deepEqual(fautes, [], `vouvoiement adressé au lecteur :\n${fautes.join('\n')}`);
});

test('L18 — les pages principales tutoient bien (Démarrer, À propos, Nouveautés)', () => {
  for (const p of ['start/index.html', 'about/index.html', 'nouveautes/index.html']) {
    const t = texteAdresse(readFileSync(join(DIST, p), 'utf8'));
    assert.match(t, /(?<![\p{L}'’])(tu|te|toi|ton|ta|tes)(?!\p{L})/iu, `${p} : aucun tutoiement`);
  }
});

test('L18 — les libellés écrits par le navigateur (séparateur, annonce des Nouveautés) tutoient', () => {
  const dir = join(DIST, '_astro');
  const js = readdirSync(dir).filter((f) => f.endsWith('.js'));
  const fautes = js.flatMap((f) => {
    const src = readFileSync(join(dir, f), 'utf8');
    return /visite/.test(src) ? (src.match(/[^"'`]{0,40}\b(votre|vos|vous)\b[^"'`]{0,40}/g) ?? []).map((m) => `${f} : ${m}`) : [];
  });
  assert.deepEqual(fautes, []);
});
