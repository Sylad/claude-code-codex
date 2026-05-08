#!/usr/bin/env node
/**
 * Weekly batch update — scrape sources, summarize via Claude, commit to main.
 *
 * Triggered by .github/workflows/batch-update.yml every Monday at 06:00 UTC.
 *
 * Usage (local):
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/batch-update.ts
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/batch-update.ts --dry-run
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/batch-update.ts --source simon-willison
 *
 * Flags:
 *   --dry-run         : run scrapers + summarizer, write to /tmp/codex-feeds/ instead of frontend/src/data/feeds/
 *   --source <name>   : run only the named source (e.g. --source anthropic-news)
 *   --no-summarize    : skip Claude summarizer (use raw description as summary). Useful for testing without API key.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  FEEDS_DIR,
  ROOT,
  dedupeByUrl,
  hashUrl,
  readFeed,
  writeFeed,
} from "./lib/feeds.js";
import type { FeedEntry, RawEntry, SourceModule } from "./lib/types.js";
import { summarize } from "./lib/claude.js";

import anthropicNews from "./sources/anthropic-news.js";
import simonWillison from "./sources/simon-willison.js";
import githubSkills from "./sources/github-skills.js";
import githubMcpServers from "./sources/github-mcp-servers.js";

const SOURCES: SourceModule[] = [
  anthropicNews,
  simonWillison,
  githubSkills,
  githubMcpServers,
];

interface Options {
  dryRun: boolean;
  sourceFilter: string | null;
  noSummarize: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = { dryRun: false, sourceFilter: null, noSummarize: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--no-summarize") opts.noSummarize = true;
    else if (a === "--source") opts.sourceFilter = argv[++i] ?? null;
  }
  return opts;
}

async function summarizeWithFallback(
  raw: RawEntry,
  source: string,
  noSummarize: boolean,
): Promise<string> {
  if (noSummarize) {
    return raw.content.slice(0, 140).trim();
  }
  try {
    return await summarize(raw.title, source, raw.content);
  } catch (err) {
    console.warn(
      `  [warn] summarize failed for "${raw.title}":`,
      (err as Error).message,
    );
    return raw.content.slice(0, 140).trim();
  }
}

async function processSource(
  source: SourceModule,
  opts: Options,
): Promise<{ source: string; added: number; total: number }> {
  console.log(`\n[${source.NAME}] fetching…`);
  const raws = await source.fetchEntries();
  console.log(`  fetched ${raws.length} raw entries`);

  const existing = readFeed(source.NAME);
  const existingIds = new Set(existing.map((e) => e.id));
  const now = new Date().toISOString();

  const fresh: FeedEntry[] = [];
  let added = 0;
  for (const raw of raws) {
    if (!raw.url) continue;
    const id = hashUrl(raw.url);
    if (existingIds.has(id)) continue;

    const summary = await summarizeWithFallback(
      raw,
      source.NAME,
      opts.noSummarize,
    );
    if (summary === "[off-topic]") {
      console.log(`  skip (off-topic): ${raw.title.slice(0, 60)}`);
      continue;
    }

    fresh.push({
      id,
      source: source.NAME,
      url: raw.url,
      title: raw.title,
      summary,
      publishedAt: raw.publishedAt,
      fetchedAt: now,
    });
    added++;
    console.log(`  + ${raw.title.slice(0, 60)}`);
  }

  const merged = dedupeByUrl(existing, fresh, 50);

  if (opts.dryRun) {
    const previewDir = "/tmp/codex-feeds";
    mkdirSync(previewDir, { recursive: true });
    writeFileSync(
      resolve(previewDir, `${source.NAME}.json`),
      JSON.stringify(merged, null, 2) + "\n",
    );
    console.log(
      `  [dry-run] wrote preview to ${previewDir}/${source.NAME}.json`,
    );
  } else {
    writeFeed(source.NAME, merged);
    console.log(`  wrote ${merged.length} entries to feeds/${source.NAME}.json`);
  }

  return { source: source.NAME, added, total: merged.length };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.noSummarize && !process.env.ANTHROPIC_API_KEY) {
    console.error(
      "[batch-update] ANTHROPIC_API_KEY missing. Either set it, or pass --no-summarize.",
    );
    process.exit(1);
  }

  console.log(`[batch-update] starting`);
  console.log(`  ROOT       : ${ROOT}`);
  console.log(`  FEEDS_DIR  : ${FEEDS_DIR}`);
  console.log(`  dry-run    : ${opts.dryRun}`);
  console.log(`  summarize  : ${!opts.noSummarize}`);
  if (opts.sourceFilter) console.log(`  source     : ${opts.sourceFilter}`);

  const sourcesToRun = opts.sourceFilter
    ? SOURCES.filter((s) => s.NAME === opts.sourceFilter)
    : SOURCES;

  if (sourcesToRun.length === 0) {
    console.error(
      `[batch-update] no source matches "${opts.sourceFilter}". Available: ${SOURCES.map((s) => s.NAME).join(", ")}`,
    );
    process.exit(2);
  }

  const results: { source: string; added: number; total: number }[] = [];
  for (const source of sourcesToRun) {
    try {
      results.push(await processSource(source, opts));
    } catch (err) {
      console.error(
        `[batch-update] source ${source.NAME} failed:`,
        (err as Error).message,
      );
      results.push({ source: source.NAME, added: 0, total: 0 });
    }
  }

  console.log(`\n[batch-update] summary`);
  console.table(results);
  console.log(`[batch-update] done.`);
}

main().catch((err) => {
  console.error("[batch-update] fatal:", err);
  process.exit(1);
});
