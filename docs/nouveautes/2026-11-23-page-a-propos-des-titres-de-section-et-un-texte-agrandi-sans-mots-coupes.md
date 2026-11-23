---
title: "Page À propos : des titres de section et un texte agrandi sans mots coupés"
date: 2026-11-23
created: 2026-11-23T10:05+01:00
lots: [L11]
captures:
  - { file: captures/L11-about-texte-200-avant-320.png, alt: "Avant, sur un petit téléphone avec le texte agrandi deux fois : la carte de l'auteur ne laisse qu'une colonne étroite, « Ladoire », « développeur » et « Java/web » sont coupés au milieu" }
  - { file: captures/L11-about-texte-200-apres-320.png, alt: "Après, même réglage : la colonne est plus large, le nom et le métier de l'auteur tiennent sur des lignes entières, chaque mot entier" }
  - { file: captures/L11-about-credits-avant-390.png, alt: "Avant, au téléphone : dans les crédits, les liens Claude Code et openart.ai, puis le lien « public » du dépôt, ouvrent un nouvel onglet sans aucun signe ; la mention « Site fan-made » en bas est pâle" }
  - { file: captures/L11-about-credits-apres-390.png, alt: "Après, au téléphone : ces trois liens portent une flèche ↗ comme le bouton GitHub, et la mention du bas est plus lisible" }
---
La page [À propos](/about/) a été passée en revue au bureau, au téléphone et avec le texte agrandi deux fois, avec les règles d'accessibilité du Web. Rien ne déborde sur le côté ; six défauts ont été corrigés.

- **Texte agrandi** : sur un petit téléphone, les marges de la page et des cartes ne grandissent plus avec le texte ; les mots coupés au milieu passent de 24 à 0.
- **Titres** : « L'histoire courte », « Stack du site », « Sources », « Crédits IA » et « Si tu veux faire pareil » sont de vrais titres de section, pour qui parcourt la page par ses titres. Le grand titre en anglais est prononcé avec la voix anglaise.
- **Liens vers d'autres sites** : les trois qui ouvrent un nouvel onglet le disent maintenant, par une flèche ↗ comme le bouton GitHub, et en toutes lettres pour les lecteurs d'écran.
- **Mention « Site fan-made »** : elle passe de 4,4 à plus de 4,5 contre 1, le minimum de contraste.
- **Exactitude** : les résumés de la semaine sont écrits par Claude Haiku 4.5, comme le disent les crédits ; la fiche technique annonçait Claude Sonnet.
- **Répétitions** : « dev Java depuis 2005 », dit deux fois, et NestJS, cité deux fois dans la même liste, ne le sont plus qu'une.

Un test refait ces mesures sur la page construite ; il échouait sur l'ancienne version.
