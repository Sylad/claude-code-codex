#!/usr/bin/env node
/**
 * Weekly batch update — scrape sources, summarize via Claude, commit to main.
 *
 * Triggered by .github/workflows/batch-update.yml every Monday at 06:00 UTC.
 *
 * STATUS: scaffold only. The real implementation lives in scripts/sources/*.ts
 * (one file per page section) and is wired up incrementally as each page
 * graduates from stub to real content.
 *
 * Run locally:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/batch-update.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DATA_DIR = resolve(ROOT, "frontend/src/data");

interface SectionEntry {
  id: string;
  url: string;
  title: string;
  summary: string;
  source: string;
  fetchedAt: string;
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function writeJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[batch-update] ANTHROPIC_API_KEY missing — aborting.");
    process.exit(1);
  }

  console.log("[batch-update] scaffold mode — no sources wired yet.");
  console.log(`[batch-update] data dir: ${DATA_DIR}`);

  const sections = ["theory", "ecosystem", "learning", "videos"];
  for (const section of sections) {
    const path = resolve(DATA_DIR, `${section}.json`);
    const existing = readJson<SectionEntry[]>(path, []);
    console.log(`[batch-update] ${section}: ${existing.length} existing entries`);
    if (!existsSync(path)) {
      writeJson(path, []);
      console.log(`[batch-update] ${section}: created empty seed`);
    }
  }

  console.log("[batch-update] done (no-op).");
}

main().catch((err) => {
  console.error("[batch-update] fatal:", err);
  process.exit(1);
});
