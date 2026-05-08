import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY env var missing");
    client = new Anthropic({ apiKey });
  }
  return client;
}

const MODEL = "claude-haiku-4-5-20251001";
const SYSTEM =
  "Tu es un curateur de contenu pour un codex Claude Code. Tu écris des résumés concis et factuels en FR pour des devs qui utilisent Claude Code au quotidien.";

const PROMPT_TEMPLATE = (
  title: string,
  source: string,
  content: string,
) => `Tu rédiges un résumé court (1 phrase, 140 caractères max, en FR) d'un post pour un codex Claude Code.

Source : ${source}
Titre : ${title}
Contenu :
${content.slice(0, 2000)}

Critères :
- 1 phrase, max 140 caractères
- Centrer sur la valeur pour un dev qui utilise Claude Code, l'API Anthropic, MCP, ou les agents
- Si le contenu n'est pas lié à Claude / agents IA / Claude Code / LLM tooling, retourne exactement "[off-topic]"
- Pas de blabla "ce post explique…", aller direct au point
- Pas de markdown, pas de guillemets externes

Résumé :`;

export async function summarize(
  title: string,
  source: string,
  content: string,
): Promise<string> {
  const message = await getClient().messages.create({
    model: MODEL,
    max_tokens: 200,
    system: SYSTEM,
    messages: [{ role: "user", content: PROMPT_TEMPLATE(title, source, content) }],
  });

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return text.replace(/^["']|["']$/g, "").trim();
}
