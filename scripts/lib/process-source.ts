/**
 * Traitement d'une source du batch hebdo : lit le flux déjà écrit, récupère les entrées
 * de la source, résume les nouvelles, fusionne et écrit. Les accès au disque et à Claude
 * sont passés en paramètres pour que le traitement se teste sans réseau ni fichier réel
 * (frontend/tests/l76-batch-liens.test.mjs).
 */
import { dedupeByUrl, hashUrl } from "./feeds.js";
import type { FeedEntry, RawEntry, SourceModule } from "./types.js";
import { safeHttpUrl } from "../../frontend/src/lib/safe-url.mjs";

export interface ProcessDeps {
  readFeed(source: string): FeedEntry[];
  writeFeed(source: string, entries: FeedEntry[]): void;
  summarize(raw: RawEntry, source: string): Promise<string>;
  now?(): string;
  /**
   * L35 : appelé une fois la source relevée et son flux écrit, avec l'instant du passage.
   * Une source en échec (exception) ne l'atteint pas : sa date de dernier relevé ne bouge pas.
   */
  noteReleve?(source: string, instant: string): void;
}

export async function processSource(
  source: SourceModule,
  deps: ProcessDeps,
): Promise<{ source: string; added: number; total: number }> {
  console.log(`\n[${source.NAME}] fetching…`);
  const raws = await source.fetchEntries();
  console.log(`  fetched ${raws.length} raw entries`);

  // L76 : une entrée déjà écrite dont le lien n'est pas http(s) est retirée du flux.
  const existing = deps.readFeed(source.NAME).filter((e) => {
    if (safeHttpUrl(e.url)) return true;
    console.warn(`  [warn] entrée existante retirée (lien non http(s)) : ${e.title.slice(0, 60)}`);
    return false;
  });
  const existingIds = new Set(existing.map((e) => e.id));
  const now = deps.now ? deps.now() : new Date().toISOString();

  const fresh: FeedEntry[] = [];
  let added = 0;
  for (const raw of raws) {
    if (!raw.url) continue;
    if (!safeHttpUrl(raw.url)) {
      console.warn(`  [warn] entrée ignorée (lien non http(s)) : ${raw.title.slice(0, 60)}`);
      continue;
    }
    // URL d'origine (sans espaces autour) : l'id reste celui des entrées déjà écrites.
    const url = raw.url.trim();
    const id = hashUrl(url);
    if (existingIds.has(id)) continue;

    const summary = await deps.summarize(raw, source.NAME);
    if (summary === "[off-topic]") {
      console.log(`  skip (off-topic): ${raw.title.slice(0, 60)}`);
      continue;
    }

    fresh.push({
      id,
      source: source.NAME,
      url,
      title: raw.title,
      summary,
      publishedAt: raw.publishedAt,
      fetchedAt: now,
    });
    added++;
    console.log(`  + ${raw.title.slice(0, 60)}`);
  }

  const merged = dedupeByUrl(existing, fresh, 50);
  deps.writeFeed(source.NAME, merged);
  deps.noteReleve?.(source.NAME, now);
  return { source: source.NAME, added, total: merged.length };
}
