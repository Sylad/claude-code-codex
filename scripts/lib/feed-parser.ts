/**
 * Minimal RSS 2.0 / Atom feed parser — regex-based, zero deps.
 * Handles the well-formed feeds we consume (Anthropic, Simon Willison, etc.).
 * Not a general-purpose XML parser.
 */

export interface ParsedFeedItem {
  title: string;
  url: string;
  description?: string;
  publishedAt?: string;
}

export function parseFeed(xml: string): ParsedFeedItem[] {
  const atomEntries = [...xml.matchAll(/<entry\b[\s\S]*?>([\s\S]*?)<\/entry>/g)];
  if (atomEntries.length > 0) {
    return atomEntries.map((m) => parseAtomEntry(m[1]));
  }
  const rssItems = [...xml.matchAll(/<item\b[\s\S]*?>([\s\S]*?)<\/item>/g)];
  return rssItems.map((m) => parseRssItem(m[1]));
}

function pickTag(s: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`);
  const m = s.match(re);
  return m?.[1]?.trim();
}

function pickAttr(s: string, tag: string, attr: string): string | undefined {
  const re = new RegExp(
    `<${tag}\\b[^>]*\\b${attr}=["']([^"']+)["'][^>]*\\/?>`,
  );
  const m = s.match(re);
  return m?.[1];
}

function decodeText(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseAtomEntry(s: string): ParsedFeedItem {
  const url =
    pickAttr(s, "link", "href") ?? decodeText(pickTag(s, "link") ?? "");
  return {
    title: decodeText(pickTag(s, "title") ?? ""),
    url,
    description: decodeText(
      pickTag(s, "summary") ?? pickTag(s, "content") ?? "",
    ).slice(0, 4000),
    publishedAt: pickTag(s, "published") ?? pickTag(s, "updated"),
  };
}

function parseRssItem(s: string): ParsedFeedItem {
  return {
    title: decodeText(pickTag(s, "title") ?? ""),
    url: decodeText(pickTag(s, "link") ?? pickTag(s, "guid") ?? ""),
    description: decodeText(pickTag(s, "description") ?? "").slice(0, 4000),
    publishedAt: pickTag(s, "pubDate"),
  };
}
