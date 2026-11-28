/**
 * L108 (D-5) — deux langues sur le site. Le routage est celui d'Astro (i18n de astro.config.mjs) :
 * français par défaut aux URL de toujours, anglais sous /en/. Ce module pur (importé par la mise en page
 * et par node --test) dit, pour une adresse, sa langue, ses deux versions et si la traduction existe.
 * Une page est traduite quand son adresse française figure dans TRADUITES ET que la page /en/ existe :
 * le test tests/l108-langues.test.mjs vérifie que chaque adresse listée a sa page sous src/pages/en/.
 * L112 (D-6, D-7) — tout le site existe sous /en/ : une page traduite y a son texte anglais (une enveloppe
 * de quelques lignes autour de sa mise en page partagée, src/components/pages/) ; une page sans anglais y est
 * servie par src/pages/en/[...page].astro avec son texte français et le bandeau « Not translated yet ».
 * Le contrôle de langue unique est dans la barre du haut (Navbar.vue) : il mène à `autreLangue(adresse)`.
 */

export const LANGUES = /** @type {const} */ (['fr', 'en']);
export const LANGUE_PAR_DEFAUT = 'fr';

/** Adresses françaises (avec barre finale) qui ont leur version anglaise sous /en/. */
export const TRADUITES = ['/case-studies/cadence/'];

/** Nom de chaque langue, écrit dans cette langue (le contrôle de langue se lit des deux côtés). */
export const NOMS = { fr: 'Français', en: 'English' };

/** Code court de chaque langue, affiché dans la barre du bureau (L112). */
export const CODES = { fr: 'FR', en: 'EN' };

/** Sépare le chemin de sa suite « ?requête » ou « #ancre » (gardée telle quelle d'une langue à l'autre). */
function decoupe(adresse) {
  const p = String(adresse || '/');
  const i = p.search(/[?#]/);
  return i < 0 ? [p, ''] : [p.slice(0, i), p.slice(i)];
}

/** Chemin seul, sans requête ni ancre. */
const chemin = (adresse) => decoupe(adresse)[0];

/** Adresse avec barre finale (Astro sert /x/ ; en dev, /x peut arriver sans barre) ; requête et ancre gardées. */
export function avecBarre(pathname) {
  const [c, suite] = decoupe(pathname);
  const p = c || '/';
  const barre = p.endsWith('/') ? '' : '/';
  return `${p}${barre}${suite}`;
}

/** Langue d'une adresse : « en » sous /en/, « fr » partout ailleurs. */
export function langueDe(pathname) {
  return /^\/en(\/|$)/.test(chemin(pathname)) ? 'en' : 'fr';
}

/** Adresse française d'une adresse (retire le préfixe /en). */
export function adresseFr(pathname) {
  const p = avecBarre(pathname);
  return langueDe(p) === 'en' ? p.slice(3) || '/' : p;
}

/** La page « introuvable » (dist/404.html, dist/en/404.html) : servie à n'importe quelle adresse. */
export function est404(pathname) {
  return /^\/404(\.html|\/)?$/.test(chemin(adresseFr(chemin(pathname).replace(/\.html$/, ''))));
}

/** Page dont le texte existe en anglais : listée dans TRADUITES (la 404 a aussi le sien). */
export function traduite(pathname) {
  return TRADUITES.includes(chemin(adresseFr(pathname))) || est404(pathname);
}

/** Adresse anglaise d'une page (toute page en a une depuis L112). */
export function adresseEn(pathname) {
  return `/en${adresseFr(pathname)}`;
}

/**
 * L112 — langue du TEXTE de la page : l'anglais seulement sous /en/ et si la page est traduite. Une page
 * sans anglais servie sous /en/ garde son texte (et ses composants de contenu) en français ; seules la
 * barre, le pied et le bandeau parlent anglais.
 */
export function langueDuContenu(pathname) {
  return langueDe(pathname) === 'en' && traduite(pathname) ? 'en' : 'fr';
}

/**
 * L112 — cible du contrôle de langue de la barre : la même page dans l'autre langue (sous /en/ elle existe
 * toujours, traduite ou avec le bandeau). Depuis la 404, l'accueil de l'autre langue.
 * @returns {{ langue: 'fr'|'en', href: string }}
 */
export function autreLangue(pathname) {
  const langue = langueDe(pathname) === 'en' ? 'fr' : 'en';
  if (est404(pathname)) return { langue, href: langue === 'en' ? '/en/' : '/' };
  return { langue, href: langue === 'en' ? adresseEn(pathname) : adresseFr(pathname) };
}

/**
 * L112 — adresse française d'un fichier de src/pages (chemin relatif, « about.astro », « case-studies/x.astro »,
 * « index.astro ») ; null pour ce qui n'est pas une page simple (404, route dynamique, page sous en/).
 */
export function adresseDePage(fichier) {
  const r = String(fichier).replace(/\\/g, '/').replace(/^(\.\.?\/)+/, '');
  if (!r.endsWith('.astro') || r.includes('[') || r.startsWith('en/')) return null;
  const sans = r.replace(/\.astro$/, '').replace(/(^|\/)index$/, '');
  if (sans === '404') return null;
  return sans ? `/${sans}/` : '/';
}

/**
 * Les versions d'une page.
 * @param {string} pathname adresse de la page affichée
 * @returns {{ langue: 'fr'|'en', fr: string, en: string|null }} `en` vaut null sans traduction
 */
export function versions(pathname) {
  const fr = adresseFr(pathname);
  return { langue: langueDe(pathname), fr, en: TRADUITES.includes(chemin(fr)) ? `/en${fr}` : null };
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
