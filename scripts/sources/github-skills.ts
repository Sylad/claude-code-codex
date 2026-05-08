import type { RawEntry, SourceModule } from "../lib/types.js";

const API = "https://api.github.com/repos/anthropics/skills/contents/skills";

interface GhContent {
  name: string;
  path: string;
  type: "dir" | "file";
  html_url: string;
  url: string;
  sha: string;
}

export const NAME = "github-anthropics-skills";

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

  const skills = data.filter((d) => d.type === "dir");
  const out: RawEntry[] = [];
  for (const skill of skills.slice(0, 25)) {
    let content = `Skill ${skill.name} from anthropics/skills repo.`;
    try {
      const skillContents = (await (
        await fetch(skill.url, { headers })
      ).json()) as GhContent[];
      const skillMd = skillContents.find(
        (c) => c.name.toLowerCase() === "skill.md",
      );
      if (skillMd) {
        const raw = await (
          await fetch(skillMd.url, {
            headers: { ...headers, Accept: "application/vnd.github.raw" },
          })
        ).text();
        content = raw.slice(0, 1500);
      }
    } catch {
      // best effort
    }
    out.push({
      title: skill.name,
      url: skill.html_url,
      content,
    });
  }
  return out;
}

const mod: SourceModule = { NAME, fetchEntries };
export default mod;
