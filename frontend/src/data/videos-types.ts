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
}

export const KIND_LABELS: Record<VideoKind, string> = {
  channel: "Chaîne",
  video: "Vidéo",
  playlist: "Playlist",
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
