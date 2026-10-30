# Audit de lisibilité du site (L49)

Demande de Sylvain du 30-10 : du texte, mais aussi des schémas et des images ; lisible, pas rebutant.
Cet audit **ne modifie rien** : il mesure le site construit et classe les pages à reprendre.
La reprise elle-même est un autre travail (un lot par page ou par groupe de pages).

## Relancer

```bash
cd frontend && npx astro build && npm run audit
```

`npm run audit` lit `frontend/dist` et écrit le rapport Markdown sur la sortie standard
(code de sortie 1 s'il n'y a aucune page construite). Le calcul est dans
`frontend/src/lib/lisibilite.mjs`, testé par `frontend/tests/lisibilite.test.mjs`.

## Ce qui est mesuré, par page

Tout se mesure dans `<main>` (barre de navigation et pied de page exclus).

- **Mots** : texte visible, hors script, style et SVG ; le texte des intertitres ne compte pas.
- **Schémas** : SVG portant `role="img"` (composant `Schema`) et diagrammes Mermaid. Les icônes
  (`aria-hidden`) ne comptent pas.
- **Images** : `<img>` avec un `alt` non vide. Les fonds décoratifs (`alt=""`, par exemple le héros)
  ne comptent pas.
- **Plus long bloc sans intertitre** : plus grand nombre de mots d'un seul tenant entre deux
  titres `h1`–`h6` (ou avant le premier, après le dernier). Un schéma ou une image ne coupe pas le bloc.

## « Mur de texte »

Une page est à reprendre si l'un des deux motifs s'applique (seuils dans `SEUILS`, à ajuster si
besoin) :

- **bloc long** : 400 mots ou plus d'un seul tenant sans intertitre (environ 2 minutes de lecture) ;
- **sans visuel** : 800 mots ou plus sans aucun schéma ni image.

L'ordre de priorité est le score `plus long bloc + mots / (1 + visuels)`, décroissant ; à égalité,
ordre alphabétique des routes. Les pages sans motif suivent, pour mémoire.

## Résultat du 30-10-2026

Site construit au commit 82afb35 ; pages mesurées : toutes les `index.html` de `dist`.

## Pages à reprendre (« mur de texte »), par ordre de priorité

| Rang | Page | Mots | Schémas | Images | Plus long bloc sans intertitre (mots) | Motif |
|---|---|---|---|---|---|---|
| 1 | `/theory/` | 2580 | 0 | 0 | 355 | 800 mots ou plus sans schéma ni image |
| 2 | `/argocd-k8s-pour-les-nuls/` | 2559 | 0 | 0 | 282 | 800 mots ou plus sans schéma ni image |
| 3 | `/case-studies/` | 2486 | 0 | 0 | 165 | 800 mots ou plus sans schéma ni image |
| 4 | `/case-studies/aetherwx-qa-harness/` | 2325 | 0 | 0 | 265 | 800 mots ou plus sans schéma ni image |
| 5 | `/start/` | 1801 | 0 | 0 | 305 | 800 mots ou plus sans schéma ni image |
| 6 | `/k8s-for-java-developers/` | 1643 | 0 | 0 | 268 | 800 mots ou plus sans schéma ni image |
| 7 | `/case-studies/hermes-agent/` | 1020 | 0 | 0 | 652 | bloc de 400 mots ou plus sans intertitre ; 800 mots ou plus sans schéma ni image |
| 8 | `/case-studies/maritime-atlas/` | 6255 | 2 | 8 | 1050 | bloc de 400 mots ou plus sans intertitre |
| 9 | `/ecosystem/` | 1236 | 0 | 0 | 97 | 800 mots ou plus sans schéma ni image |
| 10 | `/livre-de-bord/` | 2825 | 5 | 0 | 747 | bloc de 400 mots ou plus sans intertitre |
| 11 | `/case-studies/aetherwx-encyclopedia/` | 3425 | 4 | 1 | 591 | bloc de 400 mots ou plus sans intertitre |
| 12 | `/case-studies/code-review-graph/` | 654 | 0 | 0 | 419 | bloc de 400 mots ou plus sans intertitre |
| 13 | `/case-studies/drona23-token-efficient/` | 615 | 0 | 0 | 417 | bloc de 400 mots ou plus sans intertitre |
| 14 | `/case-studies/superclaude/` | 813 | 0 | 0 | 140 | 800 mots ou plus sans schéma ni image |

## Toutes les pages mesurées

| Page | Mots | Schémas | Images | Plus long bloc sans intertitre (mots) | État |
|---|---|---|---|---|---|
| `/theory/` | 2580 | 0 | 0 | 355 | à reprendre |
| `/argocd-k8s-pour-les-nuls/` | 2559 | 0 | 0 | 282 | à reprendre |
| `/case-studies/` | 2486 | 0 | 0 | 165 | à reprendre |
| `/case-studies/aetherwx-qa-harness/` | 2325 | 0 | 0 | 265 | à reprendre |
| `/start/` | 1801 | 0 | 0 | 305 | à reprendre |
| `/k8s-for-java-developers/` | 1643 | 0 | 0 | 268 | à reprendre |
| `/case-studies/hermes-agent/` | 1020 | 0 | 0 | 652 | à reprendre |
| `/case-studies/maritime-atlas/` | 6255 | 2 | 8 | 1050 | à reprendre |
| `/ecosystem/` | 1236 | 0 | 0 | 97 | à reprendre |
| `/livre-de-bord/` | 2825 | 5 | 0 | 747 | à reprendre |
| `/case-studies/aetherwx-encyclopedia/` | 3425 | 4 | 1 | 591 | à reprendre |
| `/case-studies/code-review-graph/` | 654 | 0 | 0 | 419 | à reprendre |
| `/case-studies/drona23-token-efficient/` | 615 | 0 | 0 | 417 | à reprendre |
| `/case-studies/superclaude/` | 813 | 0 | 0 | 140 | à reprendre |
| `/case-studies/k8s-migration-overnight/` | 3117 | 1 | 1 | 203 | ok |
| `/cloudflare-pour-les-nuls/` | 1856 | 2 | 0 | 353 | ok |
| `/case-studies/token-optimizers-2026/` | 768 | 0 | 0 | 169 | ok |
| `/case-studies/token-savior/` | 583 | 0 | 0 | 351 | ok |
| `/case-studies/ruflo/` | 594 | 0 | 0 | 315 | ok |
| `/case-studies/ol-companion/` | 1052 | 1 | 0 | 369 | ok |
| `/case-studies/ccproxy/` | 715 | 0 | 0 | 127 | ok |
| `/learning/` | 735 | 0 | 0 | 87 | ok |
| `/case-studies/warhammer40k/` | 966 | 1 | 0 | 330 | ok |
| `/case-studies/claude-code-templates/` | 682 | 0 | 0 | 125 | ok |
| `/videos/` | 574 | 0 | 0 | 118 | ok |
| `/about/` | 360 | 0 | 0 | 326 | ok |
| `/case-studies/claude-mem/` | 581 | 0 | 0 | 100 | ok |
| `/case-studies/alexgreensh-polyform/` | 530 | 0 | 0 | 145 | ok |
| `/case-studies/claude-code-codex/` | 891 | 1 | 0 | 223 | ok |
| `/case-studies/avatar-pandora/` | 883 | 1 | 0 | 207 | ok |
| `/case-studies/cadence/` | 1656 | 3 | 1 | 306 | ok |
| `/case-studies/evatosorus/` | 852 | 1 | 0 | 169 | ok |
| `/case-studies/finance-tracker/` | 1488 | 1 | 4 | 295 | ok |
| `/case-studies/jobmail-assistant/` | 693 | 1 | 0 | 187 | ok |
| `/atelier-ia/` | 592 | 1 | 0 | 122 | ok |
| `/plan-de-travail/` | 242 | 0 | 0 | 120 | ok |
| `/nouveautes/` | 1997 | 0 | 18 | 211 | ok |
| `/` | 134 | 0 | 0 | 67 | ok |

