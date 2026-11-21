// L78 — texte des résumés du fil d'actualités (/learning, LatestNews.astro).
// Les résumés mêlent du HTML brut de flux RSS (`<p>`, `<a>`…) et du texte traduit qui CITE du code
// entre accents graves (« Utilisez `<details><summary>` en HTML ») : seul le premier doit disparaître.
// Ce qui est code cité est défini une fois, dans inline-code.mjs (CODE_CITE), pour le rendu comme ici.

import { CODE_CITE, splitCode } from './inline-code.mjs';

const ENTITES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'" };
const decode = (s) => s.replace(/&(nbsp|amp|lt|gt|quot|#39|apos);/g, (_, e) => ENTITES[e]);

// Une vraie balise : <nom …>, </nom>, ou un commentaire. « a < b » ou « <3 » ne sont pas des balises.
const BALISE = /<!--[\s\S]*?-->|<\/?[A-Za-z][\w-]*(?:\s[^<>]*)?\/?>/g;
// Balise coupée par la troncature du flux, en fin de résumé (« Google <a hre »).
const BALISE_COUPEE = /<\/?(?:[A-Za-z][\w-]*(?:\s[^<>]*)?)?$/;

/**
 * Texte brut d'un résumé de flux : balises HTML retirées, entités décodées, espaces resserrés.
 * Le code cité entre accents graves est gardé tel quel (accents compris, pour le rendu en <code>) ;
 * un <code>…</code> du HTML devient du code entre accents graves.
 */
export function stripHtml(s) {
  const avecCode = String(s ?? '').replace(/<code(?:\s[^<>]*)?>([\s\S]*?)<\/code>/gi, (m, inner, at, src) => {
    const texte = inner.replace(BALISE, '').trim();
    if (texte.includes('`') || !texte) return ` ${texte} `;
    // Une lettre collée au <code> empêcherait la paire d'accents d'être lue comme code cité : on l'écarte d'une espace.
    const avant = /\p{L}/u.test(src[at - 1] ?? '') ? ' ' : '';
    const apres = /\p{L}/u.test(src[at + m.length] ?? '') ? ' ' : '';
    return `${avant}\`${texte}\`${apres}`;
  });
  return splitCode(avecCode)
    .map((part, k) => (k % 2 ? decode(part) : decode(part.replace(BALISE, ' ').replace(BALISE_COUPEE, ' '))))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

const MOTS_EN = new Set(
  'the and of to is are was were in on for with that this it its we our you your they their be been has have from by at as an which will not but or can new how about into what more'.split(' '),
);
const MOTS_FR = new Set(
  'le la les des du de un une et est sont était dans sur pour avec que qui ce cette il elle nous vous ils au aux par pas plus ne se son sa ses leur en où mais ou comment'.split(' '),
);

/**
 * Langue probable d'un texte (WCAG 3.1.2) : 'en' quand les mots outils anglais l'emportent
 * nettement sur les français, sinon 'fr' (la langue de la page). Le code cité est ignoré.
 */
export function guessLang(text) {
  const mots = String(text ?? '')
    .replace(CODE_CITE, ' ')
    .toLowerCase()
    .match(/[a-zàâçéèêëîïôûùüÿœ']+/g) ?? [];
  let en = 0;
  let fr = 0;
  for (const m of mots) {
    if (MOTS_EN.has(m)) en++;
    if (MOTS_FR.has(m)) fr++;
  }
  if (en >= 3 && en > 2 * fr) return 'en';
  // Phrase courte sans aucun mot outil ni lettre accentuée français : anglaise si elle a un mot outil anglais.
  const accent = /[àâçéèêëîïôûùüÿœ]/i.test(text);
  return en >= 1 && fr === 0 && !accent && mots.length >= 4 ? 'en' : 'fr';
}
