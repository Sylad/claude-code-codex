#!/usr/bin/env bash
# Contrôle du patch produit par le job « refresh » du batch hebdomadaire, avant que le
# job « commit » (jeton en écriture) ne l'applique.
#
# Le batch n'écrit que frontend/src/data/feeds/<source>.json (scripts/lib/feeds.ts).
# Le patch est refusé EN ENTIER (code 1, chaque motif journalisé) s'il contient :
#   - un chemin hors de frontend/src/data/feeds/*.json (sous-dossier compris) ;
#   - un fichier binaire ;
#   - un renommage, une copie ou une suppression ;
#   - un lien symbolique, un exécutable ou un changement de mode (tout mode autre que 100644).
# Usage : controle-patch.sh <patch>   (à lancer dans le dépôt, avant git apply)
set -euo pipefail

patch=${1:?usage: controle-patch.sh <patch>}
[[ -f "$patch" ]] || { echo "controle-patch : fichier introuvable : $patch" >&2; exit 2; }

autorise='^frontend/src/data/feeds/[A-Za-z0-9_-][A-Za-z0-9._-]*\.json$'
refus=0

refuser() {
  refus=$((refus + 1))
  echo "::error title=Patch du batch refusé::$1"
  echo "refusé : $1" >&2
}

# 1. Le patch doit être lisible par git apply (sinon on ne sait pas ce qu'il ferait).
numstat=$(mktemp)
trap 'rm -f "$numstat" "$numstat.err"' EXIT
if ! git apply --numstat -z -- "$patch" >"$numstat" 2>"$numstat.err"; then
  refuser "patch illisible par git apply : $(cat "$numstat.err")"
  rm -f "$numstat.err"
  exit 1
fi
rm -f "$numstat.err"

# 2. Chaque fichier touché : texte, chemin autorisé. Lecture champ par champ (séparateur
#    NUL, aucun chemin ne peut s'y glisser). git apply --numstat ne donne que le chemin
#    d'arrivée d'un renommage ou d'une copie : ceux-ci sont refusés à l'étape 3.
nb=0
while IFS= read -r -d '' champ; do
  nb=$((nb + 1))
  ajout=${champ%%$'\t'*}
  reste=${champ#*$'\t'}
  retrait=${reste%%$'\t'*}
  chemin=${reste#*$'\t'}
  if [[ "$ajout" == "-" || "$retrait" == "-" ]]; then
    refuser "fichier binaire : $chemin"
  fi
  if [[ ! "$chemin" =~ $autorise ]]; then
    refuser "chemin hors de frontend/src/data/feeds/*.json : $(printf '%q' "$chemin")"
  fi
done <"$numstat"

if (( nb == 0 )); then
  refuser "aucun fichier reconnu dans un patch non vide"
fi

# 3. Créations, suppressions, renommages, changements de mode, d'après git apply --summary.
#    Seule la création d'un fichier ordinaire (100644) est admise ; « rewrite » est une
#    simple réécriture du contenu.
summary=$(git apply --summary -- "$patch")
while IFS= read -r ligne; do
  [[ -z "$ligne" ]] && continue
  case "$ligne" in
    " create mode 100644 "*) ;;
    " rewrite "*) ;;
    *) refuser "opération non admise :${ligne}" ;;
  esac
done <<<"$summary"

# 4. Les modes déclarés dans les en-têtes (y compris la ligne « index » d'un lien
#    symbolique existant modifié, que --summary ne liste pas). Une ligne de contenu
#    commence toujours par « + », « - », « espace » ou « \ » : ces en-têtes ne peuvent
#    pas en être.
while IFS= read -r ligne; do
  refuser "mode non admis : $ligne"
done < <(grep -E '^(old mode|new mode|new file mode|deleted file mode|index [0-9a-f]+\.\.[0-9a-f]+) ' -- "$patch" \
  | grep -vE '^(new file mode 100644|index [0-9a-f]+\.\.[0-9a-f]+ 100644)$' || true)

if (( refus > 0 )); then
  echo "controle-patch : $refus motif(s) de refus, patch NON appliqué." >&2
  exit 1
fi
echo "controle-patch : $nb fichier(s), tous sous frontend/src/data/feeds/*.json, patch admis."
