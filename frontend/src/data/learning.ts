import type { LearningEntry } from "./learning-types";

export const learningEntries: LearningEntry[] = [
  {
    id: "anthropic-news",
    name: "Anthropic Newsroom",
    kind: "blog",
    author: "Anthropic",
    description:
      "Source primaire pour les releases Claude, les launches Claude Code, les updates de policy et les annonces produit — directement chez Anthropic.",
    tags: ["claude", "anthropic", "releases", "officiel"],
    url: "https://www.anthropic.com/news",
  },
  {
    id: "anthropic-engineering",
    name: "Anthropic Engineering",
    kind: "engineering",
    author: "Équipe Anthropic Engineering",
    description:
      "Posts techniques en profondeur sur les internals : agentic coding, sandboxing, multi-agent research, MCP, context engineering, evals.",
    tags: ["claude-code", "agents", "mcp", "engineering", "officiel"],
    url: "https://www.anthropic.com/engineering",
  },
  {
    id: "claude-code-docs",
    name: "Claude Code Documentation",
    kind: "blog",
    author: "Anthropic",
    description:
      "La référence canonique : install, CLI, plugins IDE, hooks, skills, sub-agents, MCP, Agent SDK, routines, GitHub Actions. Mise à jour continue.",
    tags: ["claude-code", "docs", "agent-sdk", "mcp", "officiel"],
    url: "https://code.claude.com/docs/en/overview",
  },
  {
    id: "simon-willison",
    name: "Simon Willison's Weblog",
    kind: "blog",
    author: "Simon Willison",
    description:
      "Notes hands-on quasi-quotidiennes sur Claude, Claude Code et les patterns d'agents. Le link-blog de référence pour rester à jour sur le tooling.",
    tags: ["claude", "agents", "llm", "tools"],
    url: "https://simonwillison.net/",
    feed: "https://simonwillison.net/atom/everything/",
  },
  {
    id: "latent-space",
    name: "Latent Space",
    kind: "podcast",
    author: "swyx & Alessio Fanelli",
    description:
      "Podcast et newsletter long-form sur la façon dont les labs construisent agents, modèles et infra. Couverture régulière Anthropic / Claude Code.",
    tags: ["agents", "podcast", "infra", "interviews"],
    url: "https://www.latent.space/",
    feed: "https://www.latent.space/feed",
  },
  {
    id: "every-chain-of-thought",
    name: "Every — Chain of Thought",
    kind: "newsletter",
    author: "Dan Shipper (Every)",
    description:
      "Essais de practitioner sur le build avec Claude — Claude Code pour PMs, agent companies, reviews de modèles. Hebdo.",
    tags: ["claude", "agents", "practitioner", "newsletter"],
    url: "https://every.to/chain-of-thought",
  },
  {
    id: "every-source-code",
    name: "Every — Source Code",
    kind: "newsletter",
    author: "Équipe Every",
    description:
      "Culture engineering et patterns d'une boîte AI-native qui ship vraiment avec Claude Code au quotidien. Pair-bien avec Anthropic Engineering.",
    tags: ["claude-code", "engineering", "practitioner"],
    url: "https://every.to/source-code",
  },
  {
    id: "hamel-husain",
    name: "Hamel's Blog",
    kind: "blog",
    author: "Hamel Husain",
    description:
      "La ref sur les évaluations LLM, avec du travail dédié à l'évaluation des coding agents — directement applicable aux workflows Claude Code.",
    tags: ["evals", "agents", "coding-agents"],
    url: "https://hamel.dev/",
  },
  {
    id: "eugene-yan",
    name: "Eugene Yan",
    kind: "blog",
    author: "Eugene Yan",
    description:
      "Patterns pour systèmes LLM, prompting fundamentals, LLM-as-judge. Posts denses, lourds en citations, actionnables.",
    tags: ["llm", "patterns", "evals"],
    url: "https://eugeneyan.com/",
    feed: "https://eugeneyan.com/rss/",
  },
  {
    id: "chip-huyen",
    name: "Chip Huyen — Blog",
    kind: "blog",
    author: "Chip Huyen",
    description:
      "AI system design par l'autrice de \"AI Engineering\". Posts sur agents, plateformes GenAI, pièges des LLM apps en prod.",
    tags: ["ai-engineering", "agents", "system-design"],
    url: "https://huyenchip.com/blog/",
    feed: "https://huyenchip.com/feed.xml",
  },
  {
    id: "ainews-smol",
    name: "AINews (Smol AI)",
    kind: "newsletter",
    author: "swyx / Smol AI",
    description:
      "Digest quotidien des Discords IA, Reddit, X — le moyen le plus rapide de catcher releases Claude, drops Claude Code et réactions communauté en un email.",
    tags: ["newsletter", "daily-digest", "claude", "agents"],
    url: "https://news.smol.ai/",
  },
  {
    id: "jay-alammar",
    name: "Jay Alammar — Illustrated Guides",
    kind: "blog",
    author: "Jay Alammar",
    description:
      "Gelé mais canonique : The Illustrated Transformer / GPT-2 / BERT. Le meilleur on-ramp avant d'aller deep sur Claude. Travail actif désormais sur Substack.",
    tags: ["fundamentals", "transformer", "illustrated"],
    url: "https://jalammar.github.io/",
  },
];
