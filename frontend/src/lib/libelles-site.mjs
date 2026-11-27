/**
 * L111 — libellés de la barre de navigation et du pied de page, une source par langue. La barre
 * (Navbar.vue) et le pied (Footer.astro) n'existent qu'une fois : ils lisent `libelles(langue)`.
 * Les adresses sont les adresses françaises ; `lienDans` les mène à la version anglaise quand elle
 * existe (TRADUITES de langues.mjs), sinon à la page française (le lien porte alors hreflang="fr").
 * Pour L112 (site entier bilingue) : ajouter une page à TRADUITES suffit à faire pointer ses liens
 * de la barre et du pied vers sa version anglaise ; le sélecteur de langue pourra entrer ici.
 * Test : tests/l111-libelles-site.test.mjs (mêmes clés, mêmes adresses dans les deux langues).
 */
import { TRADUITES, avecBarre } from './langues.mjs';

/** Texte d'un compte : vide à zéro, singulier à un, pluriel au-delà. */
function compte(n, un, plusieurs) {
  if (n <= 0) return '';
  return n === 1 ? un : plusieurs;
}

const FR = {
  accueil: 'Claude Code Codex — accueil',
  menuOuvrir: 'Ouvrir le menu',
  menuFermer: 'Fermer le menu',
  /** @param {number} n */
  nonVues: (n) => compte(n, '1 nouveauté non vue', `${n} nouveautés non vues`),
  barre: [
    { href: '/start', label: 'Démarrer' },
    { href: '/atelier-ia', label: 'Atelier IA' },
    { href: '/theory', label: 'Théorie' },
    { href: '/ecosystem', label: 'Écosystème' },
    { href: '/case-studies', label: 'Case studies' },
    {
      id: 'guides',
      label: 'Guides',
      children: [
        { href: '/k8s-for-java-developers', label: 'K8s pour Java' },
        { href: '/argocd-k8s-pour-les-nuls', label: 'ArgoCD pour les nuls' },
        { href: '/cloudflare-pour-les-nuls', label: 'Cloudflare pour les nuls' },
        { href: '/nouveau-projet', label: 'Nouveau projet' },
      ],
    },
    {
      id: 'ressources',
      label: 'Ressources',
      children: [
        { href: '/learning', label: 'Learning' },
        { href: '/videos', label: 'Vidéos' },
      ],
    },
    { href: '/nouveautes', label: 'Nouveautés' },
  ],
  /** Menu du téléphone seulement (sur le bureau : pied de page). */
  telephone: [
    { href: '/plan-de-travail', label: 'Plan de travail' },
    { href: '/about', label: 'À propos' },
  ],
  pied: {
    navSite: 'Le site',
    site: [
      { href: '/nouveautes', label: 'Nouveautés' },
      { href: '/plan-de-travail', label: 'Plan de travail' },
      { href: '/livre-de-bord', label: 'Livre de bord' },
      { href: '/about', label: 'À propos' },
    ],
    resume: "Codex non-officiel sur Claude Code, l'écosystème Anthropic et la collab IA × dev.",
    apprendre: 'Apprendre',
    apprendreLiens: [
      { href: '/theory', label: 'Théorie' },
      { href: '/ecosystem', label: 'Écosystème' },
      { href: '/learning', label: 'Learning' },
      { href: '/videos', label: 'Vidéos' },
    ],
    liens: 'Liens',
    claudeCode: 'Claude Code (Anthropic)',
    depot: 'Repo GitHub',
    nouvelOnglet: 'nouvel onglet',
    mentions: 'codex fan-site, sans affiliation officielle avec Anthropic.',
    vibe: 'vibe coded with',
  },
};

/** @type {typeof FR} */
const EN = {
  accueil: 'Claude Code Codex — home',
  menuOuvrir: 'Open the menu',
  menuFermer: 'Close the menu',
  nonVues: (n) => compte(n, '1 unseen update', `${n} unseen updates`),
  barre: [
    { href: '/start', label: 'Get started' },
    { href: '/atelier-ia', label: 'AI workshop' },
    { href: '/theory', label: 'Theory' },
    { href: '/ecosystem', label: 'Ecosystem' },
    { href: '/case-studies', label: 'Case studies' },
    {
      id: 'guides',
      label: 'Guides',
      children: [
        { href: '/k8s-for-java-developers', label: 'K8s for Java' },
        { href: '/argocd-k8s-pour-les-nuls', label: 'ArgoCD for dummies' },
        { href: '/cloudflare-pour-les-nuls', label: 'Cloudflare for dummies' },
        { href: '/nouveau-projet', label: 'New project' },
      ],
    },
    {
      id: 'ressources',
      label: 'Resources',
      children: [
        { href: '/learning', label: 'Learning' },
        { href: '/videos', label: 'Videos' },
      ],
    },
    { href: '/nouveautes', label: "What's new" },
  ],
  telephone: [
    { href: '/plan-de-travail', label: 'Work plan' },
    { href: '/about', label: 'About' },
  ],
  pied: {
    navSite: 'The site',
    site: [
      { href: '/nouveautes', label: "What's new" },
      { href: '/plan-de-travail', label: 'Work plan' },
      { href: '/livre-de-bord', label: 'Logbook' },
      { href: '/about', label: 'About' },
    ],
    resume: 'An unofficial codex on Claude Code, the Anthropic ecosystem and AI × dev collaboration.',
    apprendre: 'Learn',
    apprendreLiens: [
      { href: '/theory', label: 'Theory' },
      { href: '/ecosystem', label: 'Ecosystem' },
      { href: '/learning', label: 'Learning' },
      { href: '/videos', label: 'Videos' },
    ],
    liens: 'Links',
    claudeCode: 'Claude Code (Anthropic)',
    depot: 'GitHub repository',
    nouvelOnglet: 'new tab',
    mentions: 'codex fan site, not officially affiliated with Anthropic.',
    vibe: 'vibe coded with',
  },
};

export const LIBELLES = { fr: FR, en: EN };

/** @param {string} langue @returns {typeof FR} */
export function libelles(langue) {
  return langue === 'en' ? EN : FR;
}

/**
 * Adresse d'un lien du site dans une langue : la version anglaise quand elle existe, sinon la page
 * française. `langue` du résultat dit la langue de la page visée (pour hreflang).
 * @param {string} href adresse française (sans /en)
 * @param {string} langue langue de la page qui affiche le lien
 * @returns {{ href: string, langue: 'fr'|'en' }}
 */
export function lienDans(href, langue) {
  if (langue === 'en' && TRADUITES.includes(avecBarre(href))) return { href: `/en${avecBarre(href)}`, langue: 'en' };
  return { href, langue: 'fr' };
}
