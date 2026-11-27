import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createHash } from "node:crypto";
import type { FeedEntry } from "./types.js";

export const ROOT = resolve(import.meta.dirname, "../..");
export const FEEDS_DIR = resolve(ROOT, "frontend/src/data/feeds");

export function feedPath(source: string): string {
  return resolve(FEEDS_DIR, `${source}.json`);
}

/**
 * L35 — date du dernier passage RÉUSSI du batch sur chaque source ({ "<source>": "<ISO>" }).
 * Le `fetchedAt` d'une entrée n'est posé qu'à sa première apparition : il date la dernière
 * nouveauté, pas le dernier relevé. /ecosystem lit ce fichier au build (« Dernier relevé le … »).
 */
export const RELEVES_PATH = resolve(FEEDS_DIR, "derniers-releves.json");

export function readReleves(path = RELEVES_PATH): Record<string, string> {
  if (!existsSync(path)) return {};
  try {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  }
}

/** Note le passage réussi de `source` à `instant`, sans toucher aux autres sources. */
export function writeReleve(source: string, instant: string, path = RELEVES_PATH): void {
  const releves = { ...readReleves(path), [source]: instant };
  const tries = Object.fromEntries(Object.entries(releves).sort(([a], [b]) => a.localeCompare(b)));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(tries, null, 2) + "\n");
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
