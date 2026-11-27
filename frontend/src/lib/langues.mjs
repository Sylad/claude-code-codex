/**
 * L108 (D-5) — deux langues sur le site. Le routage est celui d'Astro (i18n de astro.config.mjs) :
 * français par défaut aux URL de toujours, anglais sous /en/. Ce module pur (importé par la mise en page
 * et par node --test) dit, pour une adresse, sa langue, ses deux versions et si la traduction existe.
 * Une page est traduite quand son adresse française figure dans TRADUITES ET que la page /en/ existe :
 * le test tests/l108-langues.test.mjs vérifie que chaque adresse listée a sa page sous src/pages/en/.
 */

export const LANGUES = /** @type {const} */ (['fr', 'en']);
export const LANGUE_PAR_DEFAUT = 'fr';

/** Adresses françaises (avec barre finale) qui ont leur version anglaise sous /en/. */
export const TRADUITES = ['/case-studies/cadence/'];

/** L111 — où mène « No English yet » sur une page sans traduction : une page qui existe en anglais. */
export const ENTREE_EN = '/en/case-studies/cadence/';

/** Nom de chaque langue, écrit dans cette langue (le sélecteur se lit des deux côtés). */
export const NOMS = { fr: 'Français', en: 'English' };

/** Adresse avec barre finale (Astro sert /x/ ; en dev, /x peut arriver sans barre). */
export function avecBarre(pathname) {
  const p = String(pathname || '/');
  return p.endsWith('/') ? p : `${p}/`;
}

/** Langue d'une adresse : « en » sous /en/, « fr » partout ailleurs. */
export function langueDe(pathname) {
  return /^\/en(\/|$)/.test(String(pathname)) ? 'en' : 'fr';
}

/** Adresse française d'une adresse (retire le préfixe /en). */
export function adresseFr(pathname) {
  const p = avecBarre(pathname);
  return langueDe(p) === 'en' ? p.slice(3) || '/' : p;
}

/**
 * Les versions d'une page.
 * @param {string} pathname adresse de la page affichée
 * @returns {{ langue: 'fr'|'en', fr: string, en: string|null }} `en` vaut null sans traduction
 */
export function versions(pathname) {
  const fr = adresseFr(pathname);
  return { langue: langueDe(pathname), fr, en: TRADUITES.includes(fr) ? `/en${fr}` : null };
}

/**
 * Liens hreflang réciproques (absolus) d'une page traduite ; liste vide sinon.
 * @param {string} pathname @param {string|URL} site origine du site
 */
export function alternates(pathname, site) {
  const v = versions(pathname);
  if (!v.en) return [];
  const abs = (p) => new URL(p, site).toString();
  return [
    { hreflang: 'fr', href: abs(v.fr) },
    { hreflang: 'en', href: abs(v.en) },
    { hreflang: 'x-default', href: abs(v.fr) },
  ];
}

const MOIS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Jour « YYYY-MM-DD » écrit en anglais : « November 27, 2026 » (même jour que la version française). */
export function formatDayEn(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(day));
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) throw new Error(`date invalide : ${JSON.stringify(day)}`);
  return `${MOIS_EN[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}
