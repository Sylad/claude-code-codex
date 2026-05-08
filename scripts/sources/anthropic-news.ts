import { parseFeed } from "../lib/feed-parser.js";
import type { RawEntry, SourceModule } from "../lib/types.js";

const FEED_URLS = [
  "https://www.anthropic.com/news/feed",
  "https://www.anthropic.com/news.xml",
  "https://www.anthropic.com/rss",
  "https://feeds.feedburner.com/anthropic",
];

async function tryFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "claude-code-codex-batch/0.1" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.includes("<")) return null;
    return text;
  } catch {
    return null;
  }
}

export const NAME = "anthropic-news";

export async function fetchEntries(): Promise<RawEntry[]> {
  for (const url of FEED_URLS) {
    const xml = await tryFetch(url);
    if (xml) {
      const items = parseFeed(xml);
      if (items.length > 0) {
        return items.slice(0, 12).map((i) => ({
          title: i.title,
          url: i.url,
          content: i.description ?? "",
          publishedAt: i.publishedAt,
        }));
      }
    }
  }
  console.warn(
    `[${NAME}] no feed URL responded with parseable content — skipping.`,
  );
  return [];
}

const mod: SourceModule = { NAME, fetchEntries };
export default mod;
