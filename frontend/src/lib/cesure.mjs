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
//     minuscule et majuscule, entre lettres et chiffres (3 caractères au moins de chaque côté) — pour qu'il
//     se coupe à sa ponctuation et non à une lettre (M3) ; un morceau encore trop large est ensuite traité
//     comme un mot, et un nom que rien ne coupe reçoit un trait à une frontière de syllabe (revue r2, M3-bis) ;
//   - une ponctuation renvoyée seule à la ligne (« , utiliser », « ) », « -- » d'une option) : le mot qui la
//     porte est coupé plus tôt, ou la ponctuation de tête collée au caractère qui suit (revue r2, m-a).
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
// Une borne ne laisse jamais un morceau sans lettre ni chiffre (« / » seul en fin de ligne, « ) » seul en
// début : revue r2, m-a) ; entre lettres et chiffres, au moins 3 caractères de chaque côté dans la suite
// de lettres et de chiffres (« warhammer|40k », jamais « warhammer40|k » : revue r2, M3-bis).
const MIN_CHIFFRES = 3;
export function bornesDeNom(texte) {
  const c = [...texte];
  const out = [];
  let i = 0;
  for (let k = 1; k < c.length; k++) {
    i += c[k - 1].length;
    const a = c[k - 1];
    const b = c[k];
    if (!c.slice(0, k).some((x) => ALNUM.test(x)) || !c.slice(k).some((x) => ALNUM.test(x))) continue;
    if (SIGNE.test(a) && !PAS_APRES.test(a) && (ALNUM.test(b) || /[([{<]/.test(b))) out.push(i);
    else if (/[([{<]/.test(b) && ALNUM.test(a)) out.push(i);
    else if (/\p{Ll}/u.test(a) && /\p{Lu}/u.test(b)) out.push(i);
    else if ((/\p{L}/u.test(a) && /\p{N}/u.test(b)) || (/\p{N}/u.test(a) && /\p{L}/u.test(b))) {
      let g = k;
      while (g > 0 && ALNUM.test(c[g - 1])) g--;
      let d = k;
      while (d < c.length && ALNUM.test(c[d])) d++;
      if (k - g >= MIN_CHIFFRES && d - k >= MIN_CHIFFRES) out.push(i);
    }
  }
  return out;
}

// Frontière de syllabe dans un mot sans dictionnaire (un nom : « postgresql », « modelcontextprotocol »,
// « tokens ») : la coupure p sépare deux syllabes si
//   - voyelle | consonne suivie d'une voyelle ou d'un groupe insécable (« to|kens », « proto|col ») ;
//   - consonne | consonne, sauf au milieu d'un groupe insécable (« con|text », « context|protocol »,
//     « post|gresql », jamais « contextp|rotocol ») ;
// et s'il reste une voyelle de chaque côté. Jamais devant une voyelle (« tok|ens », « prot|ocol »).
const VOYELLE = /[aeiouyàâäéèêëîïôöùûüÿæœ]/iu;
const GROUPE = /^(?:[bcdfgkptv][lr]|[cpst]h|gn|qu)$/iu;
export function frontiereDeSyllabe(mot, p) {
  const a = mot[p - 1];
  const b = mot[p];
  const c = mot[p + 1] ?? '';
  if (!a || !b || !LETTRE.test(a) || !LETTRE.test(b)) return false;
  if (!VOYELLE.test(mot.slice(0, p)) || !VOYELLE.test(mot.slice(p))) return false;
  if (VOYELLE.test(b)) return false;
  // Ce qui ouvre la syllabe de droite : une consonne puis une voyelle, ou un groupe insécable.
  const attaque = VOYELLE.test(c) || (GROUPE.test(b + c) && VOYELLE.test(mot[p + 2] ?? ''));
  if (!attaque) return false;
  return VOYELLE.test(a) || !GROUPE.test(a + b);
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

// Première coupure fautive du bloc [debut, fin), ou -1 :
//   - une ligne ouverte ailleurs qu'à une coupure permise, au milieu des lettres et chiffres du bloc. Une
//     coupure de césure (dictionnaire ou U+00AD) est permise : Chromium y dessine un trait, qu'il rattache à
//     la dernière lettre de la ligne (un second rectangle sur la même ligne) ;
//   - toute coupure, même permise, qui laisse un morceau du bloc sans lettre ni chiffre : « , » ou « ) »
//     seuls en début de ligne, « / » seul en fin de ligne (revue r2, m-a).
function coupeDeForce(range, node, debut, fin) {
  const texte = node.data;
  const lignes = [];
  let haut = null;
  let traitAvant = false;
  for (let i = debut; i < fin; i++) {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const rects = [...range.getClientRects()].filter((x) => x.width > 0.1 || x.height > 0);
    const r = rects.at(-1);
    if (!r) continue;
    if (haut !== null && r.top - haut >= r.height / 2) {
      const permise = traitAvant || APRES_PERMIS.test(texte[i - 1]) || texte[i - 1] === SHY;
      lignes.push({ i, permise });
    }
    haut = r.top;
    traitAvant = rects.length > 1 && Math.abs(rects[0].top - r.top) < r.height / 2;
  }
  const bornes = [debut, ...lignes.map((l) => l.i), fin];
  // Une suite de signes (« »…). ») n'a aucun mot à couper.
  if (!ALNUM.test(texte.slice(debut, fin))) return -1;
  for (let k = 0; k < lignes.length; k++) {
    const { i, permise } = lignes[k];
    if (!permise) return i;
    if (!ALNUM.test(texte.slice(bornes[k], i)) || !ALNUM.test(texte.slice(i, bornes[k + 2]))) return i;
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
  // Ponctuation renvoyée seule à la ligne quand elle est dans le nœud qui suit le mot (« <a>…/evatosorus</a>. »,
  // « <span>comprendre</span>, ») : le mot est coupé « de force » à sa fin (revue r2, m-a).
  for (const p of ponctuationsOrphelines(racine, range)) {
    const deja = out.find((o) => o.node === p.node);
    if (deja) { if (!deja.blocs.some((b) => b.debut === p.bloc.debut)) deja.blocs.push(p.bloc); } else out.push({ node: p.node, blocs: [p.bloc] });
  }
  for (const o of out) o.blocs.sort((a, b) => a.debut - b.debut);
  return out;
}

// Nœuds de texte qui commencent une ligne par de la ponctuation seule (« . », « , », « ). ») collée au mot
// du nœud de texte précédent, lui-même resté sur la ligne d'avant.
function ponctuationsOrphelines(racine, range) {
  const out = [];
  const walker = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(`${EXCLUS}, [data-cesure-copie]`) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let prec = null;
  for (let n = walker.nextNode(); n; prec = n, n = walker.nextNode()) {
    if (!prec || !n.data) continue;
    const tete = /^[^\s\p{L}\p{N}]+(?=\s|$)/u.exec(n.data);
    if (!tete || !prec.data || /\s$/.test(prec.data) || !ALNUM.test(/\S+$/.exec(prec.data)[0])) continue;
    if (prec.parentElement?.closest('[data-cesure-vu]')) continue;
    range.setStart(prec, prec.data.length - 1);
    range.setEnd(prec, prec.data.length);
    const a = [...range.getClientRects()].at(-1);
    range.setStart(n, 0);
    range.setEnd(n, 1);
    const b = [...range.getClientRects()].at(-1);
    if (!a || !b || b.top - a.top < a.height / 2) continue;
    const m = /\S+$/.exec(prec.data);
    out.push({ node: prec, bloc: { debut: m.index, texte: m[0], coupure: prec.data.length } });
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

// Ponctuation de tête renvoyée seule en fin de ligne (« -- | dry-run », « (-- | fork-session ») : elle reste
// collée au caractère qui la suit, dans un <span> insécable (revue r2, m-a).
function colle(texte) {
  const span = document.createElement('span');
  span.setAttribute('data-cesure-colle', '');
  span.textContent = texte;
  return [span];
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

// Où poser la césure de repli : à la frontière de syllabe la plus proche avant la coupure forcée (le trait
// prend la place d'une lettre), avec au moins 3 lettres de chaque côté dans la suite de lettres coupée
// (revue r2, M3-bis : plus de « modelcontextp-rotocol » ni de « tok-ens »). -1 si aucune : le mot reste
// alors à la coupure du navigateur, que la mise en page doit éviter (une colonne assez large).
// Une coupure qui laisse de la ponctuation seule (k au bout de la suite de lettres) se cherche dans la
// suite qui la précède.
function positionDeRepli(texte, k) {
  let d = k;
  while (d > 0 && !LETTRE.test(texte[d - 1]) && !/\s/.test(texte[d - 1])) d--;
  let g = d;
  while (g > 0 && LETTRE.test(texte[g - 1])) g--;
  while (d < texte.length && LETTRE.test(texte[d])) d++;
  if (d - g < 6) return -1;
  const mot = texte.slice(g, d);
  for (let p = Math.min(k - 1, d - 3); p >= g + 3; p--) {
    if (frontiereDeSyllabe(mot, p - g)) return p;
  }
  return -1;
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
      // Une ponctuation seule n'est pas un mot à césurer (aucun nœud n'est touché dans un îlot).
      const ponctuation = !ALNUM.test(node.data.slice(debut, coupure)) || !ALNUM.test(node.data.slice(coupure, debut + texte.length));
      if (motPur && !ponctuation) el.setAttribute('data-cesure', '');
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
    // Ponctuation de tête seule en fin de ligne : collée au caractère qui suit.
    if (coupure < debut + texte.length && !ALNUM.test(node.data.slice(debut, coupure))) {
      const suivant = String.fromCodePoint(node.data.codePointAt(coupure)).length;
      remplacer(node, debut, coupure + suivant, colle);
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
      // La ponctuation qui suit le mot reste dans son <span> : hors de lui, Chromium la renverrait seule à la
      // ligne (« com-|prendre|, utiliser », revue r2, m-a).
      remplacer(node, d, debut + texte.length, enveloppe);
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
