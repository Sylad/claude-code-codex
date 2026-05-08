import type { VideoEntry } from "./videos-types";

export const videoEntries: VideoEntry[] = [
  {
    id: "anthropic-official",
    name: "Anthropic",
    kind: "channel",
    language: "en",
    author: "Anthropic",
    description:
      "Chaîne officielle Anthropic. Demos de launch Claude Code, walkthroughs de features (hooks, MCP, skills, plugins), enregistrements de la conférence Code w/ Claude.",
    tags: ["claude-code", "officiel", "anthropic", "mcp", "agent-sdk"],
    url: "https://www.youtube.com/@AnthropicAI",
    official: true,
  },
  {
    id: "anthropic-conversation-claude-code",
    name: "A conversation on Claude Code — Boris Cherny & Alex Albert",
    kind: "video",
    language: "en",
    author: "Anthropic",
    description:
      "Fireside Anthropic-publiée entre le lead Claude Code et Claude Relations. Patterns d'usage quotidien, mémoire, sub-agents et workflows internes de l'équipe.",
    tags: ["claude-code", "officiel", "anthropic", "workflow"],
    url: "https://www.youtube.com/watch?v=Yf_1w00qIKc",
    official: true,
  },
  {
    id: "boris-cherny-ai-engineer",
    name: "Claude Code & l'évolution de l'agentic coding — Boris Cherny",
    kind: "video",
    language: "en",
    author: "AI Engineer / Boris Cherny (Anthropic)",
    description:
      "Talk au AI Engineer World's Fair par le créateur de Claude Code. La meilleure conférence pour comprendre la philo : terminal-first, Unix utility, agentic loops.",
    tags: ["claude-code", "talk", "conference", "anthropic"],
    url: "https://www.youtube.com/watch?v=Lue8K2jqfKk",
    official: false,
  },
  {
    id: "boris-cherny-lennys-podcast",
    name: "Head of Claude Code — Boris Cherny",
    kind: "video",
    language: "en",
    author: "Lenny's Podcast",
    description:
      "Long-form interview de Boris Cherny sur la construction de Claude Code, le dogfooding interne, et où va l'agentic coding.",
    tags: ["claude-code", "podcast", "interview", "product"],
    url: "https://www.youtube.com/watch?v=We7BZVKbCVw",
    official: false,
  },
  {
    id: "cat-wu-lennys-podcast",
    name: "How Anthropic's product team moves faster — Cat Wu",
    kind: "video",
    language: "en",
    author: "Lenny's Podcast",
    description:
      "Cat Wu (Head of Product, Claude Code) sur comment l'équipe ship, les workflows d'éval et des conseils pour tirer le meilleur de Claude Code.",
    tags: ["claude-code", "podcast", "product", "workflow"],
    url: "https://www.youtube.com/watch?v=PplmzlgE0kg",
    official: false,
  },
  {
    id: "indydevdan",
    name: "IndyDevDan",
    kind: "channel",
    language: "en",
    author: "IndyDevDan",
    description:
      "Couverture Claude Code en profondeur : sub-agents, hooks, agents en parallèle, slash commands, MCP. Probablement la chaîne solo la plus deep sur l'agentic coding.",
    tags: ["claude-code", "tutorial", "hooks", "sub-agents", "mcp"],
    url: "https://www.youtube.com/@indydevdan",
    official: false,
  },
  {
    id: "cole-medin",
    name: "Cole Medin",
    kind: "channel",
    language: "en",
    author: "Cole Medin",
    description:
      "Chaîne agents IA + Claude Code. Builds pratiques avec MCP servers, RAG, automatisations Claude Code. 2 vidéos par semaine.",
    tags: ["claude-code", "tutorial", "mcp", "agents"],
    url: "https://www.youtube.com/@ColeMedin",
    official: false,
  },
  {
    id: "latent-space-channel",
    name: "Latent Space",
    kind: "channel",
    language: "en",
    author: "swyx & Alessio",
    description:
      "Podcast AI Engineer. Plusieurs épisodes Anthropic long-form : Boris & Cat sur Claude Code, Felix Rieseberg sur Cowork & Skills, Erik Schluntz sur Computer Use.",
    tags: ["claude-code", "podcast", "interview", "anthropic"],
    url: "https://www.youtube.com/channel/UCxBcwypKK-W3GHd_RZ9FZrQ",
    official: false,
  },
  {
    id: "latent-space-claude-code-surprise-hit",
    name: "Anthropic's Surprise Hit: How Claude Code Became an AI Coding Powerhouse",
    kind: "video",
    language: "en",
    author: "Latent Space",
    description:
      "Boris Cherny et Cat Wu interviewés par Latent Space. Origin story : pourquoi Claude Code a shippé en utility Unix plutôt qu'en IDE, et comment le design a tenu.",
    tags: ["claude-code", "podcast", "history", "design"],
    url: "https://www.youtube.com/watch?v=G4yZiAdOBJM",
    official: false,
  },
  {
    id: "felix-rieseberg-cowork",
    name: "Anthropic's Felix Rieseberg on AI Coworkers, Local-First Agents",
    kind: "video",
    language: "en",
    author: "Latent Space",
    description:
      "Head of Cowork (ex-Electron / Slack desktop) sur le shift MCP servers → Skills, le sandboxing VM, et la stratégie Anthropic d'agents local-first.",
    tags: ["claude-code", "skills", "mcp", "agent-sdk", "cowork"],
    url: "https://www.youtube.com/watch?v=ZpZ7lFoWaT8",
    official: false,
  },
];
