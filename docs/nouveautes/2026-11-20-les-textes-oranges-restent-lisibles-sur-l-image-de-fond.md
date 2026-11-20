---
title: "Les textes orangés restent lisibles sur l'image de fond"
date: 2026-11-20
created: 2026-11-20T08:45+01:00
lots: [L74]
captures:
  - { file: captures/L74-contraste-accent-1440.png, alt: "Au bureau, un surtitre orangé de l'étude de cas cadence défilé tout en haut de la fenêtre : il se lit nettement sur le fond assombri, l'image de la ville reste visible derrière" }
  - { file: captures/L74-contraste-accent-390.png, alt: "Au téléphone, le surtitre orangé de la page Pourquoi cadence en haut de l'écran, lisible sur l'image de fond" }
---
Sur tout le site, le texte en orange (petits surtitres, liens, chiffres) devenait difficile à lire quand le défilement l'amenait en haut de la fenêtre, là où l'image de fond est la plus claire : 2,5 contre 1 seulement au pire endroit, pour un minimum de 4,5 contre 1 recommandé par les règles d'accessibilité du Web.

Le voile sombre posé sur l'image est désormais plus dense en haut de l'écran. L'orange ne change pas et l'image reste visible derrière le texte. Sur l'[étude de cas cadence](/case-studies/cadence/) et la page [Pourquoi cadence](/case-studies/pourquoi-cadence/), au bureau comme au téléphone, le pire contraste mesuré passe de 2,5 à 5,2 contre 1.

Quelques textes orangés étaient en plus éclaircis par transparence : les intertitres du tableau des services de l'[encyclopédie AetherWX](/case-studies/aetherwx-encyclopedia/) (3 contre 1), les en-têtes du tableau de l'étude [SuperClaude](/case-studies/superclaude/) (3,9 contre 1), et les liens « Case study » et numéros des cartes des [études de cas](/case-studies/) (4,3 contre 1). Ils sont maintenant en orange plein : 4,7 contre 1 au pire pour les premiers, 5 contre 1 pour les liens.

Un test vérifie désormais tout le site : sur chaque page, au bureau et au téléphone, chaque sorte de texte orangé posé sur l'image est amenée à trois hauteurs en haut de la fenêtre et mesurée au pixel près, lettres et contour compris, transparence comprise ; un texte orangé qu'il ne parvient pas à mesurer le fait échouer. Les 1 068 mesures dépassent 4,5 contre 1.
