/**
 * L35 — « Nouveautés à tester » de /ecosystem : les skills d'anthropics/skills et les serveurs MCP de
 * modelcontextprotocol/servers que la veille hebdomadaire a relevés (src/data/feeds/*.json, écrits par
 * scripts/batch-update.ts) et qui ne sont pas encore au catalogue (src/data/ecosystem.ts).
 * Rien d'inventé : chaque entrée est un élément d'un flux, avec son lien, sa date de relevé (fetchedAt,
 * jour de Paris) et, quand le flux en donne un, un extrait de son résumé — jamais réécrit, seulement
 * débarrassé de l'en-tête YAML ou des titres Markdown qui l'entourent.
 * Dates : « dernier relevé » = dernier passage réussi du batch sur la source (src/data/feeds/
 * derniers-releves.json, écrit par le batch) ; le plus grand fetchedAt ne date que la dernière NOUVEAUTÉ
 * (le batch ne le pose qu'à la première apparition d'un élément) et n'est montré que comme tel.
 * « Au catalogue » : une entrée du catalogue a le même lien source OU le même nom (le plugin
 * frontend-design porte la skill du même nom). Module pur, importable par node --test.
 */
import { jourParis } from './revue-contenu.mjs';

/** Dépôt attendu de chaque flux : un lien qui n'en vient pas fait échouer le build. */
export const FLUX_A_TESTER = {
  'github-anthropics-skills': {
    nature: 'skill',
    libelle: 'Skills',
    depot: { label: 'anthropics/skills', href: 'https://github.com/anthropics/skills' },
  },
  'github-mcp-servers': {
    nature: 'mcp',
    libelle: 'Serveurs MCP',
    depot: { label: 'modelcontextprotocol/servers', href: 'https://github.com/modelcontextprotocol/servers' },
  },
};

/**
 * Chaîne sans ses caractères finaux pris dans `jeu` (boucle plutôt qu'une regex ancrée en fin,
 * dont le retour arrière est quadratique). @param {string} t @param {string} jeu
 */
function sansFin(t, jeu) {
  let n = t.length;
  while (n > 0 && jeu.includes(t[n - 1])) n -= 1;
  return t.slice(0, n);
}

/** Mots-outils fréquents de chaque langue : le texte est comparé, jamais supposé. */
const MOTS_FR = new Set('le la les un une des du de et est sont pour avec quand qui que dans sur au aux ses son sa leur ce cette ces par pas ne plus il elle vous nous lorsque selon'.split(' '));
const MOTS_EN = new Set('the and of to an is are for with when that this these use using from by your you it its which into as be or can will should any all'.split(' '));

/**
 * Langue d'un extrait, déduite de son texte (mots-outils et lettres accentuées du français) :
 * 'fr', 'en', ou '' quand le texte ne permet pas de trancher (attribut lang="" : langue inconnue).
 * @param {string} texte
 * @returns {'fr' | 'en' | ''}
 */
export function langueDuTexte(texte) {
  const t = String(texte ?? '').toLowerCase();
  const mots = t.split(/[^a-zà-ÿœæ]+/u).filter(Boolean);
  // « l'utilisateur », « d'agir » : élisions propres au français (le découpage les a séparées).
  let fr = (t.match(/\b[ldjnstcq]['’][a-zà-ÿ]/gu) ?? []).length + (t.match(/[éèêàçùâîôûœ]/gu) ?? []).length;
  let en = 0;
  for (const m of mots) {
    if (MOTS_FR.has(m)) fr += 1;
    if (MOTS_EN.has(m)) en += 1;
  }
  if (fr === en) return '';
  return fr > en ? 'fr' : 'en';
}

/** Longueur au-delà de laquelle le batch a coupé le résumé (scripts/lib : 140 caractères). */
const RESUME_COUPE = 130;

/** @param {string} texte */
const avecLangue = (texte) => ({ texte, langue: langueDuTexte(texte) });

/**
 * Extrait lisible du résumé d'un flux, ou null s'il n'y a pas de phrase à montrer.
 * @param {string} resume
 * @returns {{ texte: string, langue: 'fr' | 'en' | '' } | null}
 */
export function extraitResume(resume) {
  const brut = String(resume ?? '').trim();
  if (!brut) return null;
  const coupe = brut.length >= RESUME_COUPE;
  const fin = (t) => (coupe && brut.endsWith(t.slice(-12)) ? `${sansFin(t, ' \t\n.,;:')}…` : t);
  // En-tête YAML d'un SKILL.md : la description, sans ses guillemets.
  if (brut.startsWith('---')) {
    const ligne = brut.split('\n').find((l) => /^description:\s*/.test(l));
    if (!ligne) return null;
    const texte = ligne.replace(/^description:\s*/, '').replace(/^["']/, '').replace(/["']$/, '').trim();
    return texte ? avecLangue(fin(texte)) : null;
  }
  // README Markdown : la première ligne de prose (ni titre, ni commentaire, ni lien seul, ni tableau).
  if (/^(#|<!--|\*\*\[)/.test(brut)) {
    const prose = brut.split('\n').map((l) => l.trim()).find((l) => l && !/^(#|<!--|\||\*\*\[|!\[|\[|-|\*)/.test(l));
    return prose ? avecLangue(fin(prose)) : null;
  }
  // Résumé déjà rédigé par le batch, en phrases entières : montré tel quel, sa langue lue dans le texte.
  return avecLangue(brut);
}

/**
 * @typedef {{ id: string, source: string, url: string, title: string, summary?: string, fetchedAt: string }} ElementFlux
 * @typedef {{ name: string, source: string }} EntreeCatalogue
 * @typedef {{ nom: string, lien: string, releve: string, extrait: { texte: string, langue: 'fr' | 'en' | '' } | null }} NouveauteATester
 * @typedef {{ cle: string, nature: string, libelle: string, depot: { label: string, href: string },
 *   releve: string | null, derniereNouveaute: string | null, total: number, auCatalogue: number, aTester: NouveauteATester[] }} FluxATester
 */

const norm = (s) => sansFin(String(s).trim().toLowerCase(), '/');

/** Plus récent relevé d'abord, puis par nom. @param {NouveauteATester} a @param {NouveauteATester} b */
function parRelevePuisNom(a, b) {
  if (a.releve !== b.releve) return a.releve < b.releve ? 1 : -1;
  return a.nom.localeCompare(b.nom);
}

/**
 * Éléments d'un flux absents du catalogue, triés par relevé le plus récent puis par nom.
 * Lève une erreur sur un élément invalide (lien hors du dépôt du flux, nom vide, date illisible) ou sur
 * une date de dernier relevé illisible.
 * @param {string} cle clé de FLUX_A_TESTER
 * @param {ElementFlux[]} elements
 * @param {EntreeCatalogue[]} catalogue
 * @param {Record<string, string>} [releves] dernier passage réussi du batch par source (derniers-releves.json)
 * @returns {FluxATester}
 */
export function fluxATester(cle, elements, catalogue, releves = {}) {
  const flux = FLUX_A_TESTER[cle];
  if (!flux) throw new Error(`nouveautés à tester : flux inconnu « ${cle} »`);
  let releve = null;
  if (releves[cle] !== undefined) {
    const passage = new Date(releves[cle]);
    if (Number.isNaN(passage.getTime())) throw new Error(`nouveautés à tester (${cle}) : date de dernier relevé illisible (${releves[cle]})`);
    releve = jourParis(passage);
  }
  const liens = new Set(catalogue.map((e) => norm(e.source)));
  const noms = new Set(catalogue.map((e) => norm(e.name)));
  let derniereNouveaute = null;
  const aTester = [];
  for (const el of elements) {
    const nom = String(el.title ?? '').trim();
    if (!nom) throw new Error(`nouveautés à tester (${cle}) : élément sans nom`);
    if (!String(el.url).startsWith(`${flux.depot.href}/`)) {
      throw new Error(`nouveautés à tester (${cle}) : « ${nom} » a un lien hors de ${flux.depot.href} (${el.url})`);
    }
    const instant = new Date(el.fetchedAt);
    if (Number.isNaN(instant.getTime())) throw new Error(`nouveautés à tester (${cle}) : « ${nom} » sans date de relevé`);
    const jour = jourParis(instant);
    if (!derniereNouveaute || jour > derniereNouveaute) derniereNouveaute = jour;
    if (liens.has(norm(el.url)) || noms.has(norm(nom))) continue;
    aTester.push({ nom, lien: el.url, releve: jour, extrait: extraitResume(el.summary) });
  }
  aTester.sort(parRelevePuisNom);
  return { cle, ...flux, releve, derniereNouveaute, total: elements.length, auCatalogue: elements.length - aTester.length, aTester };
}

/**
 * Compteur d'un flux, qui dit ce qu'il compte : « 19 skills relevées, 17 déjà au catalogue ».
 * @param {{ nature: string, total: number, auCatalogue: number }} f
 */
export function compteurFlux(f) {
  const skill = f.nature === 'skill';
  const releves = f.total > 1
    ? `${f.total} ${skill ? 'skills relevées' : 'serveurs relevés'}`
    : `${f.total} ${skill ? 'skill relevée' : 'serveur relevé'}`;
  const deja = f.auCatalogue === 0 ? (skill ? 'aucune' : 'aucun') : String(f.auCatalogue);
  return `${releves}, ${deja} déjà au catalogue`;
}
