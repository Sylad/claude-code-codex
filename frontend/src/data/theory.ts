export interface TheorySnippet {
  language: string;
  filename?: string;
  code: string;
}

export interface TheorySource {
  label: string;
  href: string;
}

export interface TheorySection {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  intro: string;
  bullets: string[];
  snippets: TheorySnippet[];
  sources: TheorySource[];
}

export const sections: TheorySection[] = [
  {
    id: "architecture",
    number: "01",
    title: "Architecture & agentic loop",
    subtitle: "Comment Claude Code orchestre modèle, outils et contexte",
    intro:
      "Claude Code est un outil de coding agentique qui lit ton code, édite des fichiers, exécute des commandes et s'intègre à ton environnement de dev. Contrairement à un chat où le modèle ne fait qu'émettre du texte, Claude Code tourne une boucle agentique : le modèle propose des appels d'outils (Read, Edit, Bash, Grep, Agent…), le harness les exécute en local avec accès filesystem et shell réels, retourne les observations, et le modèle décide du tour suivant — jusqu'à finir la tâche. Le même moteur sert le terminal, l'IDE, l'app desktop, le web et les actions GitHub.",
    bullets: [
      "Un seul moteur, plusieurs surfaces : terminal CLI, plugins VS Code/JetBrains, app desktop, web (claude.ai/code), GitHub Actions, Slack — tous partagent CLAUDE.md, settings et MCP servers.",
      "Le system prompt est chargé dans un ordre déterministe au démarrage : system prompt (~4.2K tokens) → MEMORY.md (200 lignes / 25KB max) → env info (cwd, platform, git status) → catalogue MCP (deferred par défaut) → CLAUDE.md walked depuis la racine.",
      "Sous-agents = fenêtres de contexte isolées. Built-ins : Explore (read-only, Haiku), Plan (read-only, plan mode), general-purpose (tous les outils). Ils empêchent d'inonder le parent avec des résultats de recherche — seul le résumé remonte.",
      "Le tool Task a été renommé Agent en v2.1.63 (Task(...) reste un alias). Les sous-agents ne peuvent pas spawner d'autres sous-agents (pas de nesting infini).",
      "Les sous-agents sont des fichiers Markdown avec frontmatter YAML dans .claude/agents/ (projet) ou ~/.claude/agents/ (user). Champs requis : name, description. Optionnels : tools, model, permissionMode, isolation: worktree, hooks, mcpServers.",
    ],
    snippets: [
      {
        language: "markdown",
        filename: ".claude/agents/code-reviewer.md",
        code: `---
name: code-reviewer
description: Reviews code for quality and best practices
tools: Read, Glob, Grep
model: sonnet
---

You are a code reviewer. When invoked, analyze the code and provide
specific, actionable feedback on quality, security, and best practices.`,
      },
      {
        language: "bash",
        filename: "Composition Unix-style",
        code: `# Pipe logs into Claude Code in non-interactive mode
tail -200 app.log | claude -p "Slack me if you see any anomalies"

# Restrict which sub-agents a coordinator may spawn (allowlist)
# tools: Agent(worker, researcher), Read, Bash`,
      },
    ],
    sources: [
      {
        label: "code.claude.com — Overview",
        href: "https://code.claude.com/docs/en/overview",
      },
      {
        label: "code.claude.com — Sub-agents",
        href: "https://code.claude.com/docs/en/sub-agents",
      },
      {
        label: "code.claude.com — Context window",
        href: "https://code.claude.com/docs/en/context-window",
      },
    ],
  },
  {
    id: "context-window",
    number: "02",
    title: "Context window, compaction & prompt caching",
    subtitle: "Comment Claude Code gère sa mémoire de session",
    intro:
      "Chaque session démarre avec une fenêtre de contexte fraîche, remplie dans un ordre déterministe : system prompt, MEMORY.md, env info, stubs MCP, puis CLAUDE.md depuis la racine. Comme ce bloc d'amorce est réutilisé tour après tour, c'est exactement ce que le prompt cache de l'API Anthropic est fait pour rendre quasi-gratuit. Quand la conversation approche de la limite de la fenêtre, Claude Code compacte l'historique : il résume les vieux tours et re-lit le CLAUDE.md racine depuis le disque. La leçon pratique : garder CLAUDE.md et MEMORY.md légers, éviter d'invalider le préfixe en milieu de session, et préférer les sous-agents à l'exploration inline pour les tâches latérales.",
    bullets: [
      "TTL du cache : 5 min par défaut, 1h en option (\"ttl\": \"1h\"). Les écritures par défaut coûtent 1.25× le prix base input ; les écritures 1h coûtent 2×. Les lectures coûtent 0.1× — le fameux discount de 90%.",
      "Jusqu'à 4 cache breakpoints par requête, fenêtre de lookback de 20 blocks. Longueur minimum cacheable : 4096 tokens pour Opus 4.7/4.6/4.5 et Haiku 4.5, 2048 pour Sonnet 4.6/Haiku 3.5, 1024 pour les anciens.",
      "Auto memory : seules les 200 premières lignes ou 25 KB (premier des deux atteint) de ~/.claude/projects/<project>/memory/MEMORY.md sont chargées au démarrage. Les fichiers topiques (debugging.md…) chargent on-demand.",
      "CLAUDE.md walked dans l'arborescence : ancêtres d'abord, working dir en dernier ; CLAUDE.local.md ajouté après chaque CLAUDE.md ; les fichiers en sous-dir chargent quand Claude lit un fichier dedans. claudeMdExcludes pour skipper du bruit en monorepo.",
      "Ce qui survit à /compact : le CLAUDE.md racine est re-lu depuis le disque et re-injecté. Les CLAUDE.md imbriqués NE sont PAS re-injectés (lazy reload). Les instructions données en conversation sont perdues — promote-les dans CLAUDE.md pour persister.",
    ],
    snippets: [
      {
        language: "json",
        filename: "Cache breakpoint 1h sur un system prompt lourd",
        code: `{
  "model": "claude-opus-4-7",
  "system": [
    {
      "type": "text",
      "text": "<long stable rules / examples / tool docs>",
      "cache_control": { "type": "ephemeral", "ttl": "1h" }
    }
  ],
  "messages": [{ "role": "user", "content": "..." }]
}`,
      },
      {
        language: "json",
        filename: "Stats cache dans la réponse API",
        code: `{
  "usage": {
    "input_tokens": 50,
    "cache_creation_input_tokens": 5000,
    "cache_read_input_tokens": 1000,
    "output_tokens": 512
  }
}`,
      },
    ],
    sources: [
      {
        label: "platform.claude.com — Prompt caching",
        href: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching",
      },
      {
        label: "code.claude.com — Memory",
        href: "https://code.claude.com/docs/en/memory",
      },
      {
        label: "code.claude.com — Context window",
        href: "https://code.claude.com/docs/en/context-window",
      },
    ],
  },
  {
    id: "sessions",
    number: "03",
    title: "Sessions & state",
    subtitle: "Persister, reprendre, forker une conversation",
    intro:
      "Claude Code persiste chaque run interactif sous forme de session sur disque pour pouvoir reprendre sans perdre le contexte. Chaque session démarre avec une fenêtre fraîche, et Claude Code recoud l'état au lancement en relisant la transcription sauvegardée + les fichiers d'instructions du projet. Important pour les tâches longues qui dépassent une seule session. À distinguer de la mémoire projet : la transcription capture ce qui s'est passé dans un run précis, alors que CLAUDE.md capture les instructions permanentes qui s'appliquent à tous les runs futurs.",
    bullets: [
      "claude -c / --continue reprend la conversation la plus récente dans le cwd ; claude -r <id-or-name> / --resume choisit n'importe quelle session passée par UUID, nom, ou via picker interactif.",
      "Sessions nommables (claude -n \"auth-refactor\") et forkables (--fork-session crée une nouvelle session ID branchée depuis une transcription existante au lieu de la réutiliser).",
      "L'état local (transcripts, todos, debug logs, historique d'édition, prompt history) vit dans ~/.claude/ et est indexé dans ~/.claude.json. claude project purge [path] efface tout pour un projet.",
      "--no-session-persistence (mode print) et CLAUDE_CODE_SKIP_PROMPT_HISTORY désactivent la sauvegarde — pratique pour CI. --session-id <uuid> épingle un UUID précis.",
      "Memory vs session : CLAUDE.md (project / user / managed / .local.md) recharge à chaque démarrage de session. Auto memory MEMORY.md accumule les notes Claude entre runs (200 lignes / 25KB max).",
    ],
    snippets: [
      {
        language: "bash",
        filename: "CLI session commands",
        code: `# Continue most recent session in this directory
claude -c

# Resume a named session, branching to a new ID
claude --resume auth-refactor --fork-session

# One-shot run with no persistence (CI / scripts)
claude -p --no-session-persistence "summarize this diff"`,
      },
      {
        language: "text",
        filename: "CLAUDE.md scopes (precedence: more specific wins)",
        code: `./CLAUDE.md             # project, shared via git
./.claude/CLAUDE.md     # project alt location
./CLAUDE.local.md       # personal, gitignored
~/.claude/CLAUDE.md     # user, every project
# managed: /etc/claude-code/CLAUDE.md (Linux)
#          /Library/Application Support/ClaudeCode/CLAUDE.md (macOS)`,
      },
    ],
    sources: [
      {
        label: "code.claude.com — CLI reference",
        href: "https://code.claude.com/docs/en/cli-reference",
      },
      {
        label: "code.claude.com — Memory",
        href: "https://code.claude.com/docs/en/memory",
      },
    ],
  },
  {
    id: "hooks",
    number: "04",
    title: "Hooks",
    subtitle: "Imposer une politique au lieu d'espérer que le modèle obéisse",
    intro:
      "Les hooks sont des commandes, endpoints HTTP, MCP tool calls, prompts ou sous-agents user-définis qui se déclenchent à des points fixes du cycle de vie de Claude Code. Ils transforment la \"behavioral guidance\" (CLAUDE.md, demandes en chat) en \"policy\" (vérifications shell-level). Un hook reçoit un payload JSON sur stdin et renvoie un signal via exit code + JSON sur stdout — y compris la possibilité de bloquer un appel d'outil, de réécrire ses arguments, ou d'injecter du contexte additionnel. Configurés dans settings.json à 4 scopes (user / project / local / managed-policy) qui se mergent au lieu de s'écraser.",
    bullets: [
      "Événements de lifecycle : SessionStart, SessionEnd, UserPromptSubmit, PreToolUse, PostToolUse, PostToolUseFailure, PostToolBatch, PermissionRequest, Notification, SubagentStart, SubagentStop, Stop, StopFailure, PreCompact, PostCompact, InstructionsLoaded, FileChanged, CwdChanged, WorktreeCreate, Setup…",
      "Champs communs du payload : session_id, transcript_path, cwd, permission_mode, hook_event_name. Extras event-specific : tool_name + tool_input + tool_use_id (PreToolUse), prompt (UserPromptSubmit), source (SessionStart).",
      "Exit code 0 = succès, le JSON stdout est parsé. Exit code 2 = erreur bloquante, stderr est renvoyé à Claude. Stdout structuré supporte decision: \"block\", hookSpecificOutput.permissionDecision: \"allow|deny|ask|defer\", updatedInput, additionalContext.",
      "5 types de handler : command (shell), http, mcp_tool, prompt (sub-LLM call), agent. Garde-fous : allowedHttpHookUrls, httpHookAllowedEnvVars, disableAllHooks, allowManagedHooksOnly.",
      "Matchers acceptent * (tous), une string exacte, des |-listes (Edit|Write), ou des regex JS (^Notebook, mcp__memory__.*). Le champ if filtre par règle de permission, ex : \"Bash(rm *)\" ou \"Edit(*.ts)\".",
    ],
    snippets: [
      {
        language: "json",
        filename: "settings.json — bloquer rm via PreToolUse",
        code: `{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "if": "Bash(rm *)",
            "command": "\\"$CLAUDE_PROJECT_DIR\\"/.claude/hooks/block-rm.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}`,
      },
      {
        language: "bash",
        filename: ".claude/hooks/block-rm.sh",
        code: `#!/bin/bash
COMMAND=$(jq -r '.tool_input.command' < /dev/stdin)
if echo "$COMMAND" | grep -q 'rm -rf'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "rm -rf is blocked by policy"
    }
  }'
  exit 0
fi
exit 0`,
      },
    ],
    sources: [
      {
        label: "code.claude.com — Hooks",
        href: "https://code.claude.com/docs/en/hooks",
      },
      {
        label: "code.claude.com — Settings",
        href: "https://code.claude.com/docs/en/settings",
      },
    ],
  },
  {
    id: "commands-skills",
    number: "05",
    title: "Slash commands & skills",
    subtitle: "Les skills ont absorbé les slash commands",
    intro:
      "Dans le Claude Code moderne, les slash commands custom ont été fusionnés dans les skills : un fichier .claude/commands/deploy.md et un skill .claude/skills/deploy/SKILL.md créent tous deux /deploy avec le même comportement. Les skills sont la forme recommandée parce qu'ils vivent dans un dossier (tu peux bundler scripts, templates, refs à côté), supportent un frontmatter plus riche, et Claude peut les auto-trigger quand la requête match leur description. Les .md restent supportés pour la compat. Utilise un .md pour un prompt template one-shot, un skill quand tu as besoin de fichiers de support, d'auto-trigger, ou de permissions tool par skill.",
    bullets: [
      "Where they live : Personal ~/.claude/skills/<name>/SKILL.md (tous projets). Project .claude/skills/<name>/SKILL.md (committé). Plugin <plugin>/skills/<name>/SKILL.md (namespacé plugin:skill). Précédence : enterprise > personal > project. Si skill et legacy command ont le même nom, le skill gagne.",
      "Frontmatter (tout est optionnel sauf description) : name, description (drive l'auto-trigger, max 1536 chars), argument-hint, arguments, allowed-tools, disable-model-invocation, user-invocable, model, effort, context: fork + agent, paths (glob), hooks, shell.",
      "Substitution d'arguments : $ARGUMENTS (full string), $ARGUMENTS[N] ou $N pour positionnel, $name pour args déclarés en frontmatter. Plus env-style : ${CLAUDE_SESSION_ID}, ${CLAUDE_EFFORT}, ${CLAUDE_SKILL_DIR}.",
      "Injection dynamique : `!command` (inline) ou bloc fenced ```! exécutés AVANT que Claude voie le prompt — la sortie remplace le placeholder. Pratique pour grounder le skill dans des données live (!`git diff HEAD`).",
      "Lifecycle : les descriptions de skills sont toujours en contexte (Claude peut piquer). Le SKILL.md complet ne charge qu'à l'invocation, puis reste en contexte le reste de la session. L'auto-compaction garde la dernière invocation de chaque skill (5K tokens max, 25K combiné).",
    ],
    snippets: [
      {
        language: "markdown",
        filename: ".claude/commands/commit.md (legacy form)",
        code: `---
description: Stage and commit current changes with a one-line message
argument-hint: [message]
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git status *)
---
Run \`git status\`, stage all changes, and commit them with the message: $ARGUMENTS`,
      },
      {
        language: "yaml",
        filename: "~/.claude/skills/summarize-changes/SKILL.md",
        code: `---
name: summarize-changes
description: Summarizes uncommitted changes and flags risks. Use when the user asks what changed, wants a commit message, or wants to review their diff.
allowed-tools: Bash(git *)
---
## Current changes
!\`git diff HEAD\`

## Instructions
Summarize the diff in 2-3 bullets, then list risks (missing tests,
hardcoded values, error handling). If empty, say so.`,
      },
    ],
    sources: [
      {
        label: "code.claude.com — Skills",
        href: "https://code.claude.com/docs/en/skills",
      },
      {
        label: "code.claude.com — Slash commands",
        href: "https://code.claude.com/docs/en/slash-commands",
      },
    ],
  },
  {
    id: "mcp",
    number: "06",
    title: "MCP servers",
    subtitle: "Le port USB-C des applis IA",
    intro:
      "Le Model Context Protocol (MCP) est un standard ouvert — Anthropic-led, désormais supporté par Claude, ChatGPT, VS Code, Cursor et d'autres — pour connecter une appli IA à des outils et sources de données externes. Les docs le décrivent comme \"un port USB-C pour les applis IA\" : un format de wire, plein de clients et serveurs possibles. Un serveur MCP expose 3 primitives à un host comme Claude Code : tools (fonctions appelables), resources (data lisibles), prompts (templates). Claude Code est le client/host qui monte ces serveurs et expose leurs tools au modèle. Transports : stdio (sous-process local) ou HTTP (recommandé pour cloud).",
    bullets: [
      "Install avec claude mcp add. L'ordre compte : toutes les options AVANT le nom, puis -- sépare le nom du serveur de la commande. HTTP : claude mcp add --transport http notion https://mcp.notion.com/mcp. Stdio : claude mcp add --transport stdio --env KEY=val myserver -- npx -y @scope/server.",
      "Trois scopes. local (défaut, projet courant, ~/.claude.json sous le path du projet, privé). project (.mcp.json committé à la racine du repo, partagé team — Claude prompte avant 1ère utilisation, reset via claude mcp reset-project-choices). user (tous tes projets). Plus enterprise via managed.",
      "Auth & resilience : /mcp lance les flux OAuth 2.0 pour les serveurs distants. Claude Code supporte les notifications list_changed pour hot-update du catalogue tools/prompts/resources. HTTP/SSE auto-reconnect avec backoff exponentiel (5 tentatives max). Stdio = pas d'auto-restart.",
      "Primitives : tools, resources, prompts. Le panneau /mcp affiche le nombre de tools par serveur et flag les serveurs qui annoncent la capability tools mais n'en exposent aucun.",
      "Serveurs utiles dans la nature : Notion, Stripe, PayPal, Asana, Airtable. Le registry github.com/modelcontextprotocol/servers en héberge des centaines. Anthropic prévient explicitement de vetter ce qu'on installe — c'est du code tiers.",
    ],
    snippets: [
      {
        language: "json",
        filename: ".mcp.json — projet committé",
        code: `{
  "mcpServers": {
    "airtable": {
      "command": "npx",
      "args": ["-y", "airtable-mcp-server"],
      "env": {
        "AIRTABLE_API_KEY": "\${AIRTABLE_API_KEY}"
      }
    }
  }
}`,
      },
      {
        language: "bash",
        filename: "Equivalent CLI (user scope)",
        code: `claude mcp add --transport stdio --scope user \\
  --env AIRTABLE_API_KEY=YOUR_KEY \\
  airtable -- npx -y airtable-mcp-server`,
      },
    ],
    sources: [
      {
        label: "code.claude.com — MCP",
        href: "https://code.claude.com/docs/en/mcp",
      },
      {
        label: "modelcontextprotocol.io — Introduction",
        href: "https://modelcontextprotocol.io/introduction",
      },
      {
        label: "github.com/modelcontextprotocol/servers",
        href: "https://github.com/modelcontextprotocol/servers",
      },
    ],
  },
  {
    id: "plugins",
    number: "07",
    title: "Plugins",
    subtitle: "Bundler skills, hooks, agents, MCP en un seul package",
    intro:
      "Un plugin Claude Code est un bundle versionné qui étend Claude Code avec des skills, sous-agents, hooks, slash commands, MCP servers, LSP servers, monitors background, et même des settings par défaut — le tout en un dossier. C'est la forme \"shippable\" au-dessus des configs .claude/ standalone : manifest .claude-plugin/plugin.json, namespace (un skill hello dans my-first-plugin devient /my-first-plugin:hello, évite les collisions), et distribution via plugin marketplaces — catalogues git-hosted déclarés dans marketplace.json, ajoutés avec /plugin marketplace add. Comme installer un plugin importe ses skills/hooks/binaires, traite les marketplaces comme une supply chain.",
    bullets: [
      "Identifié par <plugin>/.claude-plugin/plugin.json avec name, description, version (et optionnel author, repository, license). Le name devient le préfixe namespace de chaque skill embarqué.",
      "Composants à la racine du plugin (PAS dans .claude-plugin/) : skills/<name>/SKILL.md, agents/, hooks/hooks.json, commands/, .mcp.json, .lsp.json, monitors/monitors.json, bin/ (ajouté au PATH quand plugin actif), settings.json top-level.",
      "Dev local : claude --plugin-dir ./my-plugin (répétable pour plusieurs plugins) ou --plugin-url https://.../plugin.zip pour tester une archive. /reload-plugins pour picker les changes mid-session.",
      "Distribution via marketplaces : marketplace.json liste plugins et types de source (git, local). User install via /plugin marketplace add <repo> puis /plugin install <name>. Versioning via le champ version (sinon git commit SHA, chaque commit = nouvelle release).",
      "Hygiène supply chain : mêmes considérations que --plugin-url, --plugin-dir et marketplaces ajoutées — n'importe que ce que tu contrôles ou trustes. Pour plugins team, héberge la marketplace en repo git privé.",
    ],
    snippets: [
      {
        language: "json",
        filename: "my-first-plugin/.claude-plugin/plugin.json",
        code: `{
  "name": "my-first-plugin",
  "description": "A greeting plugin to learn the basics",
  "version": "1.0.0",
  "author": { "name": "Your Name" }
}`,
      },
      {
        language: "bash",
        filename: "Install / dev loop",
        code: `# Load a plugin directly from a directory (dev loop)
claude --plugin-dir ./my-first-plugin

# In-session: add a marketplace and install from it
/plugin marketplace add anthropics/claude-code
/plugin install <plugin-name>
/reload-plugins`,
      },
    ],
    sources: [
      {
        label: "code.claude.com — Plugins",
        href: "https://code.claude.com/docs/en/plugins",
      },
      {
        label: "code.claude.com — Plugin marketplaces",
        href: "https://code.claude.com/docs/en/plugin-marketplaces",
      },
    ],
  },
  {
    id: "agent-sdk",
    number: "08",
    title: "Agent SDK",
    subtitle: "Embarquer la même boucle agentique dans ton appli",
    intro:
      "Le Claude Agent SDK (renommé depuis Claude Code SDK) embarque dans tes propres programmes la boucle agentique, l'exécution d'outils et la gestion de contexte qui font tourner le CLI Claude Code. Disponible en Python (pip install claude-agent-sdk, Python 3.10+) et TypeScript (npm install @anthropic-ai/claude-agent-sdk, Node 18+). Le SDK ship avec les built-in tools (Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, AskUserQuestion), supporte les hooks, spawn des sous-agents via le tool Agent, et peut wirer des MCP servers et des sessions persistantes resumables par session_id. À utiliser pour CI/CD, applis custom, automation prod ; le CLI interactif reste meilleur pour le dev exploratoire.",
    bullets: [
      "Deux entry points : query(prompt, options) async iterator one-shot, et ClaudeSDKClient (Python) / async iteration (TS) pour conversations multi-tours avec custom tools et hooks.",
      "ClaudeAgentOptions est le bouton central : system_prompt, max_turns, allowed_tools (auto-approval), disallowed_tools, permission_mode (ex acceptEdits), cwd, mcp_servers, hooks, agents (sous-agents).",
      "Sous-agents first-class : déclarés via AgentDefinition (Python) ou agents map (TS) avec description/prompt/tools, puis inclure \"Agent\" dans allowedTools pour que le main agent puisse les invoquer. Les messages d'un sous-agent portent parent_tool_use_id pour le tracing.",
      "Le SDK charge les configs .claude/ par défaut (skills, slash commands, CLAUDE.md, plugins). Restreindre via setting_sources / settingSources pour un agent hermétique.",
      "Auth via ANTHROPIC_API_KEY avec support env-flag pour Amazon Bedrock (CLAUDE_CODE_USE_BEDROCK=1), Google Vertex AI (CLAUDE_CODE_USE_VERTEX=1), Microsoft Azure AI Foundry (CLAUDE_CODE_USE_FOUNDRY=1). Opus 4.7 (claude-opus-4-7) requiert SDK ≥ v0.2.111.",
    ],
    snippets: [
      {
        language: "python",
        filename: "Agent Python minimal — Claude exécute la boucle",
        code: `import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Find and fix the bug in auth.py",
        options=ClaudeAgentOptions(allowed_tools=["Read", "Edit", "Bash"]),
    ):
        print(message)

asyncio.run(main())`,
      },
      {
        language: "typescript",
        filename: "Équivalent TypeScript",
        code: `import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Find and fix the bug in auth.ts",
  options: { allowedTools: ["Read", "Edit", "Bash"] }
})) {
  console.log(message);
}`,
      },
    ],
    sources: [
      {
        label: "code.claude.com — Agent SDK overview",
        href: "https://code.claude.com/docs/en/agent-sdk/overview",
      },
      {
        label: "github.com/anthropics/claude-agent-sdk-python",
        href: "https://github.com/anthropics/claude-agent-sdk-python",
      },
      {
        label: "github.com/anthropics/claude-agent-sdk-typescript",
        href: "https://github.com/anthropics/claude-agent-sdk-typescript",
      },
    ],
  },
];
