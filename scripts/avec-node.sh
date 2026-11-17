#!/usr/bin/env bash
# Lance une commande avec le Node de .nvmrc (Astro 7 exige Node >= 22.23.4).
# Les portes de cadence héritent du PATH du processus qui les lance, où un Node plus
# ancien peut passer en tête (vécu le 17-11 au passage à Astro 7 : v22.22.3) ; ce script
# choisit la version du dépôt au lieu du premier `node` trouvé.
# Usage : scripts/avec-node.sh <commande> [arguments…]
set -euo pipefail
racine="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
voulu="$(tr -d '[:space:]' < "$racine/.nvmrc")"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  set +u
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh" --no-use
  nvm use --silent "$voulu" >/dev/null || { echo "avec-node : Node $voulu absent, lancer « nvm install $voulu »" >&2; exit 1; }
  set -u
fi
exec "$@"
