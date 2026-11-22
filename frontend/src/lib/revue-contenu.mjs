/**
 * L21 — revue régulière du contenu (consigne de Sylvain du 02-10) : chaque page de contenu porte la date
 * de sa dernière revue, son rythme et la date de la prochaine. Une revue en retard se voit sur la page
 * (au build, et dans le navigateur le jour où elle passe en retard sans nouveau build).
 * Module pur (pages Astro et node --test) ; les dates passent par format-date.mjs.
 *
 * À chaque revue : mettre à jour `derniereRevue`, `corrige`, `perimes` et `nonVerifie` de la page,
 * ajouter les actualités sourcées dans `src/data/veille-ecosysteme.mjs`.
 */
import { formatDay } from './format-date.mjs';

/** Rythme de revue : tous les 30 jours (la veille hebdomadaire alimente la revue mensuelle). */
export const RYTHME_JOURS = 30;

const JOUR_MS = 86_400_000;

/** @param {string} day */
function jourValide(day) {
  const ok = typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)
    && new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day;
  if (!ok) throw new Error(`date invalide : ${JSON.stringify(day)} (attendu YYYY-MM-DD, jour existant)`);
  return new Date(`${day}T00:00:00Z`);
}

/** Jour calendaire UTC d'un instant, « YYYY-MM-DD ». @param {Date} d */
const jourDe = (d) => d.toISOString().slice(0, 10);

/**
 * @typedef {{ label: string, href: string }} Source
 * @typedef {{ texte: string, source: Source, releve: string }} Perime
 * @typedef {{ chemin: string, titre: string, derniereRevue: string, corrige: string[], perimes: Perime[], nonVerifie: string[] }} PageRevue
 */

/** @type {Record<string, PageRevue>} */
export const PAGES_REVUES = {
  ecosystem: {
    chemin: '/ecosystem/',
    titre: 'Écosystème',
    derniereRevue: '2026-11-22',
    corrige: [
      'Actualités de Claude Code des versions 2.1.327 à 2.1.330 ajoutées, chacune avec sa date de publication et sa note de version.',
      'Les 24 adresses de source des 42 entrées répondent (contrôle des liens du 22 novembre 2026).',
    ],
    perimes: [],
    nonVerifie: ['Les commandes d’installation n’ont pas été rejouées une à une à cette revue.'],
  },
  theory: {
    chemin: '/theory/',
    titre: 'Théorie',
    derniereRevue: '2026-11-22',
    corrige: [
      'Prompt caching : longueurs minimales et tarifs de lecture remis à jour d’après la documentation Anthropic (Fable 5.2, Mythos 5.2, modèles 5.x à 512 tokens).',
      'Exemple de requête : identifiant de modèle claude-opus-5-5, le modèle que la documentation conseille par défaut.',
    ],
    perimes: [],
    nonVerifie: [
      'La version du renommage de l’outil Task en Agent (v2.1.63) : le journal des versions de Claude Code n’a pas été relu jusque-là.',
    ],
  },
  learning: {
    chemin: '/learning/',
    titre: 'Learning',
    derniereRevue: '2026-11-22',
    corrige: [
      'Nouvelle source francophone : le blog The Bearded Bear (deux articles sur Claude Code les 12 et 15 novembre 2026).',
      'Les 18 adresses (sites et flux) des 13 sources répondent (contrôle des liens du 22 novembre 2026).',
    ],
    perimes: [],
    nonVerifie: ['Le rythme de publication de chaque source n’a pas été mesuré.'],
  },
  videos: {
    chemin: '/videos/',
    titre: 'Vidéos',
    derniereRevue: '2026-11-22',
    corrige: [
      'Chaîne Anthropic : l’adresse @AnthropicAI répondait « page introuvable » ; remplacée par @anthropic-ai, celle que lie anthropic.com.',
    ],
    perimes: [],
    nonVerifie: ['Les vidéos n’ont pas été revisionnées : seul leur lien a été contrôlé.'],
  },
  outils: {
    chemin: '/case-studies/',
    titre: 'Outils testés',
    derniereRevue: '2026-11-22',
    corrige: [
      'Étoiles, licences et dates de dernier push des 31 outils relevées par l’API GitHub le 22 novembre 2026.',
      'ccusage et ccproxy ont changé de dépôt : liens mis à jour.',
      'Omnara ajouté sur le radar (signalé par Human Coders le 12 novembre 2026, pas encore testé).',
    ],
    perimes: [],
    nonVerifie: ['Aucun verdict n’a été refait en bac à sable : les verdicts gardent la date de leur essai.'],
  },
};

/** Jour de la prochaine revue, « YYYY-MM-DD ». @param {string} derniere */
export function prochaineRevue(derniere) {
  return jourDe(new Date(jourValide(derniere).getTime() + RYTHME_JOURS * JOUR_MS));
}

/**
 * État de revue d'une page à un instant donné (le jour UTC de `maintenant`).
 * @param {string} derniere « YYYY-MM-DD »
 * @param {Date} maintenant
 */
export function etatRevue(derniere, maintenant) {
  const prochaine = prochaineRevue(derniere);
  const jour = jourValide(jourDe(maintenant));
  const joursDeRetard = Math.round((jour.getTime() - jourValide(prochaine).getTime()) / JOUR_MS);
  return {
    derniere,
    prochaine,
    derniereLabel: formatDay(derniere),
    prochaineLabel: formatDay(prochaine),
    enRetard: joursDeRetard > 0,
    joursDeRetard: Math.max(0, joursDeRetard),
  };
}

/**
 * Garde du build : chaque page a une date valide qui n'est pas dans le futur.
 * @param {Date} maintenant
 */
export function verifierRevues(maintenant) {
  const aujourdhui = jourDe(maintenant);
  for (const [cle, p] of Object.entries(PAGES_REVUES)) {
    jourValide(p.derniereRevue);
    if (p.derniereRevue > aujourdhui) throw new Error(`revue ${cle} : date dans le futur (${p.derniereRevue} > ${aujourdhui})`);
    for (const x of p.perimes) {
      jourValide(x.releve);
      if (!x.source?.href?.startsWith('https://')) throw new Error(`revue ${cle} : élément périmé sans source`);
    }
  }
}
