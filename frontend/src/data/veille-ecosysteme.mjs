/**
 * L21 — actualités de l'écosystème Claude Code retenues par la veille, la plus récente en tête.
 * Chaque entrée est vérifiée sur sa source en ligne : `date` est la date de publication
 * (`nature: 'publie'`) ou, quand la source n'en donne pas, la date du relevé (`nature: 'releve'`).
 * `page` = clé de PAGES_REVUES (src/lib/revue-contenu.mjs) de la page mise à jour.
 * Point de départ : résumé de veille 2026-S47 (Human Coders, Korben, GeoServer), notes de version
 * de Claude Code (API GitHub releases), documentation Anthropic.
 */

/**
 * @typedef {{ date: string, nature: 'publie' | 'releve', titre: string, texte: string,
 *   source: { label: string, href: string }, page: string }} Actualite
 */

/** @type {Actualite[]} */
export const actualites = [
  {
    date: '2026-11-22',
    nature: 'releve',
    titre: 'Claude Fable 5.2 en tête des modèles de la documentation',
    texte: 'La page des modèles range Fable 5.2 (claude-fable-5-2) parmi les derniers modèles, à côté d’Opus 5.5, Sonnet 5.5 et Haiku 5.5, et conseille Opus 5.5 pour la plupart des usages. Ses lectures de cache coûtent 0,025 fois le prix d’entrée.',
    source: { label: 'platform.claude.com — Models overview', href: 'https://platform.claude.com/docs/en/about-claude/models/overview' },
    page: 'theory',
  },
  {
    date: '2026-11-22',
    nature: 'releve',
    titre: 'Sur le radar : Omnara, alternative libre aux Managed Agents',
    texte: 'API sous licence Apache 2.0 pour déployer et faire tourner des agents en production, présentée comme l’alternative open source à Claude Managed Agents. Signalée par Human Coders le 12 novembre 2026 ; pas encore testée.',
    source: { label: 'GitHub — omnara-ai/omnara', href: 'https://github.com/omnara-ai/omnara' },
    page: 'outils',
  },  {
    date: '2026-11-20',
    nature: 'publie',
    titre: 'Claude Code 2.1.330 : graphiques easel et /loop sur 30 jours',
    texte: 'Easel, un mod intégré, dessine des graphiques à la demande et sous les résultats de métriques MCP (désactivable dans /config). Les tâches planifiées récurrentes et /loop tournent jusqu’à 30 jours au lieu de 7, tant que leur session reste ouverte.',
    source: { label: 'GitHub — anthropics/claude-code v2.1.330', href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.330' },
    page: 'ecosystem',
  },
  {
    date: '2026-11-19',
    nature: 'publie',
    titre: 'Claude Code 2.1.329 : /tasks montre tâches planifiées, réveils et fourches',
    texte: '/tasks liste désormais les tâches planifiées de la session, les réveils de /loop, l’objectif et les fourches de la conversation. La boîte de confiance d’un dossier dit où ses hooks sont déclarés.',
    source: { label: 'GitHub — anthropics/claude-code v2.1.329', href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.329' },
    page: 'ecosystem',
  },
  {
    date: '2026-11-19',
    nature: 'publie',
    titre: 'Claude Code 2.1.328 : un hook mcp_tool en échec peut bloquer l’action',
    texte: 'Le réglage "onFailure": "block" s’applique aussi aux hooks mcp_tool, comme aux hooks commande et HTTP : un hook dont l’appel échoue bloque l’action.',
    source: { label: 'GitHub — anthropics/claude-code v2.1.328', href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.328' },
    page: 'ecosystem',
  },
  {
    date: '2026-11-17',
    nature: 'publie',
    titre: 'Claude Code 2.1.327 : claude mcp add-json lit le JSON sur l’entrée standard',
    texte: 'La commande claude mcp add-json <nom> - lit la configuration du serveur sur l’entrée standard, pour garder les jetons hors de la ligne de commande. /status liste les fichiers d’agents, skills et commandes cassés.',
    source: { label: 'GitHub — anthropics/claude-code v2.1.327', href: 'https://github.com/anthropics/claude-code/releases/tag/v2.1.327' },
    page: 'ecosystem',
  },
  {
    date: '2026-11-15',
    nature: 'publie',
    titre: 'Article : ce que coûtent vraiment les sous-agents en quota',
    texte: 'The Bearded Bear montre que sous-agents, équipes d’agents et sessions parallèles puisent dans le même quota : déléguer isole le contexte sans économiser le quota. En français.',
    source: { label: 'The Bearded Bear — Sous-agents Claude Code : leur coût réel en quota', href: 'https://the-bearded-bear.com/blog/sous-agents-claude-code-consommation-quota' },
    page: 'learning',
  },
  {
    date: '2026-11-12',
    nature: 'publie',
    titre: 'Article : un harness planificateur, générateur, évaluateur',
    texte: 'Construire un harness à trois rôles avec les sous-agents de Claude Code, et retirer chaque pièce quand un nouveau modèle n’en a plus besoin. En français.',
    source: { label: 'The Bearded Bear — Harness agentique Claude Code', href: 'https://the-bearded-bear.com/blog/harness-agentique-claude-code-planner-generateur-evaluateur' },
    page: 'learning',
  },

];

/** Garde du build : dates valides, aucune dans le futur, ordre décroissant. @param {Date} maintenant */
export function verifierActualites(maintenant) {
  const aujourdhui = maintenant.toISOString().slice(0, 10);
  let avant = '9999-12-31';
  for (const a of actualites) {
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(a.date) && new Date(`${a.date}T12:00:00Z`).toISOString().slice(0, 10) === a.date;
    if (!ok) throw new Error(`actualité « ${a.titre} » : date invalide ${a.date}`);
    if (a.date > aujourdhui) throw new Error(`actualité « ${a.titre} » : date dans le futur (${a.date})`);
    if (a.date > avant) throw new Error(`actualité « ${a.titre} » : ordre non décroissant`);
    if (!a.source?.href?.startsWith('https://')) throw new Error(`actualité « ${a.titre} » : source absente`);
    avant = a.date;
  }
}
