// L112 (D-6, D-7) — le site en deux langues, contenu partagé. Critères tirés de la consigne du lot :
// (2) une mise en page par page, la route sous /en/ n'est qu'une enveloppe de quelques lignes ; (3) textes courts
// dans un dictionnaire par langue, textes longs un fichier par langue, mêmes clés ; (7) un test refuse une mise en
// page recopiée sous src/pages/en/ et liste les pages sans anglais ; mesure : part de mise en page copiée
// (56 % avant L112) à presque rien. Plus le module des langues (cible du contrôle unique, langue du contenu).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TRADUITES, adresseDePage, adresseEn, autreLangue, est404, langueDuContenu, traduite,
} from '../src/lib/langues.mjs';
import { PAGE_404 } from '../src/contenus/page-404.mjs';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const PAGES = join(SRC, 'pages');
const EN_DIR = join(PAGES, 'en');
const ENVELOPPE_GENERALE = '[...page].astro';

function fichiers(dir) {
  return readdirSync(dir).flatMap((n) => {
    const f = join(dir, n);
    return statSync(f).isDirectory() ? fichiers(f) : [f];
  });
}

/** Frontmatter et gabarit d'un fichier .astro. */
function parties(src) {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(src);
  return m ? { front: m[1], gabarit: m[2] } : { front: '', gabarit: src };
}
/** Lignes de code utiles (sans commentaires ni lignes vides). */
const lignesUtiles = (texte) => texte.split('\n').map((l) => l.trim()).filter((l) => l && !/^(\/\/|\/\*|\*|\{\/\*|<!--)/.test(l));

const PAGES_FR = fichiers(PAGES).filter((f) => !f.startsWith(EN_DIR + '/')).map((f) => relative(PAGES, f));
const ADRESSES_FR = PAGES_FR.map(adresseDePage).filter(Boolean);

test('R1 — chaque page traduite sous src/pages/en/ n’est qu’une enveloppe du composant partagé avec la page française', () => {
  const routes = fichiers(EN_DIR).map((f) => relative(EN_DIR, f)).filter((r) => r !== ENVELOPPE_GENERALE);
  assert.ok(routes.length >= 2, `routes anglaises : ${routes.join(', ')}`);
  for (const r of routes) {
    const en = readFileSync(join(EN_DIR, r), 'utf8');
    const { front, gabarit } = parties(en);
    const imports = [...front.matchAll(/^import\s+(\w+)\s+from\s+"([^"]+)";$/gm)];
    assert.equal(imports.length, 1, `${r} : une seule importation attendue (le composant partagé)`);
    const [, nom, chemin] = imports[0];
    assert.match(chemin, /^@\/components\/pages\/\w+\.astro$/, `${r} : le composant vient de src/components/pages/`);
    assert.deepEqual(lignesUtiles(front).filter((l) => !l.startsWith('import ')), [], `${r} : code en plus de l'importation`);
    assert.deepEqual(lignesUtiles(gabarit), [`<${nom} langue="en" />`], `${r} : le gabarit doit seulement envelopper <${nom}>`);
    // la page française correspondante enveloppe le même composant, en français
    const fr = join(PAGES, r);
    assert.ok(existsSync(fr), `${r} : pas de page française`);
    const p = parties(readFileSync(fr, 'utf8'));
    assert.ok(p.front.includes(`from "${chemin}"`), `${r} : la page française n'utilise pas ${chemin}`);
    assert.deepEqual(lignesUtiles(p.gabarit), [`<${nom} langue="fr" />`], `${r} : page française`);
  }
});

test('R2 — part de mise en page copiée entre une page et sa version anglaise : presque rien (56 % avant L112)', (t) => {
  let copiees = 0;
  let total = 0;
  for (const r of fichiers(EN_DIR).map((f) => relative(EN_DIR, f)).filter((x) => x !== ENVELOPPE_GENERALE)) {
    const fr = new Set(lignesUtiles(parties(readFileSync(join(PAGES, r), 'utf8')).gabarit));
    const en = lignesUtiles(parties(readFileSync(join(EN_DIR, r), 'utf8')).gabarit);
    copiees += en.filter((l) => fr.has(l)).length;
    total += en.length;
  }
  const part = total ? copiees / total : 0;
  t.diagnostic(`mise en page copiée sous src/pages/en/ : ${copiees} ligne(s) sur ${total} (${Math.round(part * 100)} %)`);
  assert.ok(part <= 0.05, `${Math.round(part * 100)} % de la mise en page recopiée sous src/pages/en/`);
});

test('R3 — les pages sans anglais sont listées, et la route générale /en/ les sert toutes (sauf les traduites)', (t) => {
  const sansAnglais = ADRESSES_FR.filter((a) => !TRADUITES.includes(a)).sort();
  t.diagnostic(`${sansAnglais.length} page(s) sans anglais : ${sansAnglais.join(' ')}`);
  t.diagnostic(`${TRADUITES.length} page(s) traduite(s) : ${TRADUITES.join(' ')}`);
  assert.ok(sansAnglais.length >= 38, `${sansAnglais.length} pages`);
  const route = readFileSync(join(EN_DIR, ENVELOPPE_GENERALE), 'utf8');
  assert.match(route, /import\.meta\.glob\(\["\.\.\/\*\*\/\*\.astro", "!\.\.\/en\/\*\*"\]/, 'la route générale lit toutes les pages françaises');
  assert.match(route, /TRADUITES\.includes\(adresse\)/, 'la route générale laisse les pages traduites à leur enveloppe');
  for (const a of TRADUITES) assert.ok(ADRESSES_FR.includes(a), `${a} : traduite sans page française`);
});

test('R4 — un seul contrôle de langue, dans la barre : plus de sélecteur posé dans les pages', () => {
  assert.ok(!existsSync(join(SRC, 'components', 'site', 'SelecteurLangue.astro')), 'SelecteurLangue.astro existe encore');
  const avec = fichiers(SRC).filter((f) => /\.(astro|vue|ts|mjs)$/.test(f) && readFileSync(f, 'utf8').includes('data-selecteur-langue'));
  assert.deepEqual(avec.map((f) => relative(SRC, f)), ['components/site/Navbar.vue']);
  const layout = readFileSync(join(SRC, 'layouts', 'BaseLayout.astro'), 'utf8');
  assert.doesNotMatch(layout, /SelecteurLangue/);
});

/** Squelette d'un jeu de textes : les clés et la forme, sans le texte (fonctions comprises). */
function squelette(v) {
  if (Array.isArray(v)) return v.map(squelette);
  if (typeof v === 'function') return 'fn';
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, squelette(v[k])]));
  return typeof v;
}

test('R5 — textes longs : un fichier par langue, mêmes clés (étude cadence, page 404)', async () => {
  // les fichiers de l'étude sont en TypeScript : on compare leurs clés de premier et de second niveau dans le source
  const cles = (f) => {
    const s = readFileSync(join(SRC, 'contenus', 'etude-cadence', f), 'utf8');
    const objet = s.slice(s.indexOf('export const '));
    return [...objet.matchAll(/^ {2,4}(\w+):/gm)].map((m) => m[1]);
  };
  assert.deepEqual(cles('en.ts'), cles('fr.ts'), 'étude cadence : clés des textes');
  const commun = readFileSync(join(SRC, 'contenus', 'etude-cadence', 'commun.ts'), 'utf8');
  assert.match(commun, /export const DESIGN/);
  assert.deepEqual(squelette(PAGE_404.en), squelette(PAGE_404.fr), 'page 404 : mêmes clés');
  assert.deepEqual(PAGE_404.en.pistes.map((p) => p.href), PAGE_404.fr.pistes.map((p) => p.href), 'page 404 : mêmes adresses');
});

test('R6 — module des langues : toute page a son adresse /en/, contrôle vers l’autre langue, langue du contenu', () => {
  assert.equal(adresseEn('/about/'), '/en/about/');
  assert.equal(adresseEn('/'), '/en/');
  assert.deepEqual(autreLangue('/about/'), { langue: 'en', href: '/en/about/' });
  assert.deepEqual(autreLangue('/en/about/'), { langue: 'fr', href: '/about/' });
  assert.deepEqual(autreLangue('/'), { langue: 'en', href: '/en/' });
  assert.deepEqual(autreLangue('/en/'), { langue: 'fr', href: '/' });
  assert.deepEqual(autreLangue('/en/case-studies/cadence/'), { langue: 'fr', href: '/case-studies/cadence/' });
  // depuis la page introuvable : l'accueil de l'autre langue
  assert.deepEqual(autreLangue('/404'), { langue: 'en', href: '/en/' });
  assert.deepEqual(autreLangue('/en/404'), { langue: 'fr', href: '/' });
  assert.ok(est404('/404.html') && est404('/en/404/') && !est404('/404-x/'));
  assert.ok(traduite('/case-studies/cadence/') && traduite('/en/case-studies/cadence/') && !traduite('/en/about/'));
  assert.equal(langueDuContenu('/en/case-studies/cadence/'), 'en');
  assert.equal(langueDuContenu('/en/about/'), 'fr', 'page sans anglais : texte français');
  assert.equal(langueDuContenu('/case-studies/cadence/'), 'fr');
  assert.equal(adresseDePage('index.astro'), '/');
  assert.equal(adresseDePage('../case-studies/cadence.astro'), '/case-studies/cadence/');
  assert.equal(adresseDePage('../about.astro'), '/about/');
  assert.equal(adresseDePage('404.astro'), null);
  assert.equal(adresseDePage('../en/case-studies/cadence.astro'), null);
  assert.equal(adresseDePage('en/[...page].astro'), null);
});
