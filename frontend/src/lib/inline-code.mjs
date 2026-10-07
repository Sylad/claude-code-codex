// Descriptions de cartes écrites en Markdown léger : `code` → <code>, le reste échappé.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function inlineCodeHtml(text) {
  return text
    .split(/(`[^`]+`)/)
    .map((part) => (/^`[^`]+`$/.test(part) ? `<code>${esc(part.slice(1, -1))}</code>` : esc(part)))
    .join('');
}
