export type EcosystemCategory = "plugin" | "mcp" | "skill" | "tool";

export interface EcosystemEntry {
  id: string;
  name: string;
  category: EcosystemCategory;
  official: boolean;
  description: string;
  tags: string[];
  install: string;
  source: string;
}

export const CATEGORY_LABELS: Record<EcosystemCategory, string> = {
  plugin: "Plugin",
  mcp: "MCP server",
  skill: "Skill",
  tool: "Tool / SDK",
};

export const CATEGORY_ACCENTS: Record<EcosystemCategory, string> = {
  plugin: "from-claude/15 to-transparent",
  mcp: "from-cyan-500/15 to-transparent",
  skill: "from-violet-500/15 to-transparent",
  tool: "from-amber-500/15 to-transparent",
};
