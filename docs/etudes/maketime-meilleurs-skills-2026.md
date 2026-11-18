# Étude : « Les 16 meilleurs Skills Claude Code en 2026 » (Make Time) — L36

Source : <https://www.maketime.fr/articles/meilleurs-skills-claude-2026>, Guillaume Coudreuse, publié le
17 juillet 2026, mis à jour le 11 septembre 2026. Lu le 18 novembre 2026.

L'article déclare des liens affiliés en pied de page (lien Apify avec paramètre de parrainage
`fpr=`). Il signale lui-même trois « produits d'appel » : marketingskills, awesome-claude-skills et claude-ads.

Méthode : on sépare l'affirmé (ce que dit l'article ou le README) du vérifiable (API GitHub,
marketplace officielle, fichier du dépôt), relevé le 18-11. Ensuite, on confronte chaque skill à `/ecosystem`
(`frontend/src/data/ecosystem.ts`) et à Tools tested (`frontend/src/data/tools-tested.ts`). Rien n'a été
installé ni exécuté.

## Les 16 entrées, vérifiées

Les étoiles de l'article ont été relevées le 17-07. Celles du 18-11 viennent de `api.github.com/repos/…`.

| # | Dépôt | ★ article | ★ 18-11 | Licence (API) | Dernier push | Chez nous |
|---|---|---:|---:|---|---|---|
| 1 | anthropics/skills | 161 981 | 196 958 | aucune à la racine | 2026-11-16 | /ecosystem : pdf, xlsx, docx, pptx et 10 autres |
| 2 | nextlevelbuilder/ui-ux-pro-max-skill | 106 841 | 151 109 | MIT | 2026-11-18 | Tools tested 01-11 : skillify partiel |
| 3 | Leonxlnx/taste-skill | 64 479 | 118 059 | MIT | 2026-11-08 | — |
| 4 | Nutlope/hallmark | 11 669 | 57 197 | MIT | 2026-11-11 | — |
| 5 | obra/superpowers | 256 376 | 319 648 | MIT | 2026-11-03 | déjà utilisé (cités par fable-mode et SuperClaude), sans fiche |
| 6 | mattpocock/skills | 175 187 | 327 072 | MIT | 2026-11-18 | — |
| 7 | JuliusBrussee/caveman | 90 217 | 121 171 | Apache-2.0 | 2026-11-18 | — |
| 8 | mksglu/context-mode | 19 036 | 34 257 | **NOASSERTION** (« Other ») | 2026-11-18 | — |
| 9 | AgriciDaniel/claude-ads | 7 148 | 11 126 | MIT | 2026-11-01 | hors sujet |
| 10 | coreyhaines31/marketingskills | 40 296 | 61 121 | MIT | 2026-11-18 | hors sujet |
| 11 | blader/humanizer | 29 616 | 70 570 | MIT | 2026-11-10 | — |
| 12 | apify/agent-skills | 2 380 | 2 506 | aucune | 2026-11-18 | hors sujet (compte payant) |
| 13 | ComposioHQ/awesome-claude-skills | 67 943 | 79 771 | aucune | 2026-09-18 | annuaire, pas un outil |
| 14 | sickn33/agentic-awesome-skills | 43 465 | 49 925 | MIT | 2026-11-17 | annuaire, pas un outil |
| 15 | kepano/obsidian-skills | 42 334 | 53 127 | MIT | 2026-11-17 | renommé **obsidianmd/obsidian-skills** ; hors sujet |
| 16 | mukul975/Anthropic-Cybersecurity-Skills | 25 678 | 36 335 | Apache-2.0 | 2026-08-31 | non officiel (l'article le dit), dormant |

Les 16 dépôts existent, aucun n'est archivé. Les étoiles ne mesurent que la popularité :
mattpocock/skills, créé le 3 février 2026, a presque doublé en quatre mois.

## Affirmé et vérifiable

- **anthropics/skills, skills documentaires « source-available, pas open source »** : contredit.
  Le 18-11, `skills/docx/LICENSE.txt` contient le texte Apache 2.0. Le dépôt n'a pas de LICENSE à la
  racine (404) et l'API répond `license: null`. L'affirmation a pu être vraie en juillet. À ne pas
  reprendre sans relire chaque `LICENSE.txt`.
- **superpowers dans la marketplace officielle** : vérifié. L'entrée `superpowers` de
  `anthropics/claude-plugins-official` pointe vers `obra/superpowers.git` et épingle un sha.
  **« deux heures en autonomie sans dévier »** est une phrase du README, sans mesure.
  Non relevé par l'article : le compagnon visuel de brainstorming charge un logo depuis le site de l'éditeur,
  sauf si `SUPERPOWERS_DISABLE_TELEMETRY` est posé.
- **caveman, « 65 % de tokens de sortie économisés, 100 % de précision »** : le README actuel ne
  reprend pas ce chiffre. Il annonce « 33,2 % en entrée sur des sessions entières » et « 21 % de moins que Codex
  par tâche sur Terminal-Bench 4 ». Ce sont des mesures maison, et le README les qualifie lui-même :
  « run half done », écart de score « too small to tell apart » (±7), plusieurs lignes « Not measured yet ».
  Nous avons déjà tranché sur ce levier (concision de sortie, règles de drona23 reprises), et le benchmark JetBrains
  cité au catalogue montre que ce n'est pas lui qui fait la facture.
- **context-mode, « 315 Ko → 5,4 Ko, 98 % »** : le README actuel dit « 99,4 % » (médiane de 36 lignes ≥ 10 Ko).
  Ce sont des **octets** de sortie d'outil, pas des tokens facturés ; les tokens sont estimés à 4 octets par token.
  Le banc est rejouable hors ligne (`cd bench && node run.mjs`, résultats datés dans `bench/results/`),
  sur la machine de l'auteur (macOS arm64). La licence est non standard : l'API ne la reconnaît pas.
- **hallmark « 57 tests anti-slop », taste-skill « anti-slop » avec contrôle navigateur** : affirmé, non
  vérifié ici. Même famille que les quatre skills de design testées les 1er et 2 novembre
  (ui-ux-pro-max, design-for-ai, Apple Design, Design Styles). Leur idée utile, un détecteur de tics d'IA,
  est déjà reprise dans la revue UX de cadence.
- **agentic-awesome-skills « plus de 1 965 skills »** : la description du dépôt dit maintenant « 2,955+ ».
  Le chiffre bouge chaque mois, c'est un annuaire.

## Confrontation à nos besoins mesurés

On ne retient pour `/test-tool` qu'un besoin chiffré chez nous :

1. **Coût du contexte relu** (consigne de Sylvain du 02-10, conclusion de la revue radar du 18-09 au
   catalogue : « le levier réel est la taille du contexte relu »). RTK compresse les sorties de commandes
   (46,9 % d'économie moyenne au relevé du 31-10, `rtk-stats.json`). token-savior (adopt-conditional) réduit
   la navigation dans le code. En revanche, **rien ne couvre les grosses sorties qui ne passent pas par Bash**
   (lectures de fichiers, pages web, réponses MCP). Elles restent dans le contexte et sont relues à chaque tour.
   C'est le cas visé par context-mode. Il est donc **candidat sous condition** : il faut d'abord lever la
   licence (précédent : alexgreensh rejeté pour PolyForm NC) et vérifier qu'il ne double ni RTK ni token-savior.
2. **Revue design et tics d'IA** : couvert (4 tests en novembre, détecteur repris dans la revue UX). hallmark et
   taste-skill n'ont pas de besoin mesuré qui les justifie. Ils restent en veille, sans test.
3. **Méthode de développement** : couverte par cadence, avec superpowers déjà en service. mattpocock/skills
   n'apporte pas de besoin mesuré. Le seul manque est **documentaire** : superpowers n'a pas de fiche au
   catalogue alors qu'on l'utilise, et sa télémétrie par défaut n'est signalée nulle part.
4. **Rien à faire** pour caveman (levier déjà écarté), humanizer (aucune mesure de « style IA » chez nous ;
   l'audit de lisibilité mesure autre chose), les skills marketing, publicité, scraping et Obsidian
   (hors de nos usages), les deux annuaires et le dépôt de cybersécurité. Pour la cybersécurité,
   L34 (security-audit-skill de Cloudflare) est déjà au plan, avec un dépôt officiel.

## Lots proposés (non ajoutés au plan)

Voir le compte rendu de L36. En résumé :

- context-mode : licence, puis banc rejoué en bac à sable, puis `/test-tool` seulement si les deux passent.
- Fiche catalogue de superpowers (en service, télémétrie à signaler).
