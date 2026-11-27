import type { TestedTool } from "./tools-tested-types";

/**
 * Fiches les plus récentes du catalogue (testées en novembre 2026 après le relevé commun, puis le radar),
 * dans l'ordre d'affichage, à la suite de `testedTools` : séparées pour garder tools-tested.ts sous sa taille gelée.
 */
export const recentTools: TestedTool[] = [
  // ─── 3 outils testés 2026-11-27 (design anti-slop + navigateur pour agents) ─────
  // Étoiles et date de push relevées le jour du test, donc citées dans la description et non dans
  // `stars` / `lastPush`, que la page date du relevé commun (TOOLS_SURVEYED_AT).
  {
    id: "impeccable",
    name: "impeccable",
    author: "pbakaus",
    category: "skill",
    description:
      "« Vocabulaire de design » pour agents et détecteur de pages générées sans soin (« slop ») : 62 règles, sur les sources ou sur une page rendue. Testé 2026-11-27 (v4.11.1, 117,7 k étoiles, Apache 2.0) sans rien installer : seul `npx impeccable@4.11.1 detect` lancé dans un dossier jetable, dossier personnel et cache npm isolés, télémétrie coupée par `DO_NOT_TRACK=1` ; dépôt cloné pour lire ce que l'installeur poserait. Configuration de Claude Code inchangée. L'installation pour Claude Code poserait un skill de 2,4 Mo (24 commandes, une cinquantaine de références), un binaire moteur téléchargé dans le dossier personnel, 5 agents et des hooks SessionStart, PostToolUse (Edit et Write) et Stop sur chaque projet ; télémétrie active par défaut ; son mode `live` peut relancer Claude Code en contournant toutes les permissions, avec l'environnement hérité. Mesuré sur nos fronts : 2 constats sur les sources d'une de nos apps React (police Inter, dont un dans un fichier de test : faux positif), 2 sur les sources de ce site, 2 sur ce site en ligne (police Inter, pastille au-dessus du titre), aucun défaut d'usage ; une app en ligne dont la navigation ne se met jamais au repos échoue après 30 s. La moitié « slop » des règles est du goût (police répandue, palette crème, dégradés), contraire à des revues fondées sur une règle ou une mesure et aux chartes de nos apps ; la moitié « quality » est mesurable (contraste faible, texte minuscule, texte masqué ou qui déborde, titre sauté, longueur de ligne) et déjà couverte en grande partie par axe-core et nos mesures de mise en page. Un hook sur chaque écriture de fichier ajouterait du temps à chaque tâche sans gain mesuré. Verdict : reject + watchlist. Idée gardée, à mesurer avant toute adoption : ses règles de texte masqué ou qui déborde sur la page rendue, contre nos défauts connus de libellés qui se chevauchent. À revoir si cette mesure montre qu'il attrape un chevauchement que nos sondes ratent, ou si le hook s'active règle par règle, sans les règles de goût.",
    tags: ["claude-code", "skill", "design", "anti-slop", "lint", "hooks", "tested"],
    url: "https://github.com/pbakaus/impeccable",
    license: "Apache-2.0",
    status: "tested",
  },
  {
    id: "hallmark",
    name: "hallmark",
    author: "Nutlope",
    category: "skill",
    description:
      "Skill de design « anti-slop » de Together AI pour construire des pages vitrines à partir de 50 thèmes, avec un correcteur statique (`sloplint.mjs`) et un mode avant/après d'une refonte (`--before`, `--kept`). Testé 2026-11-27 (v2.0.0, 61,8 k étoiles, MIT) sans rien installer : dépôt cloné dans un dossier jetable, correcteur lancé en statique sur 4 pages de ce site, puis en mode avant/après sur une copie ; configuration de Claude Code inchangée. L'installation (`npx skills add nutlope/hallmark -g`) poserait un skill global de 7,2 Mo (50 thèmes, 755 photos Wikimedia référencées, agents de revue) ; bon point, son script de hook n'écrit rien, il imprime le hook à coller ; le rendu dans un navigateur demande puppeteer-core installé globalement. Mesuré sur une de nos études de cas : 22 FAIL, 19 REFLEX, 5 WARN, presque tous du goût ou de sa propre convention (jamais de tiret, 450 mots par page au plus, tampon « Hallmark » en tête du CSS, pas d'intertitre en capitales espacées) ; seul constat réel, mineur : 198 apostrophes droites. Une page de documentation est hors de sa cible. Mode avant/après : le retrait d'un lien unique est vu (22 sur 23), le retrait d'un lien dont l'adresse existe ailleurs dans la page passe inaperçu (comparaison par ensemble), et une page inchangée sort en échec à cause des règles de goût. C'est un outil de construction de pages à partir d'un catalogue de styles, contraire à la règle « jamais un style de catalogue sur une app à charte », et il ne lit que du HTML statique sans puppeteer, alors que nos apps sont des SPA. Verdict : skillify. Idée reprise : un inventaire avant/après d'une refonte d'écran (liens, champs, gestionnaires, titres), relevé sur la page rendue par Playwright et comparé par la revue UX, à mesurer sur 5 refontes.",
    tags: ["claude-code", "skill", "design", "anti-slop", "themes", "refactoring", "skillify", "tested"],
    url: "https://github.com/Nutlope/hallmark",
    license: "MIT",
    status: "tested",
  },
  {
    id: "agent-browser",
    name: "agent-browser",
    author: "vercel-labs",
    category: "tool",
    description:
      "CLI Rust qui pilote un navigateur pour les agents : ouvrir une page, instantané de l'arbre d'accessibilité avec des références d'éléments (@e1…), console, erreurs, signaux web (LCP, CLS, TTFB), audit axe-core intégré, diff, enregistrement, branchement sur un Chrome déjà ouvert par CDP, et serveur MCP. Testé 2026-11-27 (v0.45.0, 54,2 k étoiles, Apache 2.0) installé localement dans un dossier jetable (dossier personnel et cache npm isolés) : le postinstall ne fait que lier le binaire natif, téléchargé de la release GitHub s'il manque ; navigateur : le Chromium de Playwright, désigné par `AGENT_BROWSER_EXECUTABLE_PATH`. Un démon par session, aucun resté après `close` ; configuration de Claude Code et dossier personnel inchangés. Ce qui marche : `open` en 5 s, `snapshot -i` (seuls les éléments interactifs : 1,2 Ko sur une page simple, 2,9 Ko sur une de nos études de cas), `console`, `errors`, `vitals`, `a11y` (axe-core 4.12 : 0 violation, 1 contraste à vérifier). Mesuré contre le MCP Playwright : l'instantané complet est aussi lourd que le sien (75 contre 62 Ko, 157 contre 136 Ko sur la page Nouveautés) ; seul `-i` est sobre, mais une revue QA doit lire le texte (états vides, données fausses), donc le gain en jetons reste à prouver sur une vraie revue ; et `vitals` dans un navigateur sans écran ne prouve rien sur les performances. Verdict : reject + watchlist, en attendant une mesure : deux revues QA de la même app, l'une avec agent-browser, l'autre avec le MCP Playwright, adoption seulement avec au moins 30 % de jetons en moins à constats égaux. À revoir si cette mesure donne le gain, ou si le MCP Playwright devient plus sobre.",
    tags: ["claude-code", "browser", "automation", "accessibility", "rust", "cli", "mcp", "tested"],
    url: "https://github.com/vercel-labs/agent-browser",
    license: "Apache-2.0",
    status: "tested",
  },
  {
    id: "treg",
    name: "treg",
    author: "superdesigndev",
    category: "tool",
    description:
      "« OpenRouter des outils d'agent » : un jeton et une adresse pour appeler des milliers de points d'accès payants à l'appel (référencement, réseaux sociaux, recherche de contacts et de sociétés, publicité, génération d'images et de vidéos), plus les clés et CLI de l'équipe servis par le serveur ; plugin Claude Code, serveur MCP et skills de « workflow ». Examiné 2026-11-27 (9,7 k étoiles) sans rien installer : le script d'installation, lu sans l'exécuter, envoie des statistiques d'usage dès l'installation et pose son skill dans chaque agent détecté de la machine ; l'essai demande un compte et un solde prépayé, et les requêtes passent par leurs serveurs. Licence Apache 2.0 avec une clause qui interdit d'en faire un service hébergé. Le catalogue sert le marketing et la prospection, pas le développement. Verdict : reject. Une idée gardée : leur exemple `jev-memory`, un mod de Claude Code (panneau au-dessus du champ de saisie, notification, commande) qui juge chaque phrase après le tour et retient les préférences durables.",
    tags: ["claude-code", "mcp", "marketplace", "paid-api", "tested"],
    url: "https://github.com/superdesigndev/treg",
    stars: 9731,
    lastPush: "2026-11-27",
    license: "proprietary",
    status: "tested",
  },
  {
    id: "openjarvis",
    name: "OpenJarvis",
    author: "open-jarvis (Stanford)",
    category: "framework",
    description:
      "Cadre Python d'agents personnels qui tournent d'abord en local (Ollama, vLLM, llama.cpp…) : huit agents (discussion, recherche avec citations, assistant de code avec shell, veille planifiée, briefing du matin), skills au format agentskills.io, et évaluations qui comptent énergie, latence et coût à côté de la justesse. Testé 2026-11-27 (19,1 k étoiles, Apache 2.0) depuis les sources dans un dossier jetable avec un dossier personnel isolé, branché sur l'Ollama déjà installé : `uv sync`, `jarvis init --no-analytics --preset chat-simple`, puis `jarvis ask` répond en 16 s avec llama3.1:8b ; `jarvis doctor` : 8 contrôles passés, 19 avertissements. Configuration de Claude Code inchangée, rien hors du dossier jetable. Mais c'est une seconde pile d'agents à côté de Claude Code, sans ses hooks ni nos skills, alors que `claude-local` fait déjà tourner Claude Code sur nos modèles locaux. Le paquet embarque aussi un module de minage de cryptomonnaie (« Pearl », portefeuille compris), inactif par défaut, et l'installeur interactif active les statistiques d'usage sur un simple Entrée. Verdict : reject + watchlist, à revoir si un agent local autonome (veille, briefing) devient un besoin hors de Claude Code.",
    tags: ["local-llm", "ollama", "agents", "framework", "python", "tested"],
    url: "https://github.com/open-jarvis/openjarvis",
    stars: 19088,
    lastPush: "2026-11-27",
    license: "Apache-2.0",
    status: "tested",
  },
  {
    id: "omnara",
    name: "Omnara",
    author: "omnara-ai",
    category: "framework",
    description:
      "API open source pour déployer et faire tourner des agents en production (état durable, permissions, intégrations Slack / Discord / GitHub, serveurs MCP), présentée par son éditeur comme l'alternative open source à Claude Managed Agents. Signalée par Human Coders le 12 novembre 2026 ; pas encore passée au banc d'essai.",
    tags: ["agents", "managed-agents", "mcp", "self-hosted"],
    url: "https://github.com/omnara-ai/omnara",
    stars: 3434,
    lastPush: "2026-11-21",
    license: "Apache-2.0",
    status: "browsed",
  },
];
