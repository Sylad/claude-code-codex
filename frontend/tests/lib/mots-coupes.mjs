// Mots courts coupés sur deux lignes (L8 r2) — fonction évaluée DANS la page (page.evaluate(motsCoupes)).
// Partagée par tests/mots-coupes.e2e.test.mjs et la revue de /videos (L10).
// Dans la page : chaque mot court (≤ 12 lettres ou chiffres) d'un nœud texte de <main> (hors code/pre/script/style, éléments visibles)
// dont les fragments tombent sur plus d'une ligne.
export function motsCoupes() {
  const main = document.querySelector('main');
  if (!main) return [];
  const out = [];
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('code, pre, script, style, svg, [aria-hidden="true"]')
      ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el.getClientRects().length) continue;
    // Un mot = un bloc entre espaces, sans sa ponctuation de bord. Plus de 12 lettres ou chiffres (chemin,
    // URL, identifiant) : sa coupure est le prix voulu contre le défilement. Sinon chaque partie entre
    // traits d'union doit tenir sur une ligne (couper après un trait d'union reste permis).
    for (const bloc of n.data.matchAll(/\S+/g)) {
      if (bloc[0].replace(/[^\p{L}\p{N}]/gu, '').length > 12) continue;
      for (const m of bloc[0].matchAll(/[^-‐–—]+/g)) {
        const debut = bloc.index + m.index;
        if (m[0].replace(/[^\p{L}\p{N}]/gu, '').length === 0 || m[0].length < 2) continue;
        range.setStart(n, debut);
        range.setEnd(n, debut + m[0].length);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0.5);
        const ys = [...new Set(rects.map((r) => Math.round(r.top)))].sort((a, b) => a - b);
        // Fragments sur des lignes distinctes : décalage vertical d'au moins la moitié d'une ligne.
        if (ys.length > 1 && ys.at(-1) - ys[0] >= rects[0].height / 2) {
          out.push(`« ${m[0]} » (${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)})`);
        }
      }
    }
  }
  return out;
}
