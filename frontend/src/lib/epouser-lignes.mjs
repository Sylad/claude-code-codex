// L106 — une pastille (`inline-block`, fond et padding) dont le texte passe sur plusieurs lignes garde toute
// la largeur disponible : CSS ne sait pas réduire une boîte à sa ligne la plus longue une fois le texte
// coupé (la largeur « shrink-to-fit » vaut alors la largeur disponible, `width: fit-content` et
// `text-wrap: balance` n'y changent rien). Ce script mesure les lignes réelles et pose la largeur juste :
// bord gauche de la boîte → fin de la ligne la plus longue, plus le padding et la bordure de droite.
//
// Pourquoi une mesure plutôt que `display: inline` + `box-decoration-break: clone` : chaque ligne aurait sa
// propre pastille, dont les fonds semi-transparents se chevauchent quand l'interligne (16 px) est plus
// petit que fond + padding, et la boîte d'une seule ligne changerait de hauteur (le padding vertical d'un
// élément en ligne ne compte pas dans la mise en page). Ici, sur une ligne, rien n'est posé : rendu
// inchangé. Sans JavaScript, la pastille reste à pleine largeur (rendu d'avant, lisible).
//
// Cible : tout élément `[data-epouse]`, qui porte aussi `max-w-full` (sur-titres de l'accueil et de
// PageHero). Recalcul quand la taille de son parent change (fenêtre, taille du texte), après le chargement
// des polices et après chaque navigation interne. Installé AVANT la césure (BaseLayout) : ses rappels passent les premiers dans chaque
// image, et la césure mesure la pastille déjà ajustée. Mesure : tests/l106-pastille-epouse.e2e.test.mjs.

const ESPACE = /\s/;

// Bord droit du dernier glyphe visible le plus à droite, et nombre de lignes.
function lignes(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const hauts = new Set();
  let droite = -Infinity;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    for (let i = 0; i < n.data.length; i++) {
      // Une espace en fin de ligne ne se voit pas : elle ne compte pas.
      if (ESPACE.test(n.data[i])) continue;
      range.setStart(n, i);
      range.setEnd(n, i + 1);
      for (const r of range.getClientRects()) {
        if (r.right > droite) droite = r.right;
        hauts.add(Math.round(r.top));
      }
    }
  }
  return { droite, nombre: hauts.size };
}

export function epouser(el) {
  el.style.width = '';
  const { droite, nombre } = lignes(el);
  if (nombre < 2) return;
  const boite = el.getBoundingClientRect();
  const s = getComputedStyle(el);
  const fin = Number.parseFloat(s.paddingRight) + Number.parseFloat(s.borderRightWidth);
  // Arrondi au pixel supérieur : une largeur trop juste ferait repasser un mot à la ligne.
  const largeur = Math.ceil(droite - boite.left + fin);
  if (largeur >= boite.width) return;
  // En `em` et non en px : quand la taille du texte change, la largeur grandit avec les glyphes (police,
  // interlettrage et padding suivent tous la taille de police) et garde les mêmes lignes. En px, elle
  // était périmée jusqu'au recalcul : la pastille passait un instant sur une ligne de plus, la césure
  // (L88) mesurait ce <body> transitoire et, le <body> revenant à la taille que son ResizeObserver avait
  // déjà signalée, ne recalculait plus. `max-width: 100%` (classe de l'élément) borne la largeur à celle
  // du parent quand le texte grandit plus que la place disponible.
  const em = Number.parseFloat(s.fontSize);
  el.style.width = `${(largeur / em + 0.01).toFixed(3)}em`;
}

export function installerEpouse() {
  let observateur = null;
  const brancher = () => {
    observateur?.disconnect();
    const cibles = [...document.querySelectorAll('[data-epouse]')];
    if (!cibles.length) return;
    // Un élément qui a perdu l'attribut n'est plus ajusté (les témoins des tests le retirent).
    const tout = () => cibles.filter((el) => el.hasAttribute('data-epouse')).forEach(epouser);
    let image = 0;
    // On observe le parent : la largeur posée sur l'élément ne relance pas l'observateur.
    observateur = new ResizeObserver(() => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(tout);
    });
    for (const el of cibles) if (el.parentElement) observateur.observe(el.parentElement);
    tout();
    if (document.fonts?.ready) document.fonts.ready.then(tout);
  };
  document.addEventListener('astro:page-load', brancher);
}
