---
title: "Page Vidéos : des filtres clairs et un texte agrandi sans mots coupés"
date: 2026-11-23
created: 2026-11-23T09:10+01:00
lots: [L10]
captures:
  - { file: captures/L10-videos-filtres-avant-390.png, alt: "Avant, au téléphone : les filtres de la page Vidéos proposent « Playlist 0 », qui ne mène à rien, et le compteur annonce « 15 / 15 vidéos » alors que la liste contient aussi des chaînes" }
  - { file: captures/L10-videos-filtres-apres-390.png, alt: "Après, au téléphone : seuls les filtres Chaîne et Vidéo restent, la case s'appelle « Officiel Anthropic » et le compteur dit « 15 / 15 chaînes et vidéos »" }
  - { file: captures/L10-videos-texte-200-avant-320.png, alt: "Avant, sur un petit téléphone avec le texte agrandi deux fois : la colonne est étroite, « Anthropic » et « walkthroughs » sont coupés au milieu et les petites étiquettes des cartes restent minuscules" }
  - { file: captures/L10-videos-texte-200-apres-320.png, alt: "Après, même réglage : la colonne est plus large, les mots tiennent entiers et les étiquettes Chaîne, EN et officiel ont grandi avec le reste du texte" }
---
La page [Vidéos](/videos/) a été passée en revue au bureau, au téléphone et avec le texte agrandi deux fois, avec les règles d'accessibilité du Web. Rien ne déborde sur le côté ; neuf défauts ont été corrigés.

- **Filtres** : le filtre « Playlist », qui ne comptait aucune entrée, ne menait qu'à une liste vide ; il n'est plus proposé. Un lecteur d'écran dit si chaque filtre est actif, et annonce le nombre d'entrées affichées quand il change.
- **Compteur** : il disait « 15 / 15 vidéos » en comptant les chaînes ; il dit maintenant « chaînes et vidéos ». Le nombre de chaque filtre passe de 4,3 à plus de 4,5 contre 1, le minimum.
- **Champ de recherche** : il est nommé « Rechercher une chaîne ou une vidéo » pour les lecteurs d'écran et porte, au clavier, un anneau orangé plein au lieu d'un contour à peine visible.
- **Aucun résultat** : le message dit « Aucune chaîne ni vidéo ne correspond à ces filtres », avec un seul bouton « Réinitialiser », assez grand pour le doigt.
- **Titres** : les cartes ont de vrais titres de section, et les cinq titres de vidéos en anglais sont prononcés avec la voix anglaise.
- **Texte agrandi** : les petites étiquettes des cartes grandissent avec le texte ; sur un petit téléphone, les marges ne grandissent plus avec lui, et les mots coupés au milieu passent de 39 à 2.

Un test refait ces mesures sur la page construite ; il échouait sur l'ancienne version.
