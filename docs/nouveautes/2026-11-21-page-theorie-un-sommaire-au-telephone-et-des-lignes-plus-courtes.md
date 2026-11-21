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
---
La page [Théorie](/theory/) a été passée en revue au bureau et au téléphone, avec les règles d'accessibilité du Web. Rien ne déborde sur le côté et les textes posés sur l'image de fond restent lisibles ; cinq défauts ont été corrigés.

- **Sommaire au téléphone et sur tablette** : la page compte huit sections et mesure près de 19 000 pixels de haut au téléphone, mais son sommaire n'existait qu'au bureau. Un sommaire repliable s'ouvre maintenant en tête de page, avec des liens de 44 pixels de haut.
- **Longueur des lignes** : au bureau, les paragraphes allaient jusqu'à 108 caractères par ligne, ce qui fatigue la lecture. Ils s'arrêtent maintenant à 80.
- **Numéros du sommaire** : ce petit texte gris passait à 4,4 contre 1, sous le minimum de 4,5 contre 1. Il est maintenant à 5,8 contre 1.
- **Blocs de code** : au clavier, on pouvait les atteindre pour les faire défiler, mais leur contour de focus était presque invisible, à 1 contre 1. Ils portent désormais un cadre orangé plein.
- **Section en cours** : le sommaire du bureau la signalait par la seule couleur ; un lecteur d'écran l'annonce maintenant comme la section courante.

Un test refait ces mesures sur la page construite, au bureau et au téléphone ; il échouait sur l'ancienne version.
