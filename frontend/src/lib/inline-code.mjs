// Descriptions de cartes écrites en Markdown léger : `code` → <code>, le reste échappé.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Une option (-r, --dry-run) reste d'un seul tenant (inline-block côté page), où qu'elle soit dans le <code> ; le reste peut passer à la ligne.
const codeHtml = (src) => esc(src).replace(/(^|[\s(])(--?[A-Za-z][\w-]*)/g, '$1<span data-opt>$2</span>');

export function inlineCodeHtml(text) {
  return text
    .split(/(`[^`]+`)/)
    .map((part) => (/^`[^`]+`$/.test(part) ? `<code>${codeHtml(part.slice(1, -1))}</code>` : esc(part)))
    .join('');
}
