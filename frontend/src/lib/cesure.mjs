// L88 (WCAG 1.4.10, revue UX de L87) — césure seulement là où un mot ne tient pas.
//
// La règle globale `overflow-wrap: anywhere` (L8, global.css) évite le défilement latéral à 320 px et texte
// 200 %, mais coupe sans trait le mot plus large que sa ligne (« chang|é », « vérific|ation »). La césure
// française (`hyphens: auto` + `lang="fr"`) coupe ces mots à une syllabe, avec un trait. L'appliquer à tout
// le site changerait aussi le texte au réglage normal (le navigateur coupe alors tout mot de fin de ligne) :
// ce script ne la donne qu'aux éléments dont un mot ne tient pas sur une ligne entière, en posant
// `data-cesure` (global.css : `[data-cesure] { hyphens: auto }`). Au réglage normal, aucun mot ne déborde
// de sa ligne : rien n'est marqué, le rendu ne change pas.
//
// Recalcul à chaque changement de taille du <body> (largeur de fenêtre, taille du texte, contenu filtré
// par un catalogue, <details> ouvert) et après chaque navigation interne (transitions Astro). Attribut
// et non classe : Vue ne réécrit pas un attribut qu'il ne gère pas.
// Mesure : tests/l88-cesure.e2e.test.mjs (tests/lib/mots-casses.mjs).

const EXCLUS = 'code, pre, script, style, noscript, template, svg, textarea, [aria-hidden="true"]';
// Un mot : lettres seulement (traits d'union et apostrophes séparent les mots). Un bloc qui contient
// autre chose (chemin, URL, identifiant, nombre) n'est pas césuré : le couper d'un trait le fausserait.
const MOT = /^[\p{L}\p{M}'’\-‐–—]+$/u;
const BORD = /^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu;
const IDENTIFIANT = /\p{Ll}\p{Lu}/u; // camelCase : un nom de code, pas un mot
const LETTRES = /\p{L}[\p{L}\p{M}]{4,}/gu; // en dessous de 5 lettres, le navigateur ne césure pas

function surPlusieursLignes(rects) {
  let premier = null;
  for (const r of rects) {
    if (r.width <= 0.5) continue;
    if (!premier) premier = r;
    else if (r.top - premier.top >= premier.height / 2) return true;
  }
  return false;
}

// Éléments dont un mot ne tient pas sur une ligne (coupé de force par overflow-wrap).
function elementsATrop(racine, range) {
  const out = new Set();
  const walker = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(EXCLUS) || n.parentElement?.closest('[data-cesure]')
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!LETTRES.test(n.data)) continue;
    LETTRES.lastIndex = 0;
    range.selectNodeContents(n);
    const rects = [...range.getClientRects()];
    if (!surPlusieursLignes(rects)) continue;
    // Largeur de la ligne du texte : un mot plus étroit qu'elle ne peut pas être coupé de force. Borne
    // haute de la largeur d'un mot : une chasse par lettre (cadratin) plus l'interlettrage.
    const largeur = Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left));
    const style = getComputedStyle(n.parentElement);
    const chasse = parseFloat(style.fontSize) + (parseFloat(style.letterSpacing) || 0);
    for (const bloc of n.data.matchAll(/\S+/g)) {
      const interieur = bloc[0].replace(BORD, '');
      if (!MOT.test(interieur) || IDENTIFIANT.test(interieur)) continue;
      for (const m of bloc[0].matchAll(LETTRES)) {
        if (m[0].length * chasse < largeur) continue;
        const debut = bloc.index + m.index;
        range.setStart(n, debut);
        range.setEnd(n, debut + m[0].length);
        if (surPlusieursLignes(range.getClientRects())) {
          out.add(n.parentElement);
          break;
        }
      }
      if (out.has(n.parentElement)) break;
    }
  }
  return out;
}

// Dernier recours : Chromium ne césure pas un mot soudé à son voisin par une espace insécable
// (« 23 novembre », « « influenceurs », « healthcheck — ») — l'insécable de la typographie française
// (L87) l'empêche. Une césure conditionnelle (U+00AD) y reste permise : pour ces seuls mots, encore
// coupés sans trait, on relève les points de césure du navigateur (le mot seul dans une sonde, même
// langue, même casse) et on les pose dans le texte. Jamais dans un îlot Vue (il réécrit son texte) ;
// défait avant chaque nouveau calcul.
const INSECABLE = /[\u00A0\u202F]/;
const SHY = '\u00AD';
const poses = new Map(); // nœud de texte -> [texte d'origine, texte avec césures]

function defairePoses() {
  for (const [n, [origine, pose]] of poses) if (n.data === pose) n.data = origine;
  poses.clear();
}

function ligneDe(range, node, i) {
  range.setStart(node, i);
  range.setEnd(node, i + 1);
  // Dernier rectangle : Chromium rattache parfois le trait qu'il dessine au caractère suivant.
  return [...range.getClientRects()].filter((x) => x.width > 0.1 || x.height > 0).at(-1);
}

// Points de césure d'un mot selon le dictionnaire du navigateur : la sonde (`overflow-wrap: normal`)
// ne coupe qu'à un point de césure, le dernier qui tient dans sa largeur ; on balaie la largeur.
function pointsDeCesure(sonde, mot) {
  const range = document.createRange();
  sonde.style.width = 'auto';
  sonde.style.whiteSpace = 'nowrap';
  sonde.textContent = `${mot}-`;
  const t = sonde.firstChild;
  const gauche = [...mot, '-'].map((_, i) => ligneDe(range, t, i)?.left ?? 0);
  const trait = ligneDe(range, t, mot.length)?.width ?? 0;
  sonde.style.whiteSpace = 'normal';
  sonde.textContent = mot;
  const n = sonde.firstChild;
  const premiereCoupure = () => {
    const r0 = ligneDe(range, n, 0);
    for (let i = 1; i < mot.length; i++) {
      const r = ligneDe(range, n, i);
      if (r && r.top - r0.top >= r0.height / 2) return i;
    }
    return null;
  };
  const points = [];
  for (let i = mot.length - 1; i >= 1;) {
    sonde.style.width = `${gauche[i] - gauche[0] + trait + 0.5}px`;
    // Le mot entier peut tenir (sa dernière lettre est plus étroite que le trait) : on réduit.
    const b = premiereCoupure();
    if (b !== null && !points.includes(b)) points.push(b);
    i = b === null ? i - 1 : Math.min(i, b) - 1;
  }
  return points;
}

function poserCesures(racine, range) {
  let sonde = null;
  const walker = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest('[data-cesure]') && !n.parentElement.closest(`${EXCLUS}, astro-island`)
      && INSECABLE.test(n.data) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  const noeuds = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) noeuds.push(n);
  for (const n of noeuds) {
    const aPoser = [];
    // Unités soudées par une insécable : séparées seulement par les espaces ordinaires.
    for (const unite of n.data.matchAll(/[^ \t\n\r\f]+/g)) {
      if (!INSECABLE.test(unite[0])) continue;
      for (const bloc of unite[0].matchAll(/[^\s]+/g)) {
        const interieur = bloc[0].replace(BORD, '');
        if (!MOT.test(interieur) || IDENTIFIANT.test(interieur)) continue;
        for (const m of bloc[0].matchAll(LETTRES)) {
          const debut = unite.index + bloc.index + m.index;
          range.setStart(n, debut);
          range.setEnd(n, debut + m[0].length);
          if (!surPlusieursLignes(range.getClientRects())) continue;
          if (!sonde) {
            sonde = document.createElement('div');
            sonde.setAttribute('aria-hidden', 'true');
            sonde.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;hyphens:auto;'
              + '-webkit-hyphens:auto;overflow-wrap:normal;white-space:normal;font-size:16px';
            document.body.append(sonde);
          }
          sonde.lang = n.parentElement.closest('[lang]')?.lang || document.documentElement.lang;
          sonde.style.textTransform = getComputedStyle(n.parentElement).textTransform;
          for (const i of pointsDeCesure(sonde, m[0])) aPoser.push(debut + i);
        }
      }
    }
    if (!aPoser.length) continue;
    const origine = n.data;
    let texte = origine;
    for (const i of aPoser.sort((a, b) => b - a)) texte = texte.slice(0, i) + SHY + texte.slice(i);
    n.data = texte;
    poses.set(n, [origine, texte]);
  }
  sonde?.remove();
}

export function marquerCesures(racine = document.body) {
  defairePoses();
  for (const el of racine.querySelectorAll('[data-cesure]')) el.removeAttribute('data-cesure');
  const range = document.createRange();
  // Une césure change les lignes de son élément, et parfois la largeur d'une colonne voisine : on
  // recommence tant qu'un nouveau mot coupé apparaît (borné).
  for (let passe = 0; passe < 3; passe++) {
    const nouveaux = elementsATrop(racine, range);
    if (!nouveaux.size) break;
    for (const el of nouveaux) el.setAttribute('data-cesure', '');
  }
  poserCesures(racine, range);
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
