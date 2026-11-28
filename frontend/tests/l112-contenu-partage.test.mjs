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
import { withViteSsr } from './lib/vite-ssr.mjs';

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

/** Champs d'audit que seul le français porte (vérifiés par l93 sur la version française) : hors comparaison. */
const CHAMPS_FRANCAIS = new Set(['nombres', 'passages']);

/** Squelette d'un jeu de textes : les clés et la forme, sans le texte (fonctions comprises). */
function squelette(v) {
  if (Array.isArray(v)) return v.map(squelette);
  if (typeof v === 'function') return 'fn';
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).filter((k) => !CHAMPS_FRANCAIS.has(k)).sort().map((k) => [k, squelette(v[k])]));
  }
  return typeof v;
}

/** Chemins des feuilles où deux squelettes diffèrent (clé absente d'un côté, forme ou longueur différente). */
function ecarts(a, b, chemin = '') {
  if (a === b) return [];
  if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
    const cles = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    return cles.flatMap((k) => (k in a && k in b ? ecarts(a[k], b[k], `${chemin}.${k}`) : [`${chemin}.${k} : ${k in a ? 'absent en anglais' : 'absent en français'}`]));
  }
  return [`${chemin} : ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`];
}

test('R5 — textes longs : un fichier par langue, mêmes clés à tous les niveaux (étude cadence, page 404)', async () => {
  // L112 (revue de code) : les textes de l'étude sont chargés tels que la page les reçoit (fr.ts, en.ts et leurs
  // fichiers -parcours / -histoire), puis comparés clé par clé à toute profondeur, longueur des listes comprise.
  const { FR, EN } = await withViteSsr([], async (charger) => ({
    FR: (await charger('/src/contenus/etude-cadence/fr.ts')).FR,
    EN: (await charger('/src/contenus/etude-cadence/en.ts')).EN,
  }));
  assert.ok(FR.donnees.pieces.length > 0 && FR.donnees.v2Decisions.length > 0, 'textes de l’étude chargés');
  assert.deepEqual(ecarts(squelette(FR), squelette(EN)), [], 'étude cadence : clés des textes');
  const commun = readFileSync(join(SRC, 'contenus', 'etude-cadence', 'commun.ts'), 'utf8');
  assert.match(commun, /export const DESIGN/);
  // en.ts se conforme au type du français (satisfies), sans conversion qui ferait taire tsc
  const en = readFileSync(join(SRC, 'contenus', 'etude-cadence', 'en.ts'), 'utf8');
  assert.match(en, /\} satisfies ContenuEtudeCadence;\s*$/);
  assert.doesNotMatch(en, /as unknown as/);
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

test('R7 — enveloppes sous src/pages/en/ et TRADUITES se répondent, dans les deux sens', () => {
  // L112 (revue de code, constat 3) : une enveloppe anglaise sans son adresse dans TRADUITES entrerait en
  // collision avec la route générale et garderait le bandeau « Not translated yet » ; une adresse listée sans
  // enveloppe n'aurait plus de page anglaise (la route générale l'écarte).
  const enveloppes = fichiers(EN_DIR).map((f) => relative(EN_DIR, f)).map(adresseDePage).filter(Boolean).sort();
  assert.deepEqual(enveloppes.filter((a) => !TRADUITES.includes(a)), [], 'enveloppe anglaise absente de TRADUITES');
  assert.deepEqual(TRADUITES.filter((a) => !enveloppes.includes(a)), [], 'adresse de TRADUITES sans enveloppe sous src/pages/en/');
  assert.deepEqual(enveloppes, [...TRADUITES].sort());
});

test('R8 — bords du module des langues : page introuvable, requête et ancre', () => {
  // la 404 a son texte anglais : sous /en/ son contenu est anglais, en français ailleurs
  for (const a of ['/en/404/', '/en/404', '/en/404.html']) assert.equal(langueDuContenu(a), 'en', a);
  for (const a of ['/404/', '/404.html']) assert.equal(langueDuContenu(a), 'fr', a);
  // requête et ancre : gardées d'une langue à l'autre, la barre finale reste sur le chemin
  assert.deepEqual(autreLangue('/about/#credits'), { langue: 'en', href: '/en/about/#credits' });
  assert.deepEqual(autreLangue('/about#credits'), { langue: 'en', href: '/en/about/#credits' });
  assert.deepEqual(autreLangue('/en/about/?tri=date'), { langue: 'fr', href: '/about/?tri=date' });
  assert.deepEqual(autreLangue('/en/?x=1#haut'), { langue: 'fr', href: '/?x=1#haut' });
  assert.deepEqual(autreLangue('/404?x=1'), { langue: 'en', href: '/en/' });
  assert.equal(adresseEn('/case-studies/cadence/#le-probleme-de-la-v1'), '/en/case-studies/cadence/#le-probleme-de-la-v1');
  assert.ok(traduite('/en/case-studies/cadence/?a=1#x'), 'page traduite reconnue malgré la requête');
  assert.equal(langueDuContenu('/en/case-studies/cadence/#x'), 'en');
  assert.equal(langueDuContenu('/en/about/?a=1'), 'fr');
  assert.ok(!est404('/404-x/?a') && est404('/en/404/#x'));
});
