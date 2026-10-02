/**
 * L15 — mise en forme UNIQUE des dates en français (repris d'evatosorus, revue UX L27/L28) :
 * Nouveautés, séparateur « Déjà vu lors de votre visite du … », Plan de travail.
 * Le premier du mois s'écrit « 1er » (« 1er octobre 2026 »), ce que Intl ne fait pas ;
 * l'heure s'écrit à la française, « 20 h 42 ». Espaces insécables : une date ne se coupe
 * jamais en fin de ligne. Module pur en .mjs, importable tel quel par node --test
 * (tests/format-date.test.mjs).
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
  return parts
    .map((p) => (p.type === 'day' && p.value === '1' ? '1er' : p.type === 'literal' ? p.value.replace(/\s/g, NBSP) : p.value))
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
