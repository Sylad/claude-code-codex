/**
 * L38 — fraîcheur des études de cas : une seule date de mise à jour par page, chiffres et captures datés.
 * Module pur (importé par les pages Astro et par node --test) ; les dates passent par format-date.mjs.
 */
import { formatDay } from './format-date.mjs';

/** Jour de la dernière mise à jour des études touchées par L38 (« YYYY-MM-DD »). */
export const DATE_MAJ = '2026-11-03';

export const MENTION_CARTE_2D = 'carte 2D, avant le globe';

/** @param {string} day @returns {string} */
function jour(day) {
  const ok = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
    && new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day;
  if (!ok) throw new Error(`date invalide : ${JSON.stringify(day)} (attendu YYYY-MM-DD, jour existant)`);
  return formatDay(day);
}

/** @returns {string} « 3 novembre 2026 » */
export const dateMajLabel = () => jour(DATE_MAJ);

/**
 * Légende d'une capture : « Capture du <date> [(carte 2D, avant le globe)] — <description> ».
 * @param {{date: string, description: string, carte2d: boolean}} p
 */
export function legendeCapture({ date, description, carte2d }) {
  if (typeof description !== 'string' || !description.trim()) throw new Error('légende : description absente');
  return `Capture du ${jour(date)}${carte2d ? ` (${MENTION_CARTE_2D})` : ''} — ${description.trim()}`;
}

/**
 * Chiffre repris de l'état réel : valeur + date du relevé + source dans la même phrase. Un entier ≥ 0
 * est un relevé ; tout le reste (absent, NaN, texte…) donne le message « non relevé », jamais une valeur devinée.
 * @param {{valeur: unknown, unite: string, libelleAbsent: string, date: string, source: string, pourquoi?: string}} p
 */
export function chiffreDate({ valeur, unite, libelleAbsent, date, source, pourquoi }) {
  const quand = jour(date);
  if (Number.isInteger(valeur) && valeur >= 0) return `${valeur} ${unite} au ${quand} (${source})`;
  if (typeof pourquoi !== 'string' || !pourquoi.trim()) throw new Error('chiffre non relevé : pourquoi absent');
  return `${libelleAbsent} non relevé au ${quand} : ${pourquoi.trim()}. Il sera ajouté à la prochaine mise à jour.`;
}

/** Messages d'une capture en cours de chargement et en échec (R6, R7). */
export function messageCapture(nom) {
  if (typeof nom !== 'string' || !nom.trim()) throw new Error('capture : nom absent');
  const n = nom.trim();
  return {
    chargement: `Capture « ${n} » en cours de chargement. Elle apparaît dans un instant.`,
    erreur: `Capture « ${n} » indisponible : le fichier n'a pas pu être chargé. Recharge la page pour la réafficher ; sa description reste lisible dans la légende ci-dessous.`,
  };
}
