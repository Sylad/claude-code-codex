# Attendus QA — claude-code-codex

Site statique Astro : aucun appel API de données. Les `api:` ne portent que sur les ressources de la page.
Tiré de la QA prod du 05-10 (brouillon du qa-reviewer, corrigé : accents, valeurs figées remplacées par des règles).

## *
shows: <meta name="version"> égal au sha court livré ; un h1 non vide ; navigation avec Démarrer, Atelier IA, Théorie, Écosystème, Case studies, Guides, Ressources, Nouveautés
never: erreur affichée, "undefined", "NaN", "[object Object]"
api: toutes les ressources same-origin en 2xx, corps non vide
390 : document.documentElement.scrollWidth == clientWidth (pas de défilement latéral)

## /
shows: h1 "Un codex pour comprendre, utiliser et builder avec Claude Code" ; le sur-titre ; le média de fond (vidéo ou image) chargé

## /about/
shows: h1 "Vibe coded with Claude Code" ; sur-titre sur pastille sombre (contraste ≥ 4,5:1)

## /start/
shows: h1 commençant par "Tu viens d'installer Claude Code" ; sur-titre sur pastille sombre ; contenu long (au moins 10 000 caractères de texte)

## /nouveautes/
shows: h1 "Ce qui a changé" ; au moins 1 entrée datée, la plus récente en tête ; chaque capture chargée (naturalWidth > 0) ; un bouton "Copier le lien" par entrée
never: "Aucune nouveauté" tant que docs/nouveautes/ contient des entrées

## /plan-de-travail/
shows: h1 "Ce qui se prépare" ; compteurs « N prévus » / « N livrés » égaux au plan publié ; sections En cours, Prévu, Récemment livré
may be empty when: la section "En cours" (message "Rien en cours pour l'instant")
never: identifiant de lot (Lnn), note ou verdict privé, titre brut d'un lot

## /case-studies/
shows: un lien /case-studies/<slug> par étude publiée ; le nombre d'apps du h1 égal au nombre de cartes d'apps

## /case-studies/maritime-atlas/
shows: toutes les images chargées (naturalWidth > 0) ; à 390 px, blocs de code contenus dans la page (pas de défilement latéral)

## /learning/ /theory/ /ecosystem/ /atelier-ia/ /videos/ /k8s-for-java-developers/ /argocd-k8s-pour-les-nuls/ /cloudflare-pour-les-nuls/
shows: h1 non vide ; contenu non vide (au moins 4 000 caractères de texte) ; liens sortants avec un href réel

## /<route inexistante>/
shows: statut 404 (au 05-10 : 200 + page d'accueil, suivi en L28)
