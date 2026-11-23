/**
 * L87 — typographie française : un jour (« 1er », 1 à 31) suivi d'un nom de mois ne se sépare jamais
 * en fin de ligne (« le 31 | octobre 2026 », mesuré en ligne après L83 sur /nouveautes, /livre-de-bord,
 * /learning). L83 ne protégeait que les dates mises en forme par le code (format-date.mjs) ; les dates
 * écrites dans le texte (markdown des Nouveautés, données, pages) gardaient une espace ordinaire.
 *
 * Une seule transformation, appliquée à la construction à TOUT le HTML rendu (src/middleware.ts) :
 * l'espace (ou la suite d'espaces) entre le jour et le mois devient une insécable U+00A0. Rien d'autre
 * ne change : ni l'espace avant l'année (la date passe à la ligne avant elle), ni un nombre qui n'est
 * pas un jour (« 2026 mai », « 32 mai », « 1,5 mai », « v2 mai »), ni le contenu des <script>, <style>
 * et commentaires. Les attributs sont traités comme le texte : les propriétés d'un îlot Vue
 * (astro-island props) portent ainsi la même insécable que son rendu serveur, sans écart d'hydratation.
 * Module pur en .mjs, importable tel quel par node --test (tests/jour-mois.test.mjs).
 */
const NBSP = ' ';
const MOIS = 'janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre';

/** Jour (« 1er », 1 à 31, « 01 » compris), espaces ordinaires, nom de mois — mots entiers. */
export const JOUR_MOIS = new RegExp(
  `(?<![\\p{L}\\p{N}.,:/_-])(1er|0?[1-9]|[12]\\d|3[01])[ \\t\\r\\n]+(${MOIS})(?![\\p{L}\\p{N}])`,
  'giu',
);

/** Dans un texte : « 22 novembre » → « 22 novembre ». @param {string} text @returns {string} */
export function lierJourMois(text) {
  return text.replace(JOUR_MOIS, (_, jour, mois) => `${jour}${NBSP}${mois}`);
}

/** Parties du HTML laissées telles quelles : scripts, styles, commentaires. */
const INTACT = /<script\b[\s\S]*?<\/script\s*>|<style\b[\s\S]*?<\/style\s*>|<!--[\s\S]*?-->/gi;

/**
 * Dans une page HTML : lierJourMois partout sauf dans les scripts, styles et commentaires.
 * @param {string} html @returns {string}
 */
export function lierJourMoisHtml(html) {
  let out = '';
  let fin = 0;
  for (const m of html.matchAll(INTACT)) {
    out += lierJourMois(html.slice(fin, m.index)) + m[0];
    fin = m.index + m[0].length;
  }
  return out + lierJourMois(html.slice(fin));
}

/** Pour une recherche : insécables (U+00A0, U+202F) lues comme des espaces. @param {string} s */
export function espacesOrdinaires(s) {
  return s.replace(/[  ]/g, ' ');
}
