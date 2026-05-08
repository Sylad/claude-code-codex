import { parseFeed } from "../lib/feed-parser.js";
import type { RawEntry, SourceModule } from "../lib/types.js";

const FEED_URL = "https://simonwillison.net/atom/everything/";

export const NAME = "simon-willison";

export async function fetchEntries(): Promise<RawEntry[]> {
  const res = await fetch(FEED_URL, {
    headers: { "User-Agent": "claude-code-codex-batch/0.1" },
  });
  if (!res.ok) {
    console.warn(`[${NAME}] HTTP ${res.status} — skipping.`);
    return [];
  }
  const xml = await res.text();
  const items = parseFeed(xml);
  return items.slice(0, 15).map((i) => ({
    title: i.title,
    url: i.url,
    content: i.description ?? "",
    publishedAt: i.publishedAt,
  }));
}

const mod: SourceModule = { NAME, fetchEntries };
export default mod;
