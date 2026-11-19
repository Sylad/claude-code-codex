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
- La page n'est pas une carte de l'index des études : l'index compte les apps (test R10 de cadence-case-study).
- Où publier hors du codex : proposition dans le rapport du run L73 seulement, rien publié sans accord de Sylvain.
- Les données Nouveautés (`public/nouveautes-data/`) sont régénérées par `cadence run` avant la porte (L781 de
  cadence) : une session de run ne lance pas `npm run news`.

## Tests

- `frontend/tests/l73-pourquoi-cadence.e2e.test.mjs` (lit `dist`) : besoins, définition, chiffres datés et sourcés,
  limites, liens, rien de privé, pas de défilement latéral, texte du schéma ≥ 11 px et dans ses cadres à 390 et 1440 px.
