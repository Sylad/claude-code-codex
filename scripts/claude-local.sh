#!/usr/bin/env bash
# claude-local — le harness Claude Code piloté par un modèle Ollama local (RTX 5090),
# hors quota Anthropic. Validé le 2026-09-18 : qwen3-coder:30b (défaut, 12 s à chaud,
# 2 s en cache, 100 % GPU) et qwen3:32b (~16 s), --bare, 3 tours.
#
# Usage :
#   claude-local "prompt" [options claude...]      # headless (-p), sortie texte
#   claude-local "prompt" --tools "Read,Glob"      # limiter les outils (variadique : après le prompt)
#   claude-local -i [options claude...]            # session interactive
#   CLAUDE_LOCAL_MODEL=qwen3-coder:30b claude-local "prompt"
#
# Pourquoi --bare : le harness complet (plugins, MCP, skills, CLAUDE.md) dépasse
# 32k tokens de prompt système ; Ollama tronque et le modèle ne voit pas la consigne.
# --bare + --strict-mcp-config descend à ~1,7k tokens.
# CLAUDE_LOCAL_CTX doit égaler OLLAMA_CONTEXT_LENGTH du serveur (32768 par défaut).
set -euo pipefail

MODEL="${CLAUDE_LOCAL_MODEL:-qwen3-coder:30b}"
OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
CTX="${CLAUDE_LOCAL_CTX:-32768}"

if ! curl -s -m 3 "$OLLAMA_URL/api/version" >/dev/null; then
  echo "claude-local: Ollama ne répond pas sur $OLLAMA_URL — lancer : OLLAMA_CONTEXT_LENGTH=$CTX ollama serve" >&2
  exit 2
fi

if [ "${1:-}" = "-i" ]; then
  shift; mode=()
else
  [ $# -ge 1 ] || { echo "usage: claude-local \"prompt\" [options] | claude-local -i" >&2; exit 1; }
  mode=(-p "$1"); shift
fi

exec env -u CLAUDECODE \
  ANTHROPIC_BASE_URL="$OLLAMA_URL" \
  ANTHROPIC_API_KEY=ollama \
  CLAUDE_CODE_MAX_CONTEXT_TOKENS="$CTX" \
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 \
  claude "${mode[@]}" --bare --strict-mcp-config --model "$MODEL" "$@" ${mode:+< /dev/null}
