/**
 * L49 — audit de lisibilité du site construit (lecture seule : ne modifie ni source ni dist).
 * Par page : mots, schémas, images, plus long bloc sans intertitre ; puis classement des
 * pages « mur de texte ». Module pur en .mjs (tests/lisibilite.test.mjs), utilisé par
 * scripts/audit-lisibilite.mjs. Analyse du HTML construit par expressions régulières :
 * suffisant pour le HTML qu'Astro génère, sans dépendance de plus.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * blocMax : mots d'un seul tenant sans intertitre à partir desquels on décroche (≈ 2 min de lecture) ;
 * motsLongue : page « longue », qui doit porter au moins un visuel.
 */
export const SEUILS = { blocMax: 400, motsLongue: 800 };

const ENTITES = { amp: '&', quot: '"', lt: '<', gt: '>', apos: "'", '#39': "'" };

const texteBrut = (html) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#?\w+);/g, (_, e) => ENTITES[e] ?? ' ');

const compterMots = (html) => texteBrut(html).split(/\s+/).filter((m) => /[\p{L}\p{N}]/u.test(m)).length;

function extraireMain(html) {
  const debut = html.search(/<main[\s>]/);
  if (debut < 0) return '';
  const fin = html.indexOf('</main>', debut);
  return html.slice(debut, fin < 0 ? undefined : fin);
}

/** @returns {{mots:number, schemas:number, images:number, plusLongBloc:number}} */
export function auditPage(html) {
  const main = extraireMain(html);
  const schemas =
    (main.match(/<svg\b[^>]*\brole="img"/g) ?? []).length + (main.match(/\bdata-mermaid\b/g) ?? []).length;
  const images = (main.match(/<img\b[^>]*>/g) ?? []).filter((t) => /\balt="[^"]*\S[^"]*"/.test(t)).length;
  const sansCode = main
    .replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<astro-island\b[^>]*>/g, ' ');
  const blocs = sansCode.split(/<h[1-6]\b[\s\S]*?<\/h[1-6]>/);
  return {
    mots: compterMots(sansCode.replace(/<h([1-6])\b[\s\S]*?<\/h\1>/g, ' ')),
    schemas,
    images,
    plusLongBloc: Math.max(0, ...blocs.map(compterMots)),
  };
}

/** Verdict d'une page mesurée : { mur, raisons, score }. Plus le score est haut, plus la reprise presse. */
export function classer({ mots, schemas, images, plusLongBloc }) {
  const raisons = [];
  if (plusLongBloc >= SEUILS.blocMax) raisons.push('bloc-long');
  if (mots >= SEUILS.motsLongue && schemas + images === 0) raisons.push('sans-visuel');
  return { mur: raisons.length > 0, raisons, score: Math.round(plusLongBloc + mots / (1 + schemas + images)) };
}

function pagesHtml(dossier, relatif = '') {
  return readdirSync(join(dossier, relatif), { withFileTypes: true }).flatMap((e) => {
    const chemin = join(relatif, e.name);
    if (e.isDirectory()) return pagesHtml(dossier, chemin);
    return e.name === 'index.html' ? [chemin] : [];
  });
}

/** Audite toutes les pages `index.html` d'un dossier construit ; murs d'abord, du pire au moins pire. */
export function auditDist(dist) {
  if (!existsSync(dist) || !statSync(dist).isDirectory()) return [];
  return pagesHtml(dist)
    .map((fichier) => {
      const dossier = fichier.slice(0, -'index.html'.length).replaceAll('\\', '/');
      const mesure = auditPage(readFileSync(join(dist, fichier), 'utf8'));
      return { route: `/${dossier}`, ...mesure, ...classer(mesure) };
    })
    .sort((a, b) => Number(b.mur) - Number(a.mur) || b.score - a.score || a.route.localeCompare(b.route));
}

const LIBELLES = { 'bloc-long': `bloc de ${SEUILS.blocMax} mots ou plus sans intertitre`, 'sans-visuel': `${SEUILS.motsLongue} mots ou plus sans schéma ni image` };

/** Rapport Markdown : pages à reprendre (ordre de priorité) puis toutes les pages mesurées. */
export function rapportMarkdown(pages) {
  const murs = pages.filter((p) => p.mur);
  const ligne = (p, rang) =>
    `| ${rang} | \`${p.route}\` | ${p.mots} | ${p.schemas} | ${p.images} | ${p.plusLongBloc} |` +
    (rang === '' ? ` ${p.mur ? 'à reprendre' : 'ok'} |` : ` ${p.raisons.map((r) => LIBELLES[r]).join(' ; ')} |`);
  const entete = (dernier) =>
    `| Rang | Page | Mots | Schémas | Images | Plus long bloc sans intertitre (mots) | ${dernier} |\n|---|---|---|---|---|---|---|`;
  return [
    '## Pages à reprendre (« mur de texte »), par ordre de priorité',
    '',
    murs.length ? `${entete('Motif')}\n${murs.map((p, i) => ligne(p, i + 1)).join('\n')}` : 'Aucune page ne dépasse les seuils.',
    '',
    '## Toutes les pages mesurées',
    '',
    `${entete('État')}\n${pages.map((p) => ligne(p, '')).join('\n')}`,
    '',
  ].join('\n');
}
