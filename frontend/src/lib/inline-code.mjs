// Descriptions de cartes écrites en Markdown léger : `code` → <code>, le reste échappé.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Une option courte (--dry-run) reste d'un seul tenant ; une longue peut passer à la ligne plutôt qu'être coupée.
export function inlineCodeHtml(text) {
  return text
    .split(/(`[^`]+`)/)
    .map((part) => (/^`[^`]+`$/.test(part) ? `<code${/^`--.{1,14}`$/.test(part) ? ' data-opt' : ''}>${esc(part.slice(1, -1))}</code>` : esc(part)))
    .join('');
}
