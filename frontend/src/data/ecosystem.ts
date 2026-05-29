import type { EcosystemEntry } from "./ecosystem-types";

export const ecosystemEntries: EcosystemEntry[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    category: "tool",
    official: true,
    description:
      "Le CLI agentique officiel d'Anthropic — comprend ton codebase, exécute des outils, intègre ton dev env.",
    tags: ["cli", "coding", "agent", "core"],
    install: "npm install -g @anthropic-ai/claude-code",
    source: "https://github.com/anthropics/claude-code",
  },
  {
    id: "claude-agent-sdk-python",
    name: "Claude Agent SDK (Python)",
    category: "tool",
    official: true,
    description:
      "SDK Python pour bâtir des agents sur le même harness qui propulse Claude Code.",
    tags: ["sdk", "python", "agent"],
    install: "pip install claude-agent-sdk",
    source: "https://github.com/anthropics/claude-agent-sdk-python",
  },
  {
    id: "claude-agent-sdk-typescript",
    name: "Claude Agent SDK (TypeScript)",
    category: "tool",
    official: true,
    description:
      "SDK TypeScript/JavaScript pour construire des agents Claude avec tools, sessions et MCP intégré.",
    tags: ["sdk", "typescript", "agent"],
    install: "npm install @anthropic-ai/claude-agent-sdk",
    source: "https://github.com/anthropics/claude-agent-sdk-typescript",
  },
  {
    id: "anthropic-sdk-go",
    name: "Anthropic SDK for Go",
    category: "tool",
    official: true,
    description:
      "Client Go officiel pour l'API Anthropic — messages, tools, streaming.",
    tags: ["sdk", "go", "api"],
    install: "go get github.com/anthropics/anthropic-sdk-go",
    source: "https://github.com/anthropics/anthropic-sdk-go",
  },
  {
    id: "claude-code-action",
    name: "Claude Code GitHub Action",
    category: "tool",
    official: true,
    description:
      "Lancer Claude Code dans GitHub Actions — triage d'issues, review de PR, implementation depuis un commentaire.",
    tags: ["ci", "github", "automation"],
    install: "uses: anthropics/claude-code-action@v1",
    source: "https://github.com/anthropics/claude-code-action",
  },
  {
    id: "modelcontextprotocol-spec",
    name: "Model Context Protocol",
    category: "tool",
    official: true,
    description:
      "Le protocole ouvert qui standardise comment les applis exposent contexte, tools et resources aux LLM.",
    tags: ["protocol", "spec", "core"],
    install: "Voir les SDKs sur modelcontextprotocol.io/docs",
    source: "https://modelcontextprotocol.io",
  },
  {
    id: "claude-cookbooks",
    name: "Claude Cookbooks",
    category: "tool",
    official: true,
    description:
      "Notebooks de patterns efficaces pour Claude — prompt caching, tool use, agents, RAG.",
    tags: ["learning", "examples", "notebooks"],
    install: "git clone https://github.com/anthropics/claude-cookbooks",
    source: "https://github.com/anthropics/claude-cookbooks",
  },
  {
    id: "mcp-server-filesystem",
    name: "MCP Filesystem Server",
    category: "mcp",
    official: true,
    description:
      "Serveur MCP de référence pour read/write/search fichiers avec paths autorisés configurables.",
    tags: ["files", "reference"],
    install:
      "claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /path/to/dir",
    source:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
  },
  {
    id: "mcp-server-fetch",
    name: "MCP Fetch Server",
    category: "mcp",
    official: true,
    description:
      "Fetch + conversion HTML→Markdown pour que le modèle puisse lire des URLs efficacement.",
    tags: ["web", "reference"],
    install: "claude mcp add fetch -- uvx mcp-server-fetch",
    source: "https://github.com/modelcontextprotocol/servers/tree/main/src/fetch",
  },
  {
    id: "mcp-server-git",
    name: "MCP Git Server",
    category: "mcp",
    official: true,
    description:
      "Lit, cherche et manipule des repos Git via tools MCP.",
    tags: ["git", "vcs", "reference"],
    install:
      "claude mcp add git -- uvx mcp-server-git --repository /path/to/repo",
    source: "https://github.com/modelcontextprotocol/servers/tree/main/src/git",
  },
  {
    id: "mcp-server-memory",
    name: "MCP Memory Server",
    category: "mcp",
    official: true,
    description:
      "Mémoire persistante knowledge-graph-based pour agents, à travers les sessions.",
    tags: ["memory", "state", "reference"],
    install: "claude mcp add memory -- npx -y @modelcontextprotocol/server-memory",
    source:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
  },
  {
    id: "mcp-server-sequentialthinking",
    name: "MCP Sequential Thinking",
    category: "mcp",
    official: true,
    description:
      "Tool de raisonnement step-by-step structuré pour problèmes complexes.",
    tags: ["reasoning", "reference"],
    install:
      "claude mcp add seq-think -- npx -y @modelcontextprotocol/server-sequentialthinking",
    source:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking",
  },
  {
    id: "mcp-server-time",
    name: "MCP Time Server",
    category: "mcp",
    official: true,
    description:
      "Utilitaires de temps et conversion timezone exposés en tools MCP.",
    tags: ["time", "utility", "reference"],
    install: "claude mcp add time -- uvx mcp-server-time",
    source: "https://github.com/modelcontextprotocol/servers/tree/main/src/time",
  },
  {
    id: "mcp-server-everything",
    name: "MCP Everything (demo)",
    category: "mcp",
    official: true,
    description:
      "Serveur démo qui expose prompts, resources et tools — utile comme template d'apprentissage.",
    tags: ["demo", "reference", "template"],
    install:
      "claude mcp add everything -- npx -y @modelcontextprotocol/server-everything",
    source:
      "https://github.com/modelcontextprotocol/servers/tree/main/src/everything",
  },
  {
    id: "plugin-code-review",
    name: "code-review",
    category: "plugin",
    official: true,
    description:
      "Slash command pour review de code structurée sur une PR ou des changements locaux.",
    tags: ["coding", "review", "git"],
    install:
      "/plugin marketplace add anthropics/claude-plugins-official && /plugin install code-review@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-review",
  },
  {
    id: "plugin-feature-dev",
    name: "feature-dev",
    category: "plugin",
    official: true,
    description:
      "Workflow guided de développement de feature — compréhension du codebase + focus archi.",
    tags: ["coding", "workflow"],
    install: "/plugin install feature-dev@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/feature-dev",
  },
  {
    id: "plugin-frontend-design",
    name: "frontend-design",
    category: "plugin",
    official: true,
    description:
      "Génère des UIs distinctives, production-grade, en évitant l'esthétique générique IA.",
    tags: ["ui", "frontend", "design"],
    install: "/plugin install frontend-design@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design",
  },
  {
    id: "plugin-pr-review-toolkit",
    name: "pr-review-toolkit",
    category: "plugin",
    official: true,
    description:
      "Bundle d'agents et commandes pour review end-to-end de pull requests.",
    tags: ["git", "review", "ci"],
    install: "/plugin install pr-review-toolkit@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/pr-review-toolkit",
  },
  {
    id: "plugin-claude-code-setup",
    name: "claude-code-setup",
    category: "plugin",
    official: true,
    description:
      "Analyse un codebase et recommande des automatisations Claude Code (hooks, sub-agents, skills, MCP).",
    tags: ["onboarding", "automation"],
    install: "/plugin install claude-code-setup@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-code-setup",
  },
  {
    id: "plugin-skill-creator",
    name: "skill-creator",
    category: "plugin",
    official: true,
    description:
      "Scaffold, édite et évalue des Agent Skills — avec benchmarking et optim de description.",
    tags: ["skills", "authoring"],
    install: "/plugin install skill-creator@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/skill-creator",
  },
  {
    id: "plugin-mcp-server-dev",
    name: "mcp-server-dev",
    category: "plugin",
    official: true,
    description:
      "Workflow dev pour build, debug et test de serveurs MCP.",
    tags: ["mcp", "authoring"],
    install: "/plugin install mcp-server-dev@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/mcp-server-dev",
  },
  {
    id: "plugin-lsp-family",
    name: "LSP plugins (12 langages)",
    category: "plugin",
    official: true,
    description:
      "Famille de plugins Language Server Protocol officiels : intelligence de code (go-to-def, références, diagnostics, rename) directement dans Claude Code. 12 langages — pyright (Python), jdtls (Java), typescript, gopls (Go), rust-analyzer, clangd (C/C++), csharp, kotlin, swift, php, ruby, lua.",
    tags: ["lsp", "code-intelligence", "coding", "2026"],
    install: "/plugin install pyright-lsp@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins",
  },
  {
    id: "plugin-code-simplifier",
    name: "code-simplifier",
    category: "plugin",
    official: true,
    description:
      "Simplifie et raffine le code récemment modifié pour clarté/cohérence/maintenabilité, sans changer le comportement.",
    tags: ["coding", "refactor", "quality"],
    install: "/plugin install code-simplifier@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/code-simplifier",
  },
  {
    id: "plugin-claude-md-management",
    name: "claude-md-management",
    category: "plugin",
    official: true,
    description:
      "Audit + amélioration des fichiers CLAUDE.md d'un repo : scan, évaluation qualité vs templates, updates ciblées. Inclut une commande de révision depuis les learnings de session.",
    tags: ["claude-md", "memory", "docs"],
    install: "/plugin install claude-md-management@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-md-management",
  },
  {
    id: "plugin-security-guidance",
    name: "security-guidance",
    category: "plugin",
    official: true,
    description:
      "Guidance sécurité officielle pour le code généré/édité — bonnes pratiques, garde-fous OWASP. Complément léger du reference harness defending-code (threat-model / vuln-scan / triage / patch).",
    tags: ["security", "owasp", "review"],
    install: "/plugin install security-guidance@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/security-guidance",
  },
  {
    id: "plugin-commit-commands",
    name: "commit-commands",
    category: "plugin",
    official: true,
    description:
      "Slash commands git : créer un commit, commit+push+PR, nettoyer les branches [gone]. Workflow git standardisé.",
    tags: ["git", "commit", "workflow"],
    install: "/plugin install commit-commands@claude-plugins-official",
    source:
      "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/commit-commands",
  },
  {
    id: "skill-pdf",
    name: "pdf",
    category: "skill",
    official: true,
    description:
      "Lit, remplit, édite et crée des PDFs — formulaires, extraction, génération.",
    tags: ["documents", "pdf"],
    install:
      "/plugin marketplace add anthropics/skills (browse document-skills)",
    source: "https://github.com/anthropics/skills/tree/main/skills/pdf",
  },
  {
    id: "skill-xlsx",
    name: "xlsx",
    category: "skill",
    official: true,
    description:
      "Crée et manipule des Excel — formules, formatting, charts.",
    tags: ["documents", "spreadsheet"],
    install: "Disponible via anthropics/skills ou skills Claude.ai",
    source: "https://github.com/anthropics/skills/tree/main/skills/xlsx",
  },
  {
    id: "skill-mcp-builder",
    name: "mcp-builder",
    category: "skill",
    official: true,
    description:
      "Skill guidé pour construire de nouveaux serveurs MCP from scratch.",
    tags: ["mcp", "authoring"],
    install:
      "Clone anthropics/skills/skills/mcp-builder dans ton dossier skills",
    source:
      "https://github.com/anthropics/skills/tree/main/skills/mcp-builder",
  },
  {
    id: "skill-webapp-testing",
    name: "webapp-testing",
    category: "skill",
    official: true,
    description:
      "Tests browser-based d'apps web via flows d'automatisation Playwright-style.",
    tags: ["testing", "browser", "playwright"],
    install:
      "Clone anthropics/skills/skills/webapp-testing dans ton dossier skills",
    source:
      "https://github.com/anthropics/skills/tree/main/skills/webapp-testing",
  },
  {
    id: "skill-docx",
    name: "docx",
    category: "skill",
    official: true,
    description:
      "Créer, lire, éditer, manipuler des documents Word (.docx). Complète pdf + xlsx pour la suite Office.",
    tags: ["office", "docx", "document"],
    install: "Clone anthropics/skills/skills/docx dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/docx",
  },
  {
    id: "skill-pptx",
    name: "pptx",
    category: "skill",
    official: true,
    description:
      "Créer/lire/éditer des présentations PowerPoint (.pptx) — slide decks, pitch decks, templates.",
    tags: ["office", "pptx", "slides"],
    install: "Clone anthropics/skills/skills/pptx dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/pptx",
  },
  {
    id: "skill-claude-api",
    name: "claude-api",
    category: "skill",
    official: true,
    description:
      "Build/debug/optimize des apps Claude API & SDK Anthropic, avec prompt caching par défaut. Gère aussi les migrations entre versions de modèles.",
    tags: ["api", "sdk", "caching", "dev"],
    install: "Clone anthropics/skills/skills/claude-api dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/claude-api",
  },
  {
    id: "skill-canvas-design",
    name: "canvas-design",
    category: "skill",
    official: true,
    description:
      "Crée de l'art visuel (.png / .pdf) selon une philosophie de design — posters, visuels, affiches.",
    tags: ["design", "art", "visual"],
    install: "Clone anthropics/skills/skills/canvas-design dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/canvas-design",
  },
  {
    id: "skill-theme-factory",
    name: "theme-factory",
    category: "skill",
    official: true,
    description:
      "Toolkit pour styliser des artefacts (slides, docs, landing HTML…) avec 10 thèmes pré-définis (couleurs/fonts) ou un thème custom.",
    tags: ["design", "theme", "styling"],
    install: "Clone anthropics/skills/skills/theme-factory dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/theme-factory",
  },
  {
    id: "skill-web-artifacts-builder",
    name: "web-artifacts-builder",
    category: "skill",
    official: true,
    description:
      "Suite d'outils pour des artefacts claude.ai HTML multi-composants élaborés (React, Tailwind, shadcn/ui).",
    tags: ["artifacts", "react", "tailwind", "shadcn"],
    install: "Clone anthropics/skills/skills/web-artifacts-builder dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder",
  },
  {
    id: "skill-doc-coauthoring",
    name: "doc-coauthoring",
    category: "skill",
    official: true,
    description:
      "Workflow structuré de co-rédaction de docs : documentation, proposals, specs techniques, decision docs.",
    tags: ["docs", "writing", "specs"],
    install: "Clone anthropics/skills/skills/doc-coauthoring dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring",
  },
  {
    id: "skill-algorithmic-art",
    name: "algorithmic-art",
    category: "skill",
    official: true,
    description:
      "Art algorithmique en p5.js avec randomness seedée + exploration interactive de paramètres.",
    tags: ["art", "p5js", "generative"],
    install: "Clone anthropics/skills/skills/algorithmic-art dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/algorithmic-art",
  },
  {
    id: "skill-brand-guidelines",
    name: "brand-guidelines",
    category: "skill",
    official: true,
    description:
      "Applique les couleurs + typographie officielles de la marque Anthropic à tout artefact qui bénéficie de ce look.",
    tags: ["brand", "design", "anthropic"],
    install: "Clone anthropics/skills/skills/brand-guidelines dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/brand-guidelines",
  },
  {
    id: "skill-internal-comms",
    name: "internal-comms",
    category: "skill",
    official: true,
    description:
      "Ressources pour rédiger toutes sortes de communications internes dans les formats appréciés par l'entreprise.",
    tags: ["writing", "comms", "knowledge-work"],
    install: "Clone anthropics/skills/skills/internal-comms dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/internal-comms",
  },
  {
    id: "skill-slack-gif-creator",
    name: "slack-gif-creator",
    category: "skill",
    official: true,
    description:
      "Crée des GIFs animés optimisés pour Slack — contraintes, outils de validation, concepts d'animation.",
    tags: ["gif", "slack", "animation"],
    install: "Clone anthropics/skills/skills/slack-gif-creator dans ton dossier skills",
    source: "https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator",
  },
];
