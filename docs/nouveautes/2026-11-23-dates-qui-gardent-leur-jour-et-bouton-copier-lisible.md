---
title: "Le jour reste avec son mois, et « Copier le lien » tient dans son bouton"
date: 2026-11-23
created: 2026-11-23T15:20+01:00
lots: [L83]
captures:
  - { file: captures/L83-date-avant-390.png, alt: "Avant, au téléphone : la phrase de revue finit par « prochaine avant le 22 », et « décembre 2026 » passe seul à la ligne suivante" }
  - { file: captures/L83-date-apres-390.png, alt: "Après, même largeur : « 22 décembre 2026 » passe entier à la ligne suivante, le jour reste avec son mois" }
  - { file: captures/L83-copier-avant-320-200.png, alt: "Avant, sur un petit téléphone avec le texte agrandi deux fois : dans la carte d'une nouveauté, les mots « Copier le » dépassent du cadre du bouton" }
  - { file: captures/L83-copier-apres-320-200.png, alt: "Après, même réglage : « Copier le lien » tient sur deux lignes à l'intérieur du bouton, à côté de son icône" }
---
Deux petits défauts relevés à la revue de la semaine sont corrigés.

- **Dates** : le jour ne reste plus seul en fin de ligne, comme dans « prochaine avant le 22 », avec « décembre 2026 » à la ligne suivante, sous les pages [Learning](/learning/), [Vidéos](/videos/) ou [Théorie](/theory/) au téléphone. Le jour et le mois restent ensemble, et la date passe à la ligne avant l'année. Sur une colonne trop étroite pour « 23 novembre », même seuls sur leur ligne, comme une carte des [Nouveautés](/nouveautes/) sur un petit téléphone avec le texte agrandi deux fois, ils se séparent encore plutôt que de sortir du cadre. Un nombre n'est jamais coupé.
- **Bouton « Copier le lien »** : sur un petit téléphone avec le texte agrandi deux fois, son libellé sortait de son cadre. Le bouton resserre ses marges intérieures quand la place manque, et l'échec de la copie s'affiche « Non copié », dont les mots tiennent dans le bouton. L'adresse s'affiche toujours sous le titre pour la copier à la main.

Un test mesure les trois libellés du bouton et toutes les dates de six pages, du petit téléphone au grand écran, avec le texte à sa taille normale et agrandi deux fois ; il échouait sur l'ancienne version.
