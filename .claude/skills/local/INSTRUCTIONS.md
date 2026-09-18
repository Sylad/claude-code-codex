# Installation du skill `/local`

Prérequis : Ollama (≥ 0.24) avec un modèle à appel d'outils (`qwen3-coder:30b`,
`qwen3:32b`…), et `claude-local` dans le PATH :
`ln -sf ~/projects/developpeur/claude-code-codex/scripts/claude-local.sh ~/.local/bin/claude-local`

Trois façons d'installer le skill :

1. **Projet-local** (par défaut) : il vit dans `claude-code-codex/.claude/skills/local/`,
   disponible seulement quand Claude Code est lancé dans ce dépôt.
2. **Global utilisateur** : `cp -r .claude/skills/local ~/.claude/skills/`.
3. **Symlink pour éditer en direct** (choisi le 2026-09-18) :
   `ln -s "$(pwd)/.claude/skills/local" ~/.claude/skills/local`
   — toute modification dans le dépôt est immédiatement globale.
