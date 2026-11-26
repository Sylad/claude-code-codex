---
title: "L'étude de cas montre le parcours actuel d'un lot"
date: 2026-11-26
created: 2026-11-26T10:10+01:00
lots: [L103]
captures:
  - { file: captures/L103-parcours-cadence-2-390.png, alt: "Le nouveau schéma sur un téléphone : six étapes en colonne, du lot choisi par le lead au cadence run, à la porte et l'intégration, à la revue, à la livraison et à la QA, avec une boucle en pointillés « non conforme : correction » de la revue vers le cadence run" }
---
L'étude de cas cadence montre maintenant le parcours d'un lot tel qu'il se fait aujourd'hui, avec cadence 2.

- **Le schéma du parcours** suit six étapes et dit qui fait chacune : le lead choisit le lot, une session Opus le fait de bout en bout avec `cadence run`, le programme rejoue la porte de tests (si elle est rouge, la même session corrige) et amène le travail sur `main` par avance rapide, puis viennent la revue (de code, et UX si le lot touche un écran), la livraison et la QA.
- **La boucle de correction** est dessinée : une revue non conforme relance un run de correction, confié à Fable dès la troisième passe de correction ou après deux revues non conformes. La légende dit ce que marque le cadre orange : les deux contrôles faits par un regard neuf, la revue et la QA.
- **Le parcours de la V1**, celui des vagues de sessions, reste lisible dans un chapitre à part, « Le point de départ : la V1 », daté et marqué comme historique, avec un lien vers sa documentation ; son schéma porte le titre « V1 · Le parcours d'un lot dans une vague ».
