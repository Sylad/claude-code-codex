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
