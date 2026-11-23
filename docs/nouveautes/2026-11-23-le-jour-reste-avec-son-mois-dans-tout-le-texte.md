---
title: "Le jour reste avec son mois dans tout le texte du site"
date: 2026-11-23
created: 2026-11-23T16:20+01:00
lots: [L87]
captures:
  - { file: captures/L87-livre-de-bord-avant-390.png, alt: "Avant, au téléphone, dans le Livre de bord : la ligne finit par « généré le 23 », et « octobre » commence la ligne suivante" }
  - { file: captures/L87-livre-de-bord-apres-390.png, alt: "Après, même largeur : « 23 octobre » passe entier au début de la ligne suivante" }
  - { file: captures/L87-nouveautes-avant-390.png, alt: "Avant, au téléphone, dans une nouveauté : la ligne finit par « Mis à jour le 3 », et « novembre 2026 » passe à la ligne" }
  - { file: captures/L87-nouveautes-apres-390.png, alt: "Après, même largeur : « 3 novembre 2026 » passe entier à la ligne suivante" }
---
La correction précédente ne gardait ensemble le jour et le mois que dans les dates affichées seules, en tête d'une nouveauté ou d'une semaine. Dans les phrases, le jour pouvait encore rester seul en fin de ligne, comme « généré le 23 » avec « octobre » à la ligne suivante dans le [Livre de bord](/livre-de-bord/), ou « Mis à jour le 3 » dans les [Nouveautés](/nouveautes/).

Le jour reste maintenant avec son mois dans tout le texte du site : les phrases des pages, des études et des nouveautés. Rien d'autre ne change, et la date passe toujours à la ligne avant l'année. La recherche des catalogues trouve une date tapée normalement.

Un test lit toutes les pages du site construit et n'y trouve plus un seul jour séparé de son mois ; il en trouvait 249 sur l'ancienne version. Un second test vérifie, sur toutes les pages, du petit téléphone au grand écran et avec le texte agrandi deux fois, que le jour est sur la même ligne que son mois et que rien ne sort de l'écran.
