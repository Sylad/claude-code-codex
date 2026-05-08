export type ToolStatus = "tested" | "to-test" | "browsed";
export type ToolCategory =
  | "plugin"
  | "mcp"
  | "skill"
  | "tool"
  | "framework";

export interface TestedTool {
  id: string;
  name: string;
  author: string;
  category: ToolCategory;
  description: string;
  tags: string[];
  url: string;
  stars?: number;
  lastPush?: string;
  license?: string;
  status: ToolStatus;
  caseStudyHref?: string;
}

export const STATUS_LABELS: Record<ToolStatus, string> = {
  tested: "Testé",
  "to-test": "À tester",
  browsed: "Sur le radar",
};

export const STATUS_ACCENTS: Record<ToolStatus, string> = {
  tested: "border-claude/40 bg-claude/5",
  "to-test": "border-amber-500/30 bg-amber-500/5",
  browsed: "border-white/10 bg-paper-elevated",
};

export const STATUS_DOTS: Record<ToolStatus, string> = {
  tested: "bg-claude",
  "to-test": "bg-amber-400",
  browsed: "bg-ink-muted",
};

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  plugin: "Plugin",
  mcp: "MCP",
  skill: "Skill",
  tool: "Tool",
  framework: "Framework",
};
