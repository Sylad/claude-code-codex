import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import type { FeedEntry } from "./types.js";

export const ROOT = resolve(import.meta.dirname, "../..");
export const FEEDS_DIR = resolve(ROOT, "frontend/src/data/feeds");

export function feedPath(source: string): string {
  return resolve(FEEDS_DIR, `${source}.json`);
}

export function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

export function readFeed(source: string): FeedEntry[] {
  const path = feedPath(source);
  if (!existsSync(path)) return [];
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    if (!Array.isArray(data)) return [];
    return data as FeedEntry[];
  } catch {
    return [];
  }
}

export function writeFeed(source: string, entries: FeedEntry[]): void {
  const path = feedPath(source);
  mkdirSync(dirname(path), { recursive: true });
  // Sort newest first by publishedAt, fallback to fetchedAt
  const sorted = [...entries].sort((a, b) => {
    const da = a.publishedAt ?? a.fetchedAt;
    const db = b.publishedAt ?? b.fetchedAt;
    return db.localeCompare(da);
  });
  writeFileSync(path, JSON.stringify(sorted, null, 2) + "\n");
}

export function dedupeByUrl(
  existing: FeedEntry[],
  fresh: FeedEntry[],
  cap = 50,
): FeedEntry[] {
  const seen = new Set<string>();
  const out: FeedEntry[] = [];
  for (const entry of [...fresh, ...existing]) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    out.push(entry);
    if (out.length >= cap) break;
  }
  return out;
}
