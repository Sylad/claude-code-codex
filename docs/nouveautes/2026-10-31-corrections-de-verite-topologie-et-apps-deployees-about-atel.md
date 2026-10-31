---
title: "Sept pages disent enfin où tourne vraiment chaque application"
date: 2026-10-31
created: 2026-10-31T12:31+01:00
lots: [L55]
captures:
  - { file: captures/L55-about-1440.png, alt: "Page À propos, écran large" }
  - { file: captures/L55-about-390.png, alt: "Page À propos sur téléphone" }
---
L'accueil et la page À propos ne prétendent plus que toutes les applications tournent sur Kubernetes : quatre d'entre elles seulement sont déployées sur k3s avec GitOps. La page À propos corrige aussi la date de départ avec Claude Code (fin 2025) et date les « cinq apps perso en prod » de mai 2026.

Le schéma de l'atelier IA précise que le NAS ne fait plus tourner d'application, seulement les médias et les sauvegardes. Dans le guide Argo CD, la version `v1.4.2` est présentée comme un exemple : les vraies images sont étiquetées `sha-<shortsha>`.

Les études de cas AetherWX, claude-code-codex et de la migration K8s datent leurs chiffres (pods, fichiers mémoire, état avant/après de mai 2026) et décrivent Mini-Blue pour ce qu'il est : un PC d'outillage, sans application.
