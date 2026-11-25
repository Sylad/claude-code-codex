// Garde des sources (L95, L98, L99) : tailles de police fixées en px sous 12 px, qui ne grandissent pas avec
// la taille de police du navigateur (WCAG 1.4.4). Une autre unité (rem, em, %) n'est pas relevée ; 0 non plus
// (il masque un texte, cf. la copie de césure de global.css).
// Motifs simples, un par forme (la porte d'analyse refuse une regex trop complexe, sonarjs/regex-complexity).

/** Formes où le premier groupe capturé est directement la taille. */
const MOTIFS = [
  // Classe Tailwind `text-[10px]`.
  /text-\[([\d.]+)px\]/g,
  // Propriété CSS ou objet JS sans unité : `fontSize: 10`, `"font-size": "10"`.
  /font-?size["']?\s*:\s*["']?([\d.]+)(?![\w.%]|px)/gi,
  // Propriété CSS ou objet JS en px : `font-size: 10px`, `fontSize: "10px"`.
  /font-?size["']?\s*:\s*["']?([\d.]+)px/gi,
  // L99 — attribut SVG ou HTML `font-size="10"` / `font-size='10px'` (aussi `:font-size="10"` de Vue).
  /font-?size\s*=\s*["']([\d.]+)(?:px)?["']/gi,
  // L99 — attribut JSX / Astro `fontSize={10}` / `font-size={"10px"}`.
  /font-?size\s*=\s*\{\s*["'`]?([\d.]+)(?![\w.%]|px)/gi,
  /font-?size\s*=\s*\{\s*["'`]?([\d.]+)px/gi,
];

// L99 — raccourci `font: [style] [graisse] <taille>[/<interligne>] <famille>` (CSS, ou `ctx.font = "…"` en JS).
// La taille est la première longueur en px qui ne suit pas une barre (sinon c'est l'interligne).
const RACCOURCI = /\bfont\s*[:=]\s*["'`]?([^;{}"'`\n]*)/g;
const TAILLE_DU_RACCOURCI = /(?<![\d./])([\d.]+)px/;

function petite(px) {
  const n = Number(px);
  return n > 0 && n < 12;
}

/** Occurrences d'une taille de police fixée en px sous 12 px dans un texte source : `@<index> <extrait>`. */
export function petitesPolices(texte) {
  const trouves = [];
  for (const re of MOTIFS) {
    for (const m of texte.matchAll(re)) if (petite(m[1])) trouves.push({ index: m.index, extrait: m[0] });
  }
  for (const m of texte.matchAll(RACCOURCI)) {
    const taille = m[1].match(TAILLE_DU_RACCOURCI);
    if (taille && petite(taille[1])) trouves.push({ index: m.index, extrait: m[0].trim() });
  }
  return trouves.sort((a, b) => a.index - b.index).map((t) => `@${t.index} ${t.extrait}`);
}
