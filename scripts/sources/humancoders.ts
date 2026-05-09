import { parseFeed } from "../lib/feed-parser.js";
import type { RawEntry, SourceModule } from "../lib/types.js";

const FEED_URL = "https://blog.humancoders.com/rss/";

// Filter: keep only items mentioning Claude Code, Claude (the LLM), or Anthropic
// in title or description. The blog is broad (FR dev community), we surface
// the slice that matters for this codex.
const KEYWORD_RE = /\b(claude code|claude(?: ai)?(?:\s|,|\.|$)|anthropic|claude\.ai|claude api|claude sdk)\b/i;

export const NAME = "humancoders";

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

  const matched = items.filter((i) => {
    const haystack = `${i.title} ${i.description ?? ""}`.toLowerCase();
    return KEYWORD_RE.test(haystack);
  });

  console.log(
    `[${NAME}] ${matched.length} items mentionning Claude/Anthropic (out of ${items.length} total).`,
  );

  return matched.slice(0, 12).map((i) => ({
    title: i.title,
    url: i.url,
    content: i.description ?? "",
    publishedAt: i.publishedAt,
  }));
}

const mod: SourceModule = { NAME, fetchEntries };
export default mod;
