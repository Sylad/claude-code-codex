/**
 * L38 — fraîcheur des études de cas : une seule date de mise à jour par page, chiffres et captures datés.
 * Module pur (importé par les pages Astro et par node --test) ; les dates passent par format-date.mjs.
 */
import { formatDay } from './format-date.mjs';
import { formatDayEn } from './langues.mjs';

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

/**
 * Date de mise à jour affichée en tête d'une étude (L39 : chaque étude porte la sienne).
 * @param {string} [day] « YYYY-MM-DD » ; DATE_MAJ par défaut (études de L38)
 * @returns {string} « 3 novembre 2026 »
 */
export const dateMajLabel = (day = DATE_MAJ) => jour(day);

/** Mention d'une capture de l'ancienne carte 2D, en anglais (page traduite). */
export const MENTION_CARTE_2D_EN = '2D map, before the globe';

/**
 * L117 — nature d'une image, DÉCLARÉE par qui la pose (jamais devinée du nom de fichier) :
 * `capture` pour une capture d'écran (ou l'image d'un écran, d'un diagramme rendu), `photo` pour une
 * photographie. Le mot de tête de la légende en dépend, dans chaque langue.
 */
export const NATURES = /** @type {const} */ (['capture', 'photo']);
const TETE = {
  fr: { capture: 'Capture du', photo: 'Photo du' },
  en: { capture: 'Screenshot from', photo: 'Photo from' },
};

/**
 * Légende d'une image datée : « Capture du <date> [(carte 2D, avant le globe)] — <description> » pour une
 * capture d'écran, « Photo du <date> — <description> » pour une photo ; sous une page traduite en anglais,
 * « Screenshot from <date> [(2D map, before the globe)] — … » ou « Photo from <date> — … ».
 * `nature` est obligatoire : une image sans nature déclarée fait échouer le build.
 * @param {{date: string, description: string, carte2d?: boolean, nature: 'capture'|'photo', langue?: 'fr'|'en'}} p
 */
export function legendeCapture({ date, description, carte2d, nature, langue = 'fr' }) {
  if (typeof description !== 'string' || !description.trim()) throw new Error('légende : description absente');
  if (!NATURES.includes(nature)) throw new Error(`légende : nature ${JSON.stringify(nature)} (attendu « capture » ou « photo »)`);
  if (!(langue in TETE)) throw new Error(`légende : langue ${JSON.stringify(langue)}`);
  if (nature === 'photo' && carte2d) throw new Error('légende : une photo ne montre pas la carte 2D');
  const en = langue === 'en';
  const fr = jour(date); // valide la date dans les deux langues
  const quand = en ? formatDayEn(date) : fr;
  const mention = carte2d ? ` (${en ? MENTION_CARTE_2D_EN : MENTION_CARTE_2D})` : '';
  return `${TETE[langue][nature]} ${quand}${mention} — ${description.trim()}`;
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

/** Messages d'une capture (ou d'une photo, L117) en cours de chargement et en échec (R6, R7). */
export function messageCapture(nom, nature = 'capture') {
  if (typeof nom !== 'string' || !nom.trim()) throw new Error('capture : nom absent');
  if (!NATURES.includes(nature)) throw new Error(`capture : nature ${JSON.stringify(nature)}`);
  const n = nom.trim();
  const mot = nature === 'photo' ? 'Photo' : 'Capture';
  return {
    chargement: `${mot} « ${n} » en cours de chargement. Elle apparaît dans un instant.`,
    erreur: `${mot} « ${n} » indisponible : le fichier n'a pas pu être chargé. Recharge la page pour la réafficher ; sa description reste lisible dans la légende ci-dessous.`,
  };
}
