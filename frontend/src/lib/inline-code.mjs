// Descriptions de cartes écrites en Markdown léger : `code` → <code>, le reste échappé.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Une option (-r, --dry-run) reste d'un seul tenant (inline-block côté page), où qu'elle soit dans le <code> ; le reste peut passer à la ligne.
const codeHtml = (src) => esc(src).replace(/(^|[\s(])(--?[A-Za-z][\w-]*)/g, '$1<span data-opt>$2</span>');

// Code cité (L78) : une PAIRE d'accents graves qui encadre un mot — contenu non vide, sans espace collé
// à l'intérieur des bornes — et sans lettre collée de part et d'autre à l'extérieur. Un accent grave
// seul, ou collé entre deux lettres comme apostrophe (« We`re », « it`s »), reste du texte.
export const CODE_CITE = /(?<!\p{L})`(?=[^`\s])[^`]*[^`\s]`(?!\p{L})/gu;

/** Découpe un texte en parties [texte, code, texte, code…] ; les parties d'indice impair sont du code cité (accents compris). */
export function splitCode(text) {
  const parts = [];
  let i = 0;
  for (const m of String(text).matchAll(CODE_CITE)) {
    parts.push(text.slice(i, m.index), m[0]);
    i = m.index + m[0].length;
  }
  parts.push(String(text).slice(i));
  return parts;
}

export function inlineCodeHtml(text) {
  return splitCode(text)
    .map((part, k) => (k % 2 ? `<code>${codeHtml(part.slice(1, -1))}</code>` : esc(part)))
    .join('');
}
