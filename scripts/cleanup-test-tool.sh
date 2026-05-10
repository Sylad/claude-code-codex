#!/usr/bin/env bash
#
# cleanup-test-tool.sh — Rollback complet d'un plugin Claude Code mal-comporté
# (testé puis rejeté par le skill /test-tool).
#
# Usage:
#   ./scripts/cleanup-test-tool.sh <plugin-id> <marketplace-id>
#
# Exemples:
#   ./scripts/cleanup-test-tool.sh claude-mem@thedotmack thedotmack
#   ./scripts/cleanup-test-tool.sh ruflo-core@ruflo ruflo
#
# Ce script doit être lancé par l'utilisateur (et non par Claude lui-même),
# car le hook Self-Modification protège les modifications de ~/.claude/settings.json
# via Claude. L'utilisateur étant le owner légitime, il peut faire ces modifs.

set -euo pipefail

PLUGIN_ID="${1:-}"
MARKETPLACE_ID="${2:-}"

if [[ -z "$PLUGIN_ID" || -z "$MARKETPLACE_ID" ]]; then
  cat <<'EOF'
Usage: ./scripts/cleanup-test-tool.sh <plugin-id> <marketplace-id>

Where:
  <plugin-id>      = key in ~/.claude/plugins/installed_plugins.json
                     and ~/.claude/settings.json["enabledPlugins"]
                     (e.g. "claude-mem@thedotmack" or "ruflo-core@ruflo")
  <marketplace-id> = key in ~/.claude/plugins/known_marketplaces.json
                     and folder name in ~/.claude/plugins/{marketplaces,cache}/
                     (e.g. "thedotmack" or "ruflo")

Effects:
  1. Remove plugin from installed_plugins.json
  2. Remove marketplace from known_marketplaces.json
  3. Remove enabledPlugins[<plugin-id>] from settings.json (with .bak backup)
  4. rm -rf ~/.claude/plugins/marketplaces/<marketplace-id>/
  5. rm -rf ~/.claude/plugins/cache/<marketplace-id>/

EOF
  exit 1
fi

CLAUDE_DIR="$HOME/.claude"
PLUGINS_DIR="$CLAUDE_DIR/plugins"
SETTINGS="$CLAUDE_DIR/settings.json"

echo "→ Cleanup plugin '$PLUGIN_ID' from marketplace '$MARKETPLACE_ID'"
echo ""

# 1. installed_plugins.json
echo "[1/5] Removing from installed_plugins.json..."
node -e "
const fs = require('fs');
const f = '$PLUGINS_DIR/installed_plugins.json';
if (!fs.existsSync(f)) { console.log('   (file not found)'); process.exit(0); }
const d = JSON.parse(fs.readFileSync(f, 'utf8'));
if (d.plugins && d.plugins['$PLUGIN_ID']) {
  delete d.plugins['$PLUGIN_ID'];
  fs.writeFileSync(f, JSON.stringify(d, null, 2));
  console.log('   ✓ removed');
} else {
  console.log('   (not present)');
}
"

# 2. known_marketplaces.json
echo "[2/5] Removing from known_marketplaces.json..."
node -e "
const fs = require('fs');
const f = '$PLUGINS_DIR/known_marketplaces.json';
if (!fs.existsSync(f)) { console.log('   (file not found)'); process.exit(0); }
const d = JSON.parse(fs.readFileSync(f, 'utf8'));
if (d['$MARKETPLACE_ID']) {
  delete d['$MARKETPLACE_ID'];
  fs.writeFileSync(f, JSON.stringify(d, null, 2));
  console.log('   ✓ removed');
} else {
  console.log('   (not present)');
}
"

# 3. settings.json (enabledPlugins)
echo "[3/5] Removing from settings.json enabledPlugins..."
if [[ -f "$SETTINGS" ]]; then
  cp -f "$SETTINGS" "$SETTINGS.bak.$(date +%s)"
  node -e "
  const fs = require('fs');
  const f = '$SETTINGS';
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (d.enabledPlugins && d.enabledPlugins['$PLUGIN_ID'] !== undefined) {
    delete d.enabledPlugins['$PLUGIN_ID'];
    fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
    console.log('   ✓ removed (backup at $SETTINGS.bak.<ts>)');
  } else {
    console.log('   (not present)');
  }
  "
else
  echo "   (settings.json not found)"
fi

# 4 & 5. marketplaces and cache directories
echo "[4/5] rm -rf $PLUGINS_DIR/marketplaces/$MARKETPLACE_ID/"
if [[ -d "$PLUGINS_DIR/marketplaces/$MARKETPLACE_ID" ]]; then
  rm -rf "$PLUGINS_DIR/marketplaces/$MARKETPLACE_ID"
  echo "   ✓ removed"
else
  echo "   (not present)"
fi

echo "[5/5] rm -rf $PLUGINS_DIR/cache/$MARKETPLACE_ID/"
if [[ -d "$PLUGINS_DIR/cache/$MARKETPLACE_ID" ]]; then
  rm -rf "$PLUGINS_DIR/cache/$MARKETPLACE_ID"
  echo "   ✓ removed"
else
  echo "   (not present)"
fi

echo ""
echo "✅ Cleanup done."
echo ""
echo "Verify:"
echo "  grep -c '$PLUGIN_ID' \$HOME/.claude/settings.json   # should be 0"
echo "  grep -c '$PLUGIN_ID' \$HOME/.claude/plugins/installed_plugins.json   # should be 0"
echo "  ls \$HOME/.claude/plugins/marketplaces/$MARKETPLACE_ID 2>&1   # should be 'No such file'"
