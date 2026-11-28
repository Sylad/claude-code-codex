/**
 * L112 — textes de la page « introuvable », une source par langue (src/components/pages/Page404.astro,
 * routes src/pages/404.astro et src/pages/en/404.astro). Les adresses sont françaises : sur la page
 * anglaise, `lienDans` les mène sous /en/.
 */
export const PAGE_404 = {
  fr: {
    title: 'Page introuvable',
    description: 'Cette adresse ne correspond à aucune page du codex Claude Code.',
    eyebrow: 'Erreur 404 · page introuvable',
    titre: "Cette page n'existe pas",
    intro: "L'adresse est peut-être mal tapée, ou la page a changé de nom. Rien n'est cassé de ton côté : repars de l'accueil ou d'une des pages ci-dessous.",
    retour: "Retour à l'accueil",
    ouBien: 'Ou bien',
    pistes: [
      { href: '/start/', label: 'Démarrer', detail: 'Claude Code pour les vrais débutants' },
      { href: '/theory/', label: 'Théorie', detail: 'comment Claude Code fonctionne sous le capot' },
      { href: '/case-studies/', label: 'Études de cas', detail: 'les applications construites avec Claude Code' },
      { href: '/nouveautes/', label: 'Nouveautés', detail: 'ce qui a changé récemment sur le site' },
    ],
  },
  en: {
    title: 'Page not found',
    description: 'This address does not match any page of the Claude Code codex.',
    eyebrow: 'Error 404 · page not found',
    titre: 'This page does not exist',
    intro: 'The address may be mistyped, or the page may have been renamed. Nothing is broken on your side: start again from the home page or from one of the pages below.',
    retour: 'Back to the home page',
    ouBien: 'Or else',
    pistes: [
      { href: '/start/', label: 'Get started', detail: 'Claude Code for real beginners' },
      { href: '/theory/', label: 'Theory', detail: 'how Claude Code works under the hood' },
      { href: '/case-studies/', label: 'Case studies', detail: 'the applications built with Claude Code' },
      { href: '/nouveautes/', label: "What's new", detail: 'what changed recently on the site' },
    ],
  },
};
