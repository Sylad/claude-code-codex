// L88 (WCAG 1.4.10, revue UX de L87) — un mot qui ne tient pas sur sa ligne se coupe avec un trait d'union,
// ou à sa ponctuation si c'est un nom ; les autres mots ne sont jamais coupés.
//
// La règle globale `overflow-wrap: anywhere` (L8, global.css) évite le défilement latéral à 320 px et texte
// 200 %, mais coupe sans trait le mot plus large que sa ligne (« chang|é », « vérific|ation »). Ce script
// repère ces seuls mots (coupés ailleurs qu'après un trait d'union écrit) et :
//   - un mot (lettres, apostrophes, traits d'union) : il l'enveloppe dans un <span data-cesure>, seul en
//     `hyphens: auto` (global.css, avec au moins 3 lettres de chaque côté de la coupure) ; ses voisins qui
//     tiennent ne sont jamais césurés (revue r1 de L88, M1) ;
//   - un nom ou un identifiant (« alexgreensh/token-optimizer », « (NousResearch) », « postInitSQL »,
//     « warhammer40k ») : il y pose des <wbr> à ses bornes naturelles — après / _ . , avant « ( », entre
//     minuscule et majuscule, entre lettres et chiffres — pour qu'il se coupe à sa ponctuation et non à une
//     lettre (M3) ; un morceau encore trop large est ensuite traité comme un mot.
// Rien n'est écrit dans le texte (aucun U+00AD) : le texte copié et le nom accessible restent ceux de la
// page (m1). Dans un îlot Vue, qui réécrit son DOM, on ne touche pas aux nœuds : l'élément reçoit
// l'attribut data-cesure (Vue ne réécrit pas un attribut qu'il ne gère pas).
// Au réglage normal, aucun mot ne déborde : rien n'est posé, le rendu ne change pas.
//
// Recalcul à chaque changement de taille du <body> (largeur de fenêtre, taille du texte, contenu filtré
// par un catalogue, <details> ouvert) et après chaque navigation interne (transitions Astro) ; tout ce qui
// a été posé est défait avant chaque calcul.
// Mesure : tests/l88-cesure.e2e.test.mjs (oracle indépendant : tests/lib/coupures.mjs).

const EXCLUS = 'code, pre, kbd, samp, script, style, noscript, template, svg, textarea, [aria-hidden="true"]';
const BORD = /^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu;
// Un mot : lettres seulement (apostrophes et traits d'union compris).
const MOT = /^[\p{L}\p{M}'’\-‐]+$/u;
const CAMEL = /\p{Ll}\p{Lu}/u;
const LETTRE = /[\p{L}\p{M}]/u;
// Une coupure dans une suite de signes (« »…). ») ne coupe aucun mot.
const ALNUM = /[\p{L}\p{N}]/u;
// Coupure déjà permise sans trait de césure : après un trait d'union écrit ou une barre oblique.
const APRES_PERMIS = /[-‐‑/]/u;
const SHY = '­';

// Bornes naturelles d'un nom : indices i (0 < i < longueur) avant lesquels un <wbr> peut se poser —
// après un signe de ponctuation ou un symbole (/ _ . : = → …), sauf une apostrophe, un guillemet ou un signe
// ouvrant ; avant une parenthèse ou un crochet ouvrant ; entre minuscule et majuscule ; entre lettres et
// chiffres.
const SIGNE = /[\p{P}\p{S}]/u;
const PAS_APRES = /['’«“‘([{<\-‐]/u;
export function bornesDeNom(texte) {
  const c = [...texte];
  const out = [];
  let i = 0;
  for (let k = 1; k < c.length; k++) {
    i += c[k - 1].length;
    const a = c[k - 1];
    const b = c[k];
    if (SIGNE.test(a) && !PAS_APRES.test(a) && (ALNUM.test(b) || /[([{<]/.test(b))) out.push(i);
    else if (/[([{<]/.test(b) && ALNUM.test(a)) out.push(i);
    else if (/\p{Ll}/u.test(a) && /\p{Lu}/u.test(b)) out.push(i);
    else if ((/\p{L}/u.test(a) && /\p{N}/u.test(b)) || (/\p{N}/u.test(a) && /\p{L}/u.test(b))) out.push(i);
  }
  return out;
}

function ligneDe(range, node, i) {
  range.setStart(node, i);
  range.setEnd(node, i + 1);
  // Dernier rectangle : Chromium rattache parfois le trait qu'il dessine au caractère suivant.
  return [...range.getClientRects()].filter((x) => x.width > 0.1 || x.height > 0).at(-1);
}

function surPlusieursLignes(rects) {
  let premier = null;
  for (const r of rects) {
    if (r.width <= 0.5) continue;
    if (!premier) premier = r;
    else if (r.top - premier.top >= premier.height / 2) return true;
  }
  return false;
}

// Premier indice du bloc [debut, fin) qui ouvre une ligne ailleurs qu'à une coupure permise, ou -1. Une
// coupure de césure (dictionnaire ou U+00AD) est permise : Chromium y dessine un trait, qu'il rattache à
// la dernière lettre de la ligne (un second rectangle sur la même ligne).
function coupeDeForce(range, node, debut, fin) {
  let haut = null;
  let traitAvant = false;
  for (let i = debut; i < fin; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const rects = [...range.getClientRects()].filter((x) => x.width > 0.1 || x.height > 0);
    const r = rects.at(-1);
    if (!r) continue;
    if (haut !== null && r.top - haut >= r.height / 2 && !traitAvant && !APRES_PERMIS.test(node.data[i - 1])
      && node.data[i - 1] !== SHY && ALNUM.test(node.data.slice(debut, i)) && ALNUM.test(node.data.slice(i, fin))) return i;
    haut = r.top;
    traitAvant = rects.length > 1 && Math.abs(rects[0].top - r.top) < r.height / 2;
  }
  return -1;
}

// Blocs (suites sans espace) coupés de force, par nœud de texte. Le texte visible d'un mot doublé (repli,
// plus bas) est masqué aux aides techniques mais compte ; sa copie pour elles ne compte pas.
function blocsCoupes(racine, range) {
  const out = [];
  const walker = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const el = n.parentElement;
      if (!el || el.closest('[data-cesure-copie]')) return NodeFilter.FILTER_REJECT;
      if (el.closest('[data-cesure-vu]')) return el.closest('code, pre, kbd, samp') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      return el.closest(EXCLUS) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.data.length < 2) continue;
    range.selectNodeContents(n);
    if (!surPlusieursLignes(range.getClientRects())) continue;
    const blocs = [];
    for (const b of n.data.matchAll(/\S{2,}/g)) {
      range.setStart(n, b.index);
      range.setEnd(n, b.index + b[0].length);
      if (!surPlusieursLignes(range.getClientRects())) continue;
      const k = coupeDeForce(range, n, b.index, b.index + b[0].length);
      if (k >= 0) blocs.push({ debut: b.index, texte: b[0], coupure: k });
    }
    if (blocs.length) out.push({ node: n, blocs });
  }
  return out;
}

// Ce qui a été posé, défait dans l'ordre inverse : le nœud d'origine a été raccourci (`avant`), les nœuds
// ajoutés le suivent. Si Vue (ou autre) a réécrit le nœud entre-temps, on retire seulement nos ajouts.
const poses = [];

function defairePoses() {
  while (poses.length) {
    const { node, origine, avant, ajouts } = poses.pop();
    if (node.isConnected && node.data === avant && ajouts.every((a) => a.isConnected)) node.data = origine;
    for (const a of ajouts) a.remove();
  }
}

// Remplace [debut, fin) du nœud par les nœuds que `fabrique` construit pour ce texte.
function remplacer(node, debut, fin, fabrique) {
  const origine = node.data;
  const ajouts = [...fabrique(origine.slice(debut, fin))];
  if (fin < origine.length) ajouts.push(document.createTextNode(origine.slice(fin)));
  node.after(...ajouts);
  node.data = origine.slice(0, debut);
  poses.push({ node, origine, avant: node.data, ajouts });
}

function enveloppe(texte) {
  const span = document.createElement('span');
  span.setAttribute('data-cesure', '');
  span.textContent = texte;
  return [span];
}

function decoupe(bornes) {
  return (texte) => {
    const out = [];
    let i = 0;
    for (const b of bornes) {
      out.push(document.createTextNode(texte.slice(i, b)), document.createElement('wbr'));
      i = b;
    }
    out.push(document.createTextNode(texte.slice(i)));
    return out;
  };
}

// Repli, pour un mot que ni le dictionnaire ni sa ponctuation ne permettent de couper (un nom : « postgresql »,
// « GEOSERVER ») : une césure conditionnelle (U+00AD) là où il se coupait, dans un double du mot. Le texte
// vu (aria-hidden, non sélectionnable) porte le trait ; une copie sans U+00AD, hors écran, donne le nom
// accessible et le texte copié (revue r1, m1). Une U+00AD dans son propre <span> ne marche pas : Chromium
// renvoie alors le trait seul à la ligne.
function double(position) {
  return (texte) => {
    const vu = document.createElement('span');
    vu.setAttribute('data-cesure-vu', '');
    vu.setAttribute('aria-hidden', 'true');
    vu.textContent = texte.slice(0, position) + SHY + texte.slice(position);
    const copie = document.createElement('span');
    copie.setAttribute('data-cesure-copie', '');
    copie.textContent = texte;
    return [vu, copie];
  };
}

// Où poser la césure de repli : une lettre avant la coupure forcée (le trait prend sa place), avec au
// moins 3 lettres de chaque côté dans la suite de lettres coupée. -1 si la suite en a moins de 6.
function positionDeRepli(texte, k) {
  let g = k;
  while (g > 0 && LETTRE.test(texte[g - 1])) g--;
  let d = k;
  while (d < texte.length && LETTRE.test(texte[d])) d++;
  if (d - g < 6) return -1;
  return Math.min(Math.max(k - 1, g + 3), d - 3);
}

// Dans un conteneur flex ou grid, chaque élément enfant est un élément de la grille : y poser un <span>
// couperait le texte en plusieurs colonnes (« K8s pour | déve-loppeurs | Java » dans un lien inline-flex).
// Le texte entier passe d'abord dans un <span>, qui tient la place de l'élément anonyme qu'il formait.
function horsDeLaGrille(node) {
  const d = getComputedStyle(node.parentElement).display;
  if (!/flex|grid/.test(d)) return node;
  const span = document.createElement('span');
  remplacer(node, 0, node.data.length, (texte) => {
    span.textContent = texte;
    return [span];
  });
  return span.firstChild;
}

// Élision (« d'implémentation », « l'encyclopédie ») : seul le mot qui suit l'apostrophe est césuré, pour
// que ses 3 lettres minimales soient les siennes (« d'im-plémentation » en laissait 2).
const ELISION = /^(\p{L}{1,5}['’])(?=\p{L})/u;

const NOMBRE = /^[\p{N}.,]+$/u;
const INSECABLE = /[   ]/;

function traiter({ node: origine, blocs }) {
  const el = origine.parentElement;
  const ilot = el.closest('astro-island');
  const node = ilot || el.hasAttribute('data-cesure-vu') ? origine : horsDeLaGrille(origine);
  // Du dernier bloc au premier : les positions des blocs précédents restent valables.
  for (const { debut, texte, coupure } of [...blocs].reverse()) {
    const interieur = texte.replace(BORD, '');
    if (!interieur) continue;
    const motPur = MOT.test(interieur) && !CAMEL.test(interieur);
    if (ilot) {
      if (motPur) el.setAttribute('data-cesure', '');
      continue;
    }
    if (el.hasAttribute('data-cesure-vu')) {
      // Mot déjà doublé, encore trop large : une césure de plus dans son texte vu.
      const p = positionDeRepli(node.data, coupure);
      if (p > 0) remplacer(node, p, p, () => [document.createTextNode(SHY)]);
      continue;
    }
    // Un nombre soudé à son voisin par une insécable (« 149 888 ») qui tient seul : il passe entier à la
    // ligne suivante plutôt que d'être coupé entre deux chiffres.
    if (NOMBRE.test(interieur) && INSECABLE.test(node.data[debut - 1] ?? '')) {
      remplacer(node, debut, debut, () => [document.createElement('wbr')]);
      continue;
    }
    let d = debut + texte.indexOf(interieur);
    let mot = interieur;
    const elision = ELISION.exec(mot);
    if (elision) {
      d += elision[1].length;
      mot = mot.slice(elision[1].length);
    }
    const bornes = motPur ? [] : bornesDeNom(texte);
    if (bornes.length) remplacer(node, debut, debut + texte.length, decoupe(bornes));
    else if (!el.hasAttribute('data-cesure') && /\p{L}{6,}/u.test(mot)) {
      remplacer(node, d, d + mot.length, enveloppe);
    } else {
      const p = positionDeRepli(node.data, coupure);
      if (p > 0) {
        let g = p;
        while (g > 0 && !/\s/.test(node.data[g - 1])) g--;
        let f = p;
        while (f < node.data.length && !/\s/.test(node.data[f])) f++;
        remplacer(node, g, f, double(p - g));
      }
    }
  }
}

export function marquerCesures(racine = document.body) {
  defairePoses();
  for (const el of racine.querySelectorAll('[data-cesure]')) el.removeAttribute('data-cesure');
  const range = document.createRange();
  // Un mot césuré change les lignes de son élément (et parfois la largeur d'une colonne voisine) ; un nom
  // découpé à sa ponctuation peut garder un morceau trop large, que le dictionnaire peut ne pas couper : on
  // recommence, borné.
  for (let passe = 0; passe < 6; passe++) {
    const coupes = blocsCoupes(racine, range);
    if (!coupes.length) break;
    for (const c of coupes) traiter(c);
  }
}

export function installerCesure() {
  let observateur = null;
  let image = 0;
  let taille = '';
  const lancer = () => {
    cancelAnimationFrame(image);
    image = requestAnimationFrame(() => {
      marquerCesures(document.body);
      const r = document.body.getBoundingClientRect();
      taille = `${r.width}x${r.height}`;
      // Taille du <body> au dernier calcul : un test sait ainsi que la césure suit la mise en page.
      document.documentElement.dataset.cesureMesure = taille;
    });
  };
  const brancher = () => {
    observateur?.disconnect();
    // Après un échange du <body> (navigation interne), les nœuds posés sur l'ancienne page sont partis.
    poses.length = 0;
    taille = '';
    // Hors du rappel de l'observateur (image suivante) : marquer change la hauteur du <body>, ce qui
    // relancerait l'observateur dans le même cycle (« ResizeObserver loop »).
    observateur = new ResizeObserver(([e]) => {
      const r = e.target.getBoundingClientRect();
      if (`${r.width}x${r.height}` !== taille) lancer();
    });
    observateur.observe(document.body);
    if (document.fonts?.ready) document.fonts.ready.then(lancer);
  };
  document.addEventListener('astro:page-load', brancher);
}
