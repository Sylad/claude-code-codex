---
title: "Page Vidéos : des descriptions en français courant"
date: 2026-11-23
created: 2026-11-23T14:30+01:00
lots: [L82]
captures:
  - { file: captures/L82-videos-hero-avant-390.png, alt: "Avant, au téléphone : le titre de la page Vidéos dit « Chaînes & talks curés », et l'introduction parle d'« agentic coding » et d'« AI-influencers »" }
  - { file: captures/L82-videos-hero-apres-390.png, alt: "Après : le titre dit « Chaînes et conférences choisies », et l'introduction parle de « codage agentique » et d'« influenceurs IA »" }
  - { file: captures/L82-videos-cartes-avant-390.png, alt: "Avant : la carte de la chaîne Anthropic annonce des « Demos de launch » et des « walkthroughs de features » ; la suivante, un « Fireside » sur les « Patterns d'usage » et les « workflows »" }
  - { file: captures/L82-videos-cartes-apres-390.png, alt: "Après : « Démonstrations des lancements » et « visites guidées des fonctions », puis une « discussion » sur les « habitudes d'usage » et les « méthodes de travail » ; les titres des vidéos n'ont pas changé" }
---
Sur la page [Vidéos](/videos/), les descriptions mêlaient l'anglais et le français : « talks curés », « Demos de launch », « walkthroughs de features », « l'équipe ship »… Elles sont réécrites en français courant, avec le même sens et à peu près la même longueur.

- **Titre et introduction** : « Chaînes et conférences choisies », une sélection qui parle du « codage agentique », pas d'« influenceurs IA » généralistes.
- **Fiches des quinze chaînes et vidéos** : chaque anglicisme qui a un équivalent français est remplacé (« entretien », « réalisations », « livrer », « outillage »…). Les noms des chaînes, des produits et les titres des vidéos restent tels quels ; seul le titre de la conférence de Boris Cherny, que le site avait déjà traduit à moitié, est passé entièrement en français.
- **Mots-clés et filtres** : les étiquettes des cartes passent en français (« tutoriel », « conférence », « entretien »…), la case « FR uniquement » devient « En français uniquement » et le champ de recherche cite un « mot-clé » au lieu d'un « tag ».
- **Critères de sélection** : l'encadré ne tutoie plus le lecteur ; on peut proposer une autre chaîne française par un ticket sur le dépôt.

Un test relit la page construite et échoue si l'un des anglicismes relevés revient, ou si le texte s'adresse au lecteur par « tu » ou « vous » ; il échouait sur l'ancienne version.
