---
title: "Texte agrandi : les mots trop longs se coupent avec un trait d'union"
date: 2026-11-24
created: 2026-11-24T14:00+01:00
lots: [L88]
captures:
  - { file: captures/L88-titre-200-avant-320.png, alt: "Avant, sur un petit téléphone avec le texte agrandi deux fois : un titre de l'étude Kubernetes est coupé au hasard, une ligne par morceau, « jdbc », « con », « fig. », « pro », « pert », « ies », « dat », « a_di », « r », sans aucun trait d'union" }
  - { file: captures/L88-titre-200-apres-320.png, alt: "Après, même réglage : le titre se lit « Le jdbccon-fig.pro-perties du data_dir sur-charge les env vars », chaque mot coupé porte son trait d'union et les autres restent entiers" }
---
Sur un petit téléphone, avec le texte du navigateur agrandi jusqu'à deux fois, des titres se coupaient au milieu d'un mot, sans trait d'union : « chang|é », « vérific|ation », un nom de fichier émietté sur dix lignes. Le texte devait passer à la ligne sans défilement sur le côté ; il le fait maintenant sans abîmer les mots, sur toutes les pages.

- **Un mot trop long pour sa ligne** se coupe à une syllabe, avec un trait d'union, en gardant au moins trois lettres de chaque côté. Seul ce mot-là est coupé : ses voisins qui tiennent restent entiers.
- **Un nom, une adresse ou une commande** se coupe d'abord à sa ponctuation, à sa casse ou à ses chiffres (« warhammer|40k », « JDBC|Store ») ; s'il faut le couper au milieu, c'est à une syllabe et avec un trait.
- **La ponctuation ne reste jamais seule** au début ou à la fin d'une ligne : virgule, parenthèse, guillemet fermant, « % » d'un pourcentage, « -- » d'une option.
- **Les grands titres** grandissent maintenant avec le texte, au lieu de rester bloqués par la largeur de l'écran.
- **Le texte copié et la lecture à voix haute** ne changent pas : aucun trait ajouté ne s'y glisse.
- **Au réglage normal**, rien ne change à l'écran.

Un test refait ces mesures sur toutes les pages construites, à trois largeurs d'écran et cinq tailles de texte ; il échouait sur l'ancienne version.
