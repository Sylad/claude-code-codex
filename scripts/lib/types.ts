export interface FeedEntry {
  id: string;
  source: string;
  url: string;
  title: string;
  summary: string;
  publishedAt?: string;
  fetchedAt: string;
}

export interface RawEntry {
  title: string;
  url: string;
  content: string;
  publishedAt?: string;
}

export interface SourceModule {
  NAME: string;
  fetchEntries(): Promise<RawEntry[]>;
}
