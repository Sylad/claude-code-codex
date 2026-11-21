---
title: "Page Écosystème : des commandes lisibles et vraiment exécutables"
date: 2026-11-21
created: 2026-11-21T16:30+01:00
lots: [L6]
captures:
  - { file: captures/L6-ecosystem-commande-avant-1440.png, alt: "Avant : la carte mcp-builder affiche « $ Clone anthropics/skills/skills… », une phrase coupée présentée comme une commande à copier" }
  - { file: captures/L6-ecosystem-commande-apres-1440.png, alt: "Après : la même carte affiche en entier, sur trois lignes, la commande npx degit qui copie la skill dans le dossier des skills" }
  - { file: captures/L6-ecosystem-consigne-apres-1440.png, alt: "Après : la carte Model Context Protocol présente une consigne encadrée en pointillés, sans signe dollar ni bouton copier" }
  - { file: captures/L6-ecosystem-community-avant-1440.png, alt: "Avant : la section community, après avoir coché « Anthropic-officiel uniquement », affiche 0 / 1 entrées et un message vide" }
  - { file: captures/L6-ecosystem-community-apres-1440.png, alt: "Après : la section community montre directement sa carte fable-mode, sans barre de filtres" }
  - { file: captures/L6-ecosystem-filtre-copie-apres-390.png, alt: "Après, au téléphone : le filtre Skill actif, 15 / 41 entrées, et la commande de la skill pdf lisible en entier, marquée « copié »" }
---
La page [Écosystème](/ecosystem/) a été passée en revue au bureau et au téléphone, avec les règles d'accessibilité du Web. Huit défauts ont été corrigés.

- **Des commandes qui marchent** : quinze cartes affichaient une phrase (« Clone … dans ton dossier skills », « Voir les SDKs sur … ») derrière un signe « $ » et un bouton copier ; collée dans un terminal, elle échouait. Les skills officielles ont maintenant une vraie commande, qui copie le dossier de la skill dans `~/.claude/skills/`. Quand il n'existe pas de commande unique (le protocole MCP, fable-mode), la carte affiche une consigne, sans « $ » ni bouton.
- **La commande se lit avant d'être copiée** : 41 commandes sur 42 étaient coupées par des points de suspension. Elles passent maintenant à la ligne et se lisent en entier, au bureau comme au téléphone.
- **Le mot « copier » se lit** : il était à 2,9 contre 1, sous le minimum de 4,5 contre 1.
- **Filtres et lecteurs d'écran** : un lecteur d'écran annonce désormais quels filtres de catégorie sont actifs, le nombre d'entrées affichées quand il change, et la copie d'une commande.
- **Recherche** : chaque champ porte un nom propre à sa section, et un cadre orangé plein le signale quand il a le focus (il était presque invisible).
- **Section community** : la case « Anthropic-officiel uniquement » ne pouvait que vider cette section ; elle disparaît des deux sections, déjà séparées. Avec une seule entrée, la section community n'a plus de barre de filtres.
- **Texte agrandi** : avec la police du navigateur à 200 %, un long lien de l'encart « Critères du catalogue » faisait défiler la page sur le côté au téléphone ; il passe maintenant à la ligne.
- **Finitions** : libellés « Serveur MCP » et « Outil / SDK », petits textes qui suivent la taille de police choisie, pointeur de clic sur les boutons, et l'encart « Critères » ne dit plus que le catalogue n'a que des entrées officielles.

Un test par défaut refait ces mesures sur la page construite ; chacun échouait sur l'ancienne version.
