export type VideoKind = "channel" | "video" | "playlist";
export type VideoLanguage = "en" | "fr";

export interface VideoEntry {
  id: string;
  name: string;
  kind: VideoKind;
  language: VideoLanguage;
  author: string;
  description: string;
  tags: string[];
  url: string;
  official: boolean;
  /** L10 (WCAG 3.1.2) : langue du TITRE quand il n'est pas en français (les noms propres n'en ont pas). */
  nameLang?: "en";
}

export const KIND_LABELS: Record<VideoKind, string> = {
  channel: "Chaîne",
  video: "Vidéo",
  playlist: "Liste de lecture",
};

export const KIND_ACCENTS: Record<VideoKind, string> = {
  channel: "from-claude/15 to-transparent",
  video: "from-rose-500/15 to-transparent",
  playlist: "from-cyan-500/15 to-transparent",
};

export const LANGUAGE_LABELS: Record<VideoLanguage, string> = {
  en: "EN",
  fr: "FR",
};
