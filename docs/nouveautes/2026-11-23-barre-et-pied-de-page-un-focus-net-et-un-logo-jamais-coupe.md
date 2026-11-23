---
title: "Barre et pied de page : un focus net et un logo jamais coupé"
date: 2026-11-23
created: 2026-11-23T10:30+01:00
lots: [L12]
captures:
  - { file: captures/L12-barre-texte-200-avant-320.png, alt: "Avant, sur un petit téléphone avec le texte agrandi deux fois : dans la barre du haut, le nom du site est réduit à « c… » à côté de son icône, entouré d'un contour de focus blanc très fin" }
  - { file: captures/L12-barre-texte-200-apres-320.png, alt: "Après, même réglage : la barre ne montre plus que l'icône du site, sans texte coupé, entourée d'un contour orange plus épais" }
  - { file: captures/L12-barre-focus-avant-1440.png, alt: "Avant, au bureau : le bouton « Guides » atteint au clavier porte le contour fin du navigateur ; au-dessus du titre de la page, le surtitre « 06 · À propos »" }
  - { file: captures/L12-barre-focus-apres-1440.png, alt: "Après, au bureau : le bouton « Guides » porte un contour orange de 2 pixels ; le surtitre devient « Le site · À propos »" }
---
Ce que toutes les pages partagent (la barre du haut, l'en-tête des pages et le pied de page) a été passé en revue au bureau, au téléphone, sur un très petit écran et avec le texte agrandi deux fois, au clavier, avec les règles d'accessibilité du Web. Cinq défauts ont été corrigés.

- **Focus au clavier** : le contour qui montre où l'on est n'est plus le contour fin propre à chaque navigateur, mais un trait orange de 2 pixels, bien visible sur le fond sombre, dans la barre, le pied et les pages.
- **Logo** : sur un petit téléphone avec le texte agrandi, le nom du site était coupé en « c… ». Quand il ne tient pas entier, la barre ne montre plus que l'icône ; le lien vers l'accueil garde son nom pour les lecteurs d'écran.
- **Rien sous la barre** : en remontant une page au clavier, un lien pouvait finir caché sous la barre du haut. La page s'arrête désormais juste en dessous, et les liens vers une section aussi.
- **Surtitres des pages** : « 01 · Théorie » … « 06 · À propos » suivaient un ordre que la barre ne suit pas. Ils reprennent maintenant le chemin de la barre : « Théorie », « Ressources · Learning », « Le site · À propos »…
- **Liens vers d'autres sites** : dans le pied de page, les trois liens qui ouvrent un nouvel onglet le disent, par une flèche ↗ et en toutes lettres pour les lecteurs d'écran.

Un test refait ces mesures sur le site construit ; il échouait sur l'ancienne version.
