# Carte du site claude-code-codex

## Écrans

- `/case-studies/pourquoi-cadence/` (L73, D-2) — « Pourquoi cadence » : les cinq besoins de Sylvain (8 nov. 2026),
  la définition en une phrase (`data-definition`), un schéma besoin → pièce (`data-schema="besoins-mecanismes"`,
  viewBox 340 de large, plafonné à 26rem au bureau), les preuves chiffrées (`data-chiffre`, chacune avec date et
  source `docs/…` du dépôt cadence, lien GitHub), « Ce que les mesures ne prouvent pas » (`data-limites`), puis
  l'installation npm et les liens dépôt / paquet. Lien depuis « Pour aller plus loin » de `/case-studies/cadence/`.

## Décisions

- Un chiffre de cadence n'entre sur le site qu'avec sa date et le fichier du dépôt cadence qui le porte ; les chiffres
  défavorables sont dits sur la même page (L73).
- Revue L73 (19-11) : de la publication 2.0.0, seule la séquence AetherWX est citée (1990 s contre 2470 s, 18 contre
  12 tests, 0 contre 2 régressions, mais 2 contre 1 défauts et juge aveugle pour Claude seul) ; le cumul n'est plus
  présenté (demandes isolées = deux bras identiques) ; la garde rouge de la 2.0.0 est dans les limites. Aucune
  citation de Sylvain qui ne soit dans le dépôt cadence ; la liste des besoins renvoie à 2026-11-08-banc-sequence-design.md.
- D-2 reste « ouverte » tant que la page n'est pas en ligne : c'est le lead qui la passe à « livrée » (URL + sha).
- La page n'est pas une carte de l'index des études : l'index compte les apps (test R10 de cadence-case-study).
- Où publier hors du codex : proposition dans le rapport du run L73 seulement, rien publié sans accord de Sylvain.
- Les données Nouveautés (`public/nouveautes-data/`) sont régénérées par `cadence run` avant la porte (L781 de
  cadence) : une session de run ne lance pas `npm run news`.

## Tests

- `frontend/tests/l73-pourquoi-cadence.e2e.test.mjs` (lit `dist`) : besoins, définition, chiffres datés et sourcés,
  limites, liens, rien de privé, R12 : chaque nombre (`data-nombres`) cherché dans le fichier `data-source` du dépôt
  cadence quand il est à côté (CADENCE_REPO, ../cadence, ../../cadence ; sinon ignoré), pas de défilement latéral, texte du schéma ≥ 11 px et dans ses cadres à 390 et 1440 px.
