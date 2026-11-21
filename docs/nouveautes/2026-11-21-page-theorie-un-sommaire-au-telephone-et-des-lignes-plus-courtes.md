---
title: "Page Théorie : un sommaire au téléphone et des lignes plus courtes"
date: 2026-11-21
created: 2026-11-21T14:10+01:00
lots: [L5]
captures:
  - { file: captures/L5-theorie-sommaire-avant-390.png, alt: "Avant, au téléphone : la page Théorie commence directement par la première section, sans sommaire pour rejoindre les sept autres" }
  - { file: captures/L5-theorie-sommaire-apres-390.png, alt: "Après, au téléphone : un sommaire ouvert en tête de page liste les huit sections, numérotées de 01 à 08" }
  - { file: captures/L5-theorie-lignes-avant-1440.png, alt: "Avant, au bureau : la section Context window, dont les paragraphes s'étirent sur toute la largeur, jusqu'à 108 caractères par ligne" }
  - { file: captures/L5-theorie-lignes-apres-1440.png, alt: "Après, au bureau : la même section, aux lignes plus courtes, et l'entrée 02 du sommaire de gauche mise en avant" }
  - { file: captures/L5-theorie-focus-code-apres-1440.png, alt: "Après : un bloc de code atteint au clavier, entouré d'un cadre orangé plein" }
  - { file: captures/L5-theorie-sommaire-focus-apres-390.png, alt: "Après, au téléphone : le sommaire ouvert, son deuxième lien atteint au clavier et entouré du même cadre orangé que les blocs de code" }
---
La page [Théorie](/theory/) a été passée en revue au bureau et au téléphone, avec les règles d'accessibilité du Web. Rien ne déborde sur le côté et les textes posés sur l'image de fond restent lisibles ; cinq défauts ont été corrigés, puis trois finitions après une seconde revue.

- **Sommaire au téléphone et sur tablette** : la page compte huit sections et mesure près de 19 000 pixels de haut au téléphone, mais son sommaire n'existait qu'au bureau. Un sommaire repliable s'ouvre maintenant en tête de page, avec des liens de 44 pixels de haut. Si vous avez demandé à votre système de réduire les animations, sa petite flèche bascule sans tourner.
- **Longueur des lignes** : au bureau, les paragraphes allaient de 92 à 113 caractères par ligne, ce qui fatigue la lecture. Une première correction les ramenait près de 80, mais encore un peu au-delà avec la police réelle du site ; ils ne dépassent plus 76.
- **Numéros du sommaire** : ce petit texte gris passait à 4,4 contre 1, sous le minimum de 4,5 contre 1. Il est maintenant à 5,8 contre 1.
- **Blocs de code** : au clavier, on pouvait les atteindre pour les faire défiler, mais leur contour de focus était presque invisible, à 1 contre 1. Ils portent désormais un cadre orangé plein, sur toutes les pages qui montrent du code défilant (Théorie, ArgoCD et Kubernetes pour les nuls, Cloudflare pour les nuls, l'étude de cas du harnais QA). Les liens du sommaire, au bureau comme au téléphone, prennent le même cadre.
- **Section en cours** : le sommaire du bureau la signalait par la seule couleur ; un lecteur d'écran l'annonce maintenant comme la section courante.

Un test refait ces mesures sur la page construite, au bureau et au téléphone, avec la police réelle du site et avec la police de secours ; il échouait sur l'ancienne version.
