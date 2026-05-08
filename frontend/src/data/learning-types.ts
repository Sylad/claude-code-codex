export type LearningKind =
  | "blog"
  | "newsletter"
  | "engineering"
  | "podcast";

export interface LearningEntry {
  id: string;
  name: string;
  kind: LearningKind;
  author: string;
  description: string;
  tags: string[];
  url: string;
  feed?: string;
}

export const KIND_LABELS: Record<LearningKind, string> = {
  blog: "Blog",
  newsletter: "Newsletter",
  engineering: "Engineering",
  podcast: "Podcast",
};

export const KIND_ACCENTS: Record<LearningKind, string> = {
  blog: "from-claude/15 to-transparent",
  newsletter: "from-amber-500/15 to-transparent",
  engineering: "from-cyan-500/15 to-transparent",
  podcast: "from-violet-500/15 to-transparent",
};
