/**
 * L15 — mise en forme UNIQUE des dates en français (repris d'evatosorus, revue UX L27/L28) :
 * Nouveautés, séparateur « Déjà vu lors de votre visite du … », Plan de travail.
 * Le premier du mois s'écrit « 1er » (« 1er octobre 2026 »), ce que Intl ne fait pas ;
 * l'heure s'écrit à la française, « 20 h 42 » (espaces insécables : courte, elle ne se coupe pas).
 * L81 : une date porte des espaces ORDINAIRES entre ses mots. Entièrement insécable, « 22 novembre
 * 2026 » sortait de l'écran à 320 px texte 200 % (27 à 92 px), ou se coupait au milieu de l'année
 * (« 202|6 ») sous `overflow-wrap: anywhere` ; elle passe maintenant à la ligne entre ses mots, et
 * un nombre ne se coupe jamais (règle `time` de src/styles/global.css).
 * L83 : sauf entre le jour et le mois, qu'une insécable garde ensemble (typographie française : à
 * 375-390 px, « prochaine avant le 22 | décembre 2026 » laissait le jour seul en fin de ligne) ; la
 * date passe à la ligne avant l'année (« 22 décembre | 2026 »). Module pur en .mjs,
 * importable tel quel par node --test (tests/format-date.test.mjs).
 */
const NBSP = ' ';

/** @type {Intl.DateTimeFormatOptions} */
const LONG = { day: 'numeric', month: 'long', year: 'numeric' };

/**
 * Date longue d'un instant dans un fuseau (par défaut celui du navigateur).
 * @param {Date} date @param {string} [timeZone] @returns {string}
 */
export function formatLongDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat('fr-FR', { ...LONG, ...(timeZone ? { timeZone } : {}) }).formatToParts(date);
  // L83 : insécable entre le jour et le mois (« 22 décembre », jamais « 22 | décembre »), espace
  // ordinaire ailleurs : la date passe à la ligne avant l'année.
  return parts
    .map((p, i) => {
      if (p.type === 'day') return p.value === '1' ? '1er' : p.value;
      if (p.type !== 'literal') return p.value;
      const apresJour = parts[i - 1]?.type === 'day' && parts[i + 1]?.type === 'month';
      return p.value.replace(/\s/g, apresJour ? NBSP : ' ');
    })
    .join('');
}

/**
 * Jour calendaire « YYYY-MM-DD » (sans fuseau : midi UTC, jamais la veille).
 * @param {string} day @returns {string}
 */
export function formatDay(day) {
  return formatLongDate(new Date(`${day}T12:00:00Z`), 'UTC');
}

/**
 * L83 — la même date en deux groupes pour un élément `<time>` (composant DateLongue.astro) :
 * « jour mois » et l'année. Le composant met « jour mois » dans une boîte en ligne : les deux mots
 * restent ensemble quand ils tiennent sur la ligne, et ne passent à la ligne entre eux que si, même
 * seuls sur une ligne, ils ne tiennent pas (« 23 NOVEMBRE » en majuscules à chasse fixe dans la carte
 * de /nouveautes à 320 px texte 200 % : 142 px de large) — là où l'insécable sortait du bloc. D'où une
 * espace ORDINAIRE dans `jourMois` : c'est la boîte qui les garde ensemble.
 * @param {string} day « YYYY-MM-DD » @returns {{ jourMois: string, annee: string }}
 */
export function formatDayParts(day) {
  const s = formatDay(day);
  const i = s.lastIndexOf(' ');
  return { jourMois: s.slice(0, i).replaceAll(NBSP, ' '), annee: s.slice(i + 1) };
}

/**
 * Heure « 20 h 42 » (« 8 h 05 ») d'un instant, dans un fuseau (par défaut celui du navigateur).
 * @param {Date} date @param {string} [timeZone] @returns {string}
 */
export function formatTime(date, timeZone) {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    hour: 'numeric', minute: '2-digit', hourCycle: 'h23', ...(timeZone ? { timeZone } : {}),
  }).formatToParts(date);
  const hour = String(Number(parts.find((p) => p.type === 'hour')?.value));
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';
  return `${hour}${NBSP}h${NBSP}${minute}`;
}

/**
 * L8 — date ISO « YYYY-MM-DD » isolée, lue comme une date affichée : ni dans un nom de fichier
 * (`x-2026-10-10.md`), ni dans une option de commande (`--since=2026-09-09`), ni dans un chemin.
 * Partagée avec le test R3 de l8-etudes-structure, qui cherche les dates ISO restées affichées.
 */
export const ISO_DATE_ISOLEE = /(?<![\w/=.-])20\d\d-\d\d-\d\d(?![\w-]|\.\w)/g;

/**
 * L8 — dans un texte libre (description d'outil du catalogue), chaque date ISO « YYYY-MM-DD » isolée
 * devient sa forme longue (« 18 septembre 2026 »). Une date dans un nom de fichier ou une option de
 * commande (`x-2026-10-10.md`, `--since=2026-09-09`) n'est pas touchée.
 * @param {string} text @returns {string}
 */
export function frenchDatesIn(text) {
  return text.replace(ISO_DATE_ISOLEE, (iso) => formatDay(iso));
}
