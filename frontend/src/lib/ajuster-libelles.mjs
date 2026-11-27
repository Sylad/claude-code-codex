// L110 — les libellés d'un schéma SVG (Schema.astro) tiennent dans leur boîte quelle que soit la police
// réellement chargée. Les coordonnées du dessin sont fixes, mais la largeur d'un texte dépend de la police :
// en Inter, « Qui : cadence ; si rouge, la même session corrige » tient de justesse ; en police de repli
// (Inter bloquée ou pas encore chargée), il débordait de 19 px à 320 px et passait sous le mot de la boucle.
// On mesure donc la largeur RÉELLE de chaque libellé (getComputedTextLength, en unités du dessin) et on la
// compare à sa place : dans une boîte (<rect> qui contient son point d'ancrage), du point d'ancrage au bord
// droit moins la marge de gauche de la boîte ; ailleurs, l'attribut data-sch-place (mot de la boucle). Un libellé
// trop long est resserré à sa place (textLength) ; les autres ne changent pas.

const ancre = (text) => ({ x: text.x.baseVal[0]?.value, y: text.y.baseVal[0]?.value });

/** La plus petite boîte qui contient le point d'ancrage du libellé, ou undefined. */
export function boiteDuLibelle(text, boites) {
  const { x, y } = ancre(text);
  if (x === undefined || y === undefined || text.hasAttribute('transform')) return undefined;
  return boites
    .filter((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h)
    .sort((p, q) => p.w * p.h - q.w * q.h)[0];
}

/**
 * Place disponible (unités du dessin) de chaque libellé qui en a une : Map<text, place>.
 * Dans une boîte, la marge de droite est celle de gauche de la boîte (son libellé le plus à gauche) :
 * une seconde colonne de texte (les commandes du plan) va jusqu'à la même marge.
 */
export function placesDesLibelles(svg) {
  const boites = [...svg.querySelectorAll('rect')].map((r) => ({
    x: r.x.baseVal.value, y: r.y.baseVal.value, w: r.width.baseVal.value, h: r.height.baseVal.value,
  }));
  const textes = [...svg.querySelectorAll('text')].map((t) => ({ t, b: boiteDuLibelle(t, boites), x: ancre(t).x }));
  const places = new Map();
  for (const { t, b, x } of textes) {
    const fixe = t.getAttribute('data-sch-place');
    if (fixe) { places.set(t, Number(fixe)); continue; }
    if (!b) continue;
    const marge = Math.min(...textes.filter((o) => o.b === b).map((o) => o.x)) - b.x;
    places.set(t, b.x + b.w - marge - x);
  }
  return places;
}

export function ajusterLibelles(racine = document) {
  for (const svg of racine.querySelectorAll('figure.schema svg')) {
    // un dessin masqué (sa version en liste est affichée) ne se mesure pas : on y reviendra au prochain appel
    if (!svg.getBoundingClientRect().width) continue;
    for (const [text, place] of placesDesLibelles(svg)) {
      text.removeAttribute('textLength');
      text.removeAttribute('lengthAdjust');
      if (Number.isNaN(place) || place <= 0) continue;
      if (text.getComputedTextLength() > place) {
        text.setAttribute('textLength', String(place));
        text.setAttribute('lengthAdjust', 'spacingAndGlyphs');
        text.dataset.schAjuste = '1';
      } else {
        delete text.dataset.schAjuste;
      }
    }
  }
}

/** Ajuste au chargement, quand une police arrive (Inter après la police de repli) et quand le cadre change. */
export function suivreLibelles() {
  const go = () => ajusterLibelles();
  go();
  document.fonts?.ready.then(go);
  document.fonts?.addEventListener?.('loadingdone', go);
  if ('ResizeObserver' in window) {
    // le dessin réapparaît (liste ↔ dessin) quand la taille du texte ou la largeur changent
    const ro = new ResizeObserver(go);
    for (const f of document.querySelectorAll('figure.schema')) ro.observe(f);
  }
}
