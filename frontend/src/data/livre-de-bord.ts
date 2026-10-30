/**
 * L44 — contenu du Livre de bord : une entrée par semaine ISO, la plus récente en premier.
 * Sources : notes de clôture des plans (raf), CHANGELOG et docs de cadence, Nouveautés des
 * projets, verdicts /test-tool du catalogue Tools tested. Filtre strict (lib/livre-de-bord.ts,
 * appliqué au build) : rien de privé, aucun chemin de machine ni secret, aucun compte pro.
 * Récurrent : chaque semaine, ajouter l'entrée de la semaine EN TÊTE de la liste.
 */
import type { BookEntry } from "@/lib/livre-de-bord";

const CADENCE = "https://github.com/Sylad/cadence";
const CHANGELOG = { label: "CHANGELOG de cadence", href: `${CADENCE}/blob/main/CHANGELOG.md` };
const TOOLS_TESTED = { label: "Tools tested", href: "/case-studies" };

export const ENTRIES: BookEntry[] = [
  {
    semaine: "2026-W44",
    date: "2026-10-30",
    theme: "Ce qui rend une IA fiable : la vérification, pas la confiance",
    rubriques: {
      appris: "Ce qui tient dans la vidéo",
      fabrique: "Ce qui ne tient pas",
      teste: "Ce que montre notre historique",
    },
    resume:
      "Regard critique sur la vidéo « Ton métier va changer dans 2 ans » de Melvynx (29 octobre). Cinq idées tiennent et nous les appliquons déjà ; cinq autres ne tiennent pas, et la raison tient en une phrase : ce qui rend une IA fiable, c'est ce qu'on vérifie après elle, pas la confiance qu'on lui fait. Quatre épisodes du jour, relus dans l'historique de nos dépôts, le montrent.",
    appris: [
      {
        titre: "Le contexte persistant en fichiers",
        texte:
          "Donner à l'IA des fichiers de consignes qui restent d'une session à l'autre, plutôt que de tout réexpliquer, est la bonne pratique. C'est ce que font nos fichiers CLAUDE.md et le plan tenu par cadence : une session qui démarre lit ce qui a été décidé avant elle.",
        liens: [{ label: "La chaîne de Melvynx (la vidéo y figure)", href: "https://www.youtube.com/@melvynxdev" }],
      },
      {
        titre: "Les tâches répétitives et vérifiables d'abord",
        texte:
          "Confier à l'IA ce qui revient souvent et dont on peut contrôler le résultat avec un test est le meilleur point d'entrée. Le critère décisif est le mot « vérifiables » : une tâche qu'on ne sait pas contrôler ne devient pas fiable parce qu'elle est répétitive.",
      },
      {
        titre: "Le minimalisme des outils",
        texte:
          "Peu d'outils, bien maîtrisés, valent mieux qu'une pile qui s'allonge. Notre catalogue Tools tested va dans le même sens : un verdict de septembre a écarté un routeur de requêtes devenu un service multi-agents trop envahissant pour le besoin.",
        liens: [{ label: "Tools tested", href: "/case-studies" }],
      },
      {
        titre: "L'IA propose, puis on décide",
        texte:
          "Le partage des rôles est juste : l'IA écrit, une personne tranche. Chez nous, la décision a des points d'arrêt écrits (revue de code, revue d'écran, verdict de QA) et l'agent ne les passe pas de lui-même.",
      },
      {
        titre: "Les skills comme recettes",
        texte:
          "Une consigne qui a bien marché se range dans un skill et se rejoue, au lieu d'être retapée de mémoire. Nous en utilisons plusieurs, et la page Démarrer explique comment s'en servir.",
        liens: [{ label: "Démarrer", href: "/start" }],
      },
    ],
    fabrique: [
      {
        titre: "« Je ne regarde jamais avant de publier »",
        texte:
          "C'est le point qui ne tient pas, et celui qui compte le plus. Ne pas regarder, c'est faire de la confiance l'unique contrôle. Les quatre épisodes plus bas montrent que, sur une même journée, des vérifications ont arrêté des défauts que personne n'attendait. Regarder avant de publier est précisément le travail qui reste à la personne.",
      },
      {
        titre: "La souveraineté des données, vraie à moitié",
        texte:
          "Garder ses données chez soi est une bonne idée, mais ce n'est vrai que du stockage. Tant que le modèle tourne chez un fournisseur, ce qu'on lui envoie quitte la machine ; seul un modèle local garde tout sur place. Nous les mélangeons déjà, selon la donnée : un modèle local quand elle ne doit pas sortir, un modèle hébergé sinon. La vraie question est « où va quoi », pas « chez moi ou pas ».",
      },
      {
        titre: "Des chiffres d'étude invérifiables",
        texte:
          "Les pourcentages avancés pour appuyer le propos étaient donnés sans source que nous ayons pu retrouver. Un chiffre qu'on ne peut pas remonter à sa source est une opinion avec un habillage : nous ne le reprenons pas ici.",
      },
      {
        titre: "Le marketing de la peur",
        texte:
          "« Ton métier va changer dans 2 ans » joue sur l'urgence. Le métier change en effet, mais à l'échelle de nos propres projets le changement se voit en pratiques (tester, relire, borner) plutôt qu'en date butoir. Une échéance annoncée sans mesure ne dit pas quoi faire lundi matin.",
      },
      {
        titre: "Le coût et la qualité, absents de ses niveaux",
        texte:
          "Les niveaux de maturité décrits mesurent la quantité d'autonomie laissée à l'IA, jamais ce qu'elle coûte ni la qualité de ce qu'elle rend. Nous suivons les deux : cadence compte les jetons et les passes de correction par lot, parce qu'une automatisation qui coûte cher ou qui oblige à tout reprendre n'est pas un progrès.",
      },
    ],
    teste: [
      {
        titre: "Finance (L166 puis L167) : une vérification partielle, un défaut attrapé par la QA",
        texte:
          "Le lot L166 corrigeait la démo : le bilan annuel de /yearly devait être celui de l'année des relevés. Il était terminé et relu. La QA du 30 octobre a confirmé que la vue par défaut était conforme, mais a trouvé que le bilan 2025, généré le 23 octobre, restait servi et offert dans l'onglet 2025, avec des mois absents de l'historique. Le lot L167 fait purger par le préchargement de la démo tout bilan d'une autre année. Une vérification de la seule vue par défaut laissait passer le défaut.",
      },
      {
        titre: "Warhammer (L37 puis L217) : une régression que l'e2e a attrapée",
        texte:
          "Le lot L37 a transformé le méga-menu Lore en bouton à divulgation, ce qui a retiré onze liens de la tabulation. Un test de bout en bout d'un lot livré plus tôt (L49) a rougi en CI : 90 tabulations depuis la recherche faisaient désormais le tour de la page. L'ordre réel de la galerie restait conforme ; c'était l'hypothèse du test qui n'était plus vraie. Le lot L217 a rescellé ce test le jour même. Sans lui, le changement de tabulation serait passé inaperçu.",
      },
      {
        titre: "Cadence (L439) : un lot repris trois fois, et c'est la revue qui a trouvé le défaut",
        texte:
          "Le livreur délégué (L439) a eu trois revues de code successives. La dernière, faite par une revue neuve, a relevé un défaut majeur que les deux premières avaient laissé : l'entrée du CHANGELOG était rangée sous une version déjà publiée. Corrigé, relu, puis la suite complète est repassée au vert, 4549 tests sur 4549. Reprendre n'est pas un échec : c'est la vérification qui fait son travail, à condition d'être refaite à neuf plutôt que cochée.",
      },
      {
        titre: "Avatar (L44) : la porte rejouée sur un commit de plan",
        texte:
          "Pour ce lot, le dernier commit de code est de 12 h 21. Les quatre suivants, jusqu'à 12 h 35, ne touchent que le plan (revue enregistrée, lot terminé, note de livraison). Rejouer toute la porte de tests sur l'un d'eux contrôlait un code déjà contrôlé : environ cinq minutes perdues. Vérifier trop est aussi une perte ; c'est pourquoi cadence lit désormais le verdict de la vague quand seuls des commits de plan séparent le sha livré du dernier contrôlé.",
        liens: [{ label: "Livre de bord, semaine 44", href: "/livre-de-bord#semaine-2026-W44" }],
      },
    ],
  },
  {
    semaine: "2026-W44",
    date: "2026-10-30",
    resume:
      "Semaine de plomberie utile : trois pertes de temps mesurées (la porte de tests rejouée pour rien, une publication cassée par un fichier que git ne suit pas, une reprise de vague qui attendait en vain) et, pour chacune, le mécanisme qui la supprime. Cadence passe de 1.12 à 1.26, vingt-trois versions en cinq jours.",
    appris: [
      {
        titre: "Rejouer toute la porte de tests pour un simple commit de plan : environ 5 minutes perdues par lot prêt",
        texte:
          "Une fois la revue enregistrée et le lot clos, deux commits ne touchent plus que le plan. La vérification de livraison rejouait pourtant toute la porte (build puis tests) sur le dernier. Le mécanisme qui l'a supprimé : si les commits qui séparent le sha livré du dernier sha contrôlé par la vague ne changent que le plan, on lit le verdict de la vague au lieu de rejouer. Un commit qui touche autre chose, un merge ou une pile sans verdict en dessous restent refusés.",
        liens: [{ label: "Livraison vérifiée, dans la doc de cadence", href: `${CADENCE}/blob/main/docs/deliver.md` }],
      },
      {
        titre: "Une suite verte chez nous, rouge dans un clone neuf : la publication 1.25.0 a échoué",
        texte:
          "Les tests lisaient un fichier de types que l'éditeur écrit en chargeant le mod et que git ne suit pas : aucun de nos arbres de travail ne pouvait le voir manquer. Le mécanisme : avant de poser le tag, la commande de publication rejoue maintenant le commit de version dans un clone neuf (installation propre, vérification de types, tests), et le workflow de tests tourne aussi à chaque push sur la branche principale. Leçon de méthode : une vérification faite dans l'arbre où l'on a travaillé ne prouve rien sur ce que voit un autre poste.",
        liens: [CHANGELOG],
      },
      {
        titre: "Une reprise de vague qui sortait en erreur au lieu d'attendre : 80 minutes d'attente à la main",
        texte:
          "Reprendre l'intégration d'un lot pendant qu'une autre vague tenait le dépôt faisait sortir la commande avec une erreur, et il fallait surveiller soi-même la fin de l'autre vague. Elle attend désormais, vérifie le verrou toutes les 5 secondes et reprend à la fin, pendant 3 heures au plus. La revue de code a trouvé plusieurs cas limites sur cette attente (arrêt demandé pendant l'attente, deux reprises en attente sur le même dépôt, refus déjà posé) : chacun a été corrigé avec son test.",
      },
      {
        titre: "Piège des agents : lire un tableau complet coûte 5 à 10 mille jetons à chaque lecture",
        texte:
          "Le tableau d'état d'une vague, lu plusieurs fois par jour par le lead, détaillait chaque lot (objectif, notes, captures, choix). Décision de méthode : un tableau compact, une ligne par lot, le détail sur demande ; les agents de revue répondent en cinq lignes et écrivent leur rapport complet dans un fichier que le lead ne lit que s'il en a besoin.",
        liens: [{ label: "Le mode lead, dans la doc de cadence", href: `${CADENCE}/blob/main/docs/lead.md` }],
      },
      {
        titre: "Piège des fiches : des numéros de ligne qui vieillissent plus vite que le code",
        texte:
          "La revue d'une fiche de spécification a relevé que plusieurs références du type « fichier:ligne » étaient déjà fausses de quelques lignes. Les sources existaient, mais les numéros induisaient en erreur celui qui implémente. Pratique retenue : la revue de fiche vérifie chaque référence dans le fichier et corrige, avant que le code ne soit écrit.",
      },
    ],
    fabrique: [
      {
        titre: "Cadence 1.12.1 à 1.14.1 : l'escalade, la porte rejouée seule, la publication",
        texte:
          "1.12.1 corrige la ligne d'escalade d'un lot rendu sans verdict. 1.13.0 : les sessions se partagent la machine (nombre de coeurs divisé par le plafond de sessions) et `cadence release` prépare le commit de version. 1.14.0 : `cadence verify --gate` rejoue la porte d'un sha dans une copie jetable, un test rouge peut être rejoué seul (testReplay), Node 20 n'est plus supporté, et un parcours mesuré d'un nouvel utilisateur liste neuf accrocs. 1.14.1 : 1.14.0 n'avait jamais atteint npm, un test lisait la section vidée par le commit de version.",
        liens: [CHANGELOG],
      },
      {
        titre: "Cadence 1.15.0 à 1.17.1 : les comptes de commits, le premier parcours, les suites isolées",
        texte:
          "1.15.0 et 1.15.1 : `raf ignore` acquitte aussi un commit qui cite des lots connus, une page de démarrage pour un responsable de plusieurs projets, deux modèles de ticket. 1.16.0 et 1.16.1 : `raf now` et `lead tour` comptent les commits d'un lot comme `raf commits`, vérification de la connexion à Claude Code avant de lancer un lot, une page pour les équipes qui ont déjà leur suivi ; la publication 1.16.0 a échoué parce qu'un test dépendait d'un outil installé sur le poste. 1.17.0 et 1.17.1 : l'acquittement d'un écart de documentation vit dans un fichier à part, la suite de tests ne commite plus dans le vrai dépôt, la porte rejouée ne rougit plus pour des raisons de copie.",
        liens: [CHANGELOG],
      },
      {
        titre: "Cadence 1.18.0 à 1.20.0 : l'archive du plan, la porte réutilisée, le réordonnancement",
        texte:
          "1.18.0 : `cadence verify --gate` réutilise le verdict de la porte de la vague au lieu de la rejouer, et le tirage automatique de lots peut exclure les gros lots sans fiche. 1.19.0 et 1.19.1 : `raf archive` sort les lots clos du plan (559 Ko, environ 150 mille jetons, pour des sessions qui en lisent une douzaine), `raf todo` rouvre un lot clos, toutes les vagues appliquent le même plafond de sessions, la porte de tests devient une étape visible. 1.20.0 : `raf move` réordonne les lots.",
        liens: [CHANGELOG],
      },
      {
        titre: "Cadence 1.21.0 à 1.24.0 : le panneau des lots, la porte avant le push, les corrections moins nombreuses",
        texte:
          "1.21.0 et 1.21.1 : le panneau des lots du mod `cadence-hud` (`/hud lots`) s'ouvre à côté de la conversation, un hook de push refuse les commits d'un lot pas prêt, et une session de correction sans commit doit dire pourquoi. 1.22.0 et 1.22.1 : les projets se replient d'un clic dans le panneau. 1.23.0 : réordonner les lots à la souris, au plus cinq lots par projet, créneaux libres toujours affichés, et la porte de tests de cadence joue aussi le mod. 1.24.0 : la consigne d'implémentation pose les limites et règles avant le pas à pas contre la première cause de passes de correction (le bogue de code trouvé en revue), et un push est refusé si son sha n'a pas de verdict vert de la porte.",
        liens: [CHANGELOG],
      },
      {
        titre: "Cadence 1.25.0, 1.25.1 et 1.26.0",
        texte:
          "1.25.0 : le panneau des lots affiche, pour chaque lot en cours, sa frise de cycle (fiche, implémentation, revue, corrections, porte, intégration), son budget de jetons et sa durée comparée à celle d'un lot de même taille, et ouvre sur « ce qui attend une décision ». 1.25.1 : la publication rejoue le commit dans un clone neuf. 1.26.0 : un agent livreur prend un lot prêt et un sha, joue la vérification, l'enregistrement et la livraison, et rend une seule ligne ou une seule question.",
        liens: [CHANGELOG, { label: "Le panneau, dans la doc de cadence", href: `${CADENCE}/blob/main/docs/cadence-hud.md` }],
      },
      {
        titre: "Un mod : la dernière livraison de chaque projet, sous les lots en cours",
        texte:
          "Le panneau des lots montre pour chaque projet le sha court de sa dernière livraison, son âge en jours, si elle est verte ou rouge, et les lots clos depuis qui n'ont pas été livrés. Il remplace une vérification à la main de l'état de chaque dépôt en début de journée.",
      },
      {
        titre: "Un agent : le livreur, la fin de chaîne déléguée",
        texte:
          "Avant de livrer, il vérifie que le sha est bien un ancêtre de la tête, qu'aucun lot non terminé ne se trouve en dessous et que la décision de QA ne s'y oppose pas. Dans le cas contraire, il répond par une question qui dit l'étape, le sha, la cause et la commande à relancer.",
      },
      {
        titre: "Sur le codex : la page Démarrer se lit mieux",
        texte:
          "La page Démarrer a des titres de section en vrais titres de niveau 2 et des prompts entiers à copier ; c'est la première revue d'écran d'une série qui passera toutes les pages.",
        liens: [{ label: "Nouveautés du site", href: "/nouveautes" }],
      },
    ],
    teste: [
      {
        titre: "Pas de nouveau verdict cette semaine",
        texte:
          "Aucun outil tiers n'a passé le protocole /test-tool entre le 26 octobre et le 1er novembre. Deux candidats attendent au catalogue : un skill d'audit de sécurité publié par un hébergeur, et une liste d'articles de skills à confronter à ce que nous utilisons déjà. Les verdicts déjà rendus restent sur la page des études de cas.",
        liens: [TOOLS_TESTED],
      },
    ],
  },
  {
    semaine: "2026-W43",
    date: "2026-10-25",
    resume:
      "La semaine où la porte de tests des vagues est devenue fiable : le build joué avant les tests, une escalade vers un modèle plus fort avant de rendre un lot, et un plan rangé dans un dossier à part. Cadence 1.9 à 1.12.",
    appris: [
      {
        titre: "Des tests de bout en bout qui lisent le site construit échouent si le build n'a pas eu lieu",
        texte:
          "Ici, les tests de pages lisent le dossier construit. Les répéter dans la commande de test faisait construire deux fois ; les oublier donnait une porte rouge sans cause visible. Le mécanisme, depuis le 25 octobre : cadence joue le build avant les tests, sur la ligne de base comme sur le lot, et un build rouge rend le lot comme un défaut de build, pas de test.",
        liens: [CHANGELOG],
      },
      {
        titre: "Un lot qui touche du code sans toucher un test repart en correction avant la revue",
        texte:
          "La porte de tests de 1.9.0 renvoie en correction un lot dont les commits modifient du code sans un seul test, avant même que le relecteur ne s'en occupe : une passe de correction coûte moins cher qu'une revue.",
      },
      {
        titre: "Décision de méthode : un lot encore non conforme après ses passes est rejoué par un modèle plus fort",
        texte:
          "Règle posée par le lead, oubliée deux fois à la main : avant de rendre un lot, la vague joue une correction et une revue neuve sur un modèle plus fort. Depuis 1.12.0 c'est une clé de configuration, plus un souvenir.",
      },
    ],
    fabrique: [
      {
        titre: "Cadence 1.9.0 à 1.12.0",
        texte:
          "Le plan vit dans un dossier dédié (avec une commande de migration), l'agent doc-keeper vérifie que la documentation suit le code, le mode d'un worktree par lot est disponible, et les agents d'analyse de documents de référence arrivent avec la commande d'analyse de PDF.",
        liens: [CHANGELOG, { label: "Mesures et coûts, cadence perf", href: `${CADENCE}/blob/main/docs/perf.md` }],
      },
    ],
    teste: [
      {
        titre: "Pas de nouveau verdict, un rappel du catalogue : Claude Code sur un modèle local",
        texte:
          "Aucun outil n'a été testé cette semaine-là. Rappel d'un verdict de septembre : un routeur de requêtes est devenu un service multi-agents trop envahissant pour le besoin ; l'API compatible d'un serveur de modèles locaux suffit, à condition de lancer Claude Code en mode minimal, sinon le prompt système dépasse la fenêtre et est tronqué sans message. Le détail est dans le catalogue.",
        liens: [TOOLS_TESTED, { label: "L'atelier IA", href: "/atelier-ia" }],
      },
    ],
  },
];
