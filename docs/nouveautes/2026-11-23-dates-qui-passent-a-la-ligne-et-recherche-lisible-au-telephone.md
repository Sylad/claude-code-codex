---
title: "Dates qui passent à la ligne, recherche lisible au téléphone"
date: 2026-11-23
created: 2026-11-23T11:40+01:00
lots: [L81]
captures:
  - { file: captures/L81-revue-avant-320.png, alt: "Avant, sur un petit téléphone avec le texte agrandi deux fois : dans l'encadré « Dernière revue », l'année est coupée en « 202 » puis « 6 » à la ligne suivante, deux fois" }
  - { file: captures/L81-revue-apres-320.png, alt: "Après, même réglage : « 22 novembre » puis « 2026 » à la ligne, l'année entière ; de même pour « 22 décembre 2026 »" }
  - { file: captures/L81-plan-avant-320.png, alt: "Avant, sur la page Plan de travail : la date « 22 novembre 2026 » sort de l'encadré et de l'écran, coupée au bord droit" }
  - { file: captures/L81-plan-apres-320.png, alt: "Après : la date passe à la ligne entre ses mots et reste dans l'encadré" }
  - { file: captures/L81-recherche-avant-320.png, alt: "Avant, sur la page Vidéos : le texte d'exemple du champ de recherche est tronqué à « Rechercher ( »" }
  - { file: captures/L81-recherche-apres-320.png, alt: "Après : au-dessus du champ, un libellé entier sur trois lignes, « Rechercher une chaîne ou une vidéo (auteur, sujet, tag) »" }
---
Suite de la revue de la page Vidéos, étendue à la page Learning et aux dates de tout le site. Cinq défauts ont été corrigés.

- **Dates** : sur un petit téléphone avec le texte agrandi, une date ne pouvait pas passer à la ligne. Elle sortait de l'écran (Plan de travail, Nouveautés, Livre de bord) ou se coupait au milieu de l'année (« 202 » puis « 6 »). Une date passe maintenant à la ligne entre ses mots, et un nombre n'est jamais coupé. L'avancement d'un lot du plan (« 1 étape faite sur 1 ») suit la même règle.
- **Recherche** : le texte d'exemple du champ des pages Vidéos et Learning était tronqué au téléphone, et il disparaissait dès la saisie. C'est désormais un libellé visible au-dessus du champ, qui passe à la ligne si besoin.
- **Clavier** : chaque carte demandait deux arrêts de la touche Tab, sur le titre puis sur l'icône, qui mènent à la même adresse. Il n'en reste qu'un par carte ; l'icône reste cliquable à la souris. Sur Learning, le lien vers le flux RSS, qui mène ailleurs, garde le sien.
- **Contraste** : sur un filtre choisi de la page Learning, le nombre de sources était trop pâle (4,38:1 pour un minimum de 4,5:1). Il a maintenant la couleur pleine du filtre.
- **Bouton GitHub** : à l'accueil et sur la page À propos, les lecteurs d'écran ne lisent plus la flèche ↗ dans le nom du bouton ; elle reste visible, et la mention « nouvel onglet » est conservée.

Des tests refont ces mesures sur le site construit ; ils échouaient sur l'ancienne version.
