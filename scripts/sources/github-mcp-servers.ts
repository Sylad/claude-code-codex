import type { RawEntry, SourceModule } from "../lib/types.js";

const API =
  "https://api.github.com/repos/modelcontextprotocol/servers/contents/src";

interface GhContent {
  name: string;
  path: string;
  type: "dir" | "file";
  html_url: string;
  url: string;
}

export const NAME = "github-mcp-servers";

export async function fetchEntries(): Promise<RawEntry[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "claude-code-codex-batch/0.1",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(API, { headers });
  if (!res.ok) {
    console.warn(`[${NAME}] HTTP ${res.status} — skipping.`);
    return [];
  }
  const data = (await res.json()) as GhContent[];
  if (!Array.isArray(data)) return [];

  const servers = data.filter((d) => d.type === "dir");
  const out: RawEntry[] = [];
  for (const server of servers.slice(0, 20)) {
    let content = `MCP server ${server.name} from modelcontextprotocol/servers.`;
    try {
      const serverContents = (await (
        await fetch(server.url, { headers })
      ).json()) as GhContent[];
      const readme = serverContents.find(
        (c) => c.name.toLowerCase() === "readme.md",
      );
      if (readme) {
        const raw = await (
          await fetch(readme.url, {
            headers: { ...headers, Accept: "application/vnd.github.raw" },
          })
        ).text();
        content = raw.slice(0, 1500);
      }
    } catch {
      // best effort
    }
    out.push({
      title: server.name,
      url: server.html_url,
      content,
    });
  }
  return out;
}

const mod: SourceModule = { NAME, fetchEntries };
export default mod;
