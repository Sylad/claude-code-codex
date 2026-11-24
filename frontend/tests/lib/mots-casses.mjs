// L88 (WCAG 1.4.10, revue UX de L87) — mots coupés au milieu SANS trait d'union. Fonction évaluée DANS la
// page : page.evaluate(motsCasses). Parcourt tout le texte visible de <body> (hors code, pre, svg, éléments
// masqués) et renvoie chaque mot dont les lettres tombent sur plusieurs lignes ailleurs qu'à une coupure
// légitime :
//   - après un trait d'union écrit (le mot est mesuré morceau par morceau entre traits d'union) ;
//   - après une césure conditionnelle écrite (U+00AD) ;
//   - à un point de césure du dictionnaire, si l'élément est en `hyphens: auto` : le navigateur y dessine
//     alors un trait. Les points de césure sont relevés par une sonde (le mot seul, même langue, même casse,
//     `overflow-wrap: normal` : sans coupure d'urgence permise, elle ne coupe qu'à un point de césure) dont
//     on balaie la largeur : à chaque largeur le navigateur coupe au dernier point qui tient. Le dictionnaire
//     est donc celui que le navigateur emploie dans la page. Après une coupure, Chromium recalcule la césure
//     du reste du mot comme d'un mot neuf : chaque coupure suivante est jugée sur ce reste.
// Un bloc qui contient autre chose que des lettres, chiffres, apostrophes et traits d'union (chemin, URL,
// « a/b »), ou un identifiant (camelCase « PersistentVolumeClaim », lettres et chiffres mêlés « warhammer40k »)
// n'est pas un mot : un trait de césure le fausserait, sa coupure reste le prix voulu contre le défilement.
export function motsCasses() {
  const LETTRES = /[\p{L}\p{M}\p{N}\u00AD]+/gu;
  const MOT = /^[\p{L}\p{M}\p{N}\u00AD'’\-‐–—]+$/u;
  const IDENTIFIANT = /\p{Ll}\p{Lu}|\p{L}\p{N}|\p{N}\p{L}/u;
  const BORD = /^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu;
  const sonde = document.createElement('div');
  sonde.setAttribute('aria-hidden', 'true');
  sonde.style.cssText = 'position:absolute;left:0;top:0;width:auto;visibility:hidden;hyphens:auto;-webkit-hyphens:auto;'
    + 'overflow-wrap:normal;word-break:normal;white-space:normal;font-size:16px;letter-spacing:0';
  document.body.append(sonde);
  const range = document.createRange();
  const lignes = (node, debut, fin) => {
    // Indices (relatifs à `debut`) où un caractère passe à une ligne plus bas que le précédent.
    const out = [];
    let haut = null;
    for (let i = debut; i < fin; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      // Dernier rectangle : Chromium rattache parfois le trait de césure qu'il dessine en fin de ligne au
      // caractère qui ouvre la ligne suivante (deux rectangles, le trait d'abord).
      const r = [...range.getClientRects()].filter((x) => x.width > 0.1 || x.height > 0).at(-1);
      if (!r) continue;
      if (haut !== null && r.top - haut >= r.height / 2) out.push(i - debut);
      haut = r.top;
    }
    return out;
  };
  const ligneDe = (node, i) => {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    return [...range.getClientRects()].filter((x) => x.width > 0.1 || x.height > 0).at(-1);
  };
  // Premier caractère de la deuxième ligne de la sonde, ou null si elle tient sur une ligne.
  const premiereCoupure = () => {
    const t = sonde.firstChild;
    const r0 = ligneDe(t, 0);
    for (let i = 1; i < t.data.length; i++) {
      const r = ligneDe(t, i);
      if (r && r.top - r0.top >= r0.height / 2) return i;
    }
    return null;
  };
  const cache = new Map();
  const pointsDeCesure = (mot, lang, casse) => {
    const cle = `${lang}|${casse}|${mot}`;
    if (cache.has(cle)) return cache.get(cle);
    sonde.lang = lang;
    sonde.style.textTransform = casse;
    sonde.style.width = 'auto';
    sonde.style.whiteSpace = 'nowrap';
    sonde.textContent = `${mot}-`;
    const t = sonde.firstChild;
    const gauche = [...mot, '-'].map((_, i) => ligneDe(t, i)?.left ?? 0);
    const trait = ligneDe(t, mot.length).width;
    sonde.style.whiteSpace = 'normal';
    sonde.textContent = mot;
    const points = new Set();
    for (let i = mot.length - 1; i >= 1;) {
      sonde.style.width = `${gauche[i] - gauche[0] + trait + 0.5}px`;
      // Le mot entier peut tenir (sa dernière lettre est plus étroite que le trait) : on réduit.
      const b = premiereCoupure();
      if (b !== null) points.add(b);
      i = b === null ? i - 1 : Math.min(i, b) - 1;
    }
    cache.set(cle, points);
    return points;
  };
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('code, pre, script, style, noscript, template, svg, textarea, [aria-hidden="true"]')
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  try {
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el.getClientRects().length) continue;
      range.selectNodeContents(n);
      const tops = new Set([...range.getClientRects()].map((r) => Math.round(r.top)));
      if (tops.size < 2) continue;
      const style = getComputedStyle(el);
      const auto = (style.hyphens || style.webkitHyphens) === 'auto';
      const lang = el.closest('[lang]')?.lang || document.documentElement.lang || '';
      for (const bloc of n.data.matchAll(/\S+/g)) {
        const interieur = bloc[0].replace(BORD, '');
        if (!interieur || !MOT.test(interieur) || IDENTIFIANT.test(interieur)) continue;
        for (const m of bloc[0].matchAll(LETTRES)) {
          if (m[0].replace(/\u00AD/g, '').length < 2) continue;
          const debut = bloc.index + m.index;
          const coupures = lignes(n, debut, debut + m[0].length);
          if (!coupures.length) continue;
          const mauvaises = [];
          let reste = 0;
          for (const i of coupures) {
            const permis = m[0][i - 1] === '\u00AD'
              || (auto && pointsDeCesure(m[0].slice(reste), lang, style.textTransform).has(i - reste));
            if (!permis) mauvaises.push(i);
            reste = i;
          }
          if (!mauvaises.length) continue;
          const vu = [...m[0]].map((c, i) => (mauvaises.includes(i) ? `|${c}` : c)).join('').replace(/\u00AD/g, '');
          out.push(`« ${vu} » (${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${String(el.className).slice(0, 40)})`);
        }
      }
    }
  } finally {
    sonde.remove();
  }
  return out;
}
