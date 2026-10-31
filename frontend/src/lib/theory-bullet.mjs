// Puces de /theory : texte échappé (« <project> » reste visible), `code` → <code>.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CODE_CLASS = 'font-mono text-claude-soft text-[0.9em] px-1 py-0.5 rounded bg-white/5';

export function theoryBulletHtml(text) {
  return esc(text).replace(/`([^`]+)`/g, `<code class="${CODE_CLASS}">$1</code>`);
}
