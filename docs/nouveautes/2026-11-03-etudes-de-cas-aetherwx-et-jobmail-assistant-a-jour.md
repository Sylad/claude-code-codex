---
title: "Études de cas : AetherWX et jobmail-assistant à jour"
date: 2026-11-03
created: 2026-11-03T19:42+01:00
lots: [L38]
captures:
  - { file: captures/L38-legende-capture-1440.png, alt: "Une capture de l'étude AetherWX, légendée « Capture du 11 mai 2026 (carte 2D, avant le globe) » suivie de sa description d'origine" }
  - { file: captures/L38-capture-erreur-390.png, alt: "Au téléphone, une capture qui n'a pas chargé : un message la nomme, explique pourquoi et propose de recharger, la légende reste lisible dessous" }
---
Les quatre études AetherWX et jobmail-assistant (AetherWX, son harnais QA, son encyclopédie, JobMail) portent maintenant en tête leur date de mise à jour — « Mis à jour le 3 novembre 2026 » — et le dépôt qu'elles décrivent. Une seule date par page : les anciennes mentions de fraîcheur disparaissent.

Les chiffres repris de l'état réel disent quand ils ont été relevés et d'où ils viennent : 68 couches de données dans le manifeste du harnais QA, 80 commits sur JobMail depuis juin. Un chiffre que l'on n'a pas pu relever est dit non relevé, avec la raison (le nombre de pods du cluster, pour l'encyclopédie), au lieu d'être deviné. L'étude AetherWX raconte aussi ce qui s'est ajouté depuis septembre : le référentiel de stations WIGOS, les observations SYNOP et METAR et la livraison pilotée par cadence.

Chaque capture porte sa date de prise devant sa description. Celles de mai 2026 le disent : « carte 2D, avant le globe ». Pendant qu'une capture charge, son cadre garde sa taille et annonce ce qui arrive ; si elle ne charge pas, un message la nomme et propose de recharger, et sa légende reste lisible.

## Hypothèses

- R2 — Le bloc « Dépôt décrit : … » suit la date en tête de page ; si la règle durable de L39 impose un autre libellé ou un autre emplacement, seul ce bloc de texte change.
- R5 — Un chiffre non relevé s'affiche comme une phrase « non relevé au … : <raison> » ; si l'on préfère retirer la phrase, seul ce texte disparaît.
- R6 — Le cadre d'une capture en cours de chargement affiche un message ; si le navigateur montre déjà un cadre vide stable, ce texte est retiré.
