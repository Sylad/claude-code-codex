/*
  L112 — textes français de l'étude de cas de cadence (/case-studies/cadence/). La mise en page est
  src/components/pages/EtudeCadence.astro, partagée avec la version anglaise (en.ts, mêmes clés).
  Historique du contenu (L19, L33, L93, L103, L104) : voir les commentaires des données ci-dessous.
  L19 — contenu tiré du dépôt public Sylad/cadence (README, docs/whats-new.md, CHANGELOG, docs/mesures/,
  docs/perf/) : chaque chiffre y a sa source, nommée dans la section « Les chiffres mesurés ». Rien de privé :
  pas de machine, pas de chemin, pas de compte pro.
  L93 (D-3) : la méthode des vagues et les chiffres d'octobre sont ceux de la V1 (versions 1.x), dit comme tel ;
  chaque chiffre du chapitre « Le problème de la V1 » a son fichier, sa date et sa version (data-nombres /
  data-source, vérifiés contre le dépôt cadence par tests/l93-cadence-v1.e2e.test.mjs).
  Règle (L108) : un changement ici a son pendant dans en.ts, dans le même lot.
*/
import { DESIGN, doc, html } from "./commun";
import { LEAD, MEMOIRE, PLAN_COMMITS, chiffres, insecable, livreur, parcours, parcoursV2, pieces } from "./fr-parcours";
import { LIEN_V1, echecs, v1Causes, v1Mesures, v2Decisions } from "./fr-histoire";

export const FR = {
  insecable,
  page: {
    title: "Cadence",
    description:
      "Étude de cas de cadence, la méthode de travail et l'outil de ce codex : un plan versionné relié aux commits, des sessions IA lancées par un programme, des livraisons prouvées par leur effet. Le problème, la méthode et les chiffres de la V1 (vagues de sessions, versions 1.x), ses échecs, et pourquoi cadence 2 l'a remplacée : mesures de temps et de jetons, décisions prises.",
  },
  hero: {
    eyebrow: "Case study · cadence",
    title: "Un plan relié aux commits, des sessions IA mesurées",
    intro:
      "Cadence est la méthode de travail derrière les projets de ce codex : un plan versionné à côté du code, des sessions Claude Code lancées par un programme, des livraisons prouvées par leur effet. Né le 28 septembre 2026, il a connu deux générations. La V1 (versions 1.x) faisait passer chaque lot par une vague de sessions courtes ; cadence 2, depuis le 10 novembre, confie chaque demande à une seule session. Le parcours d’un lot décrit ci-dessous est celui de cadence 2 ; le parcours des vagues et les chiffres d’octobre sont ceux de la V1, gardés comme point de départ, et le dernier chapitre dit ce qu’elle coûtait et ce qui a changé.",
  },
  donnees: { PLAN_COMMITS, parcours, parcoursV2, livreur, LEAD, MEMOIRE, pieces, chiffres, echecs, v1Mesures, v1Causes, v2Decisions },
  probleme: {
    eyebrow: "Le problème de départ",
    h1: "Deux questions qui reviennent sans cesse",
    p1: html`Coder avec une IA fait aller vite, et perdre le fil tout aussi vite. Deux
        questions reviennent sans cesse : <strong>qu'est-ce qui reste à faire ?</strong>
        et <strong>à quoi servait ce commit ?</strong> Dans une conversation, la
        réponse s'évapore à la fin de la session ; dans un outil de tickets, elle
        vit loin du code et se périme.`,
    h2: "Ce que ça coûtait",
    p2: html`Avec huit projets menés en parallèle et plusieurs sessions par jour, le
        coût devenait visible : des lots recommencés, des commits sans raison
        écrite, des livraisons « réussies » qui ne faisaient pas ce qu'on croyait.
        Le premier commit de cadence (28 septembre 2026) ne contient d'ailleurs
        que l'essentiel : un plan en YAML et le calcul du lien entre commits et lots.`,
    principeTitre: "Le principe retenu",
    principe: html`<strong>Tout l'état vit dans des fichiers ordinaires à côté du code</strong>,
          lisibles par l'humain comme par la prochaine session, et chaque
          affirmation (« c'est livré », « c'est testé ») doit pouvoir être rejouée.`,
  },
  methode: {
    eyebrow: "La méthode",
    piecesTitre: "Sept pièces qui s'emboîtent",
    piecesIntro: html`Sept pièces, chacune optionnelle, qui s'emboîtent. Le détail de chaque
        commande est dans la documentation du dépôt ; ici, ce que chacune
        règle.`,
    piecesV1: html`Six d'entre elles restent dans cadence 2. La cinquième, les vagues
        orchestrate, est celle de la <strong>V1 (versions 1.x)</strong> : depuis
        le 10 novembre 2026, une demande se fait avec <code>cadence run</code>,
        une seule session (chapitre ${LIEN_V1}).`,
    v1Seulement: "V1 seulement",
    planTitre: "Le plan, relié aux commits",
    planIntro: html`Tout part du plan : un lot a un numéro, et chaque commit qui travaille
        dessus le cite. Le lien se lit dans les deux sens, sans base de données.`,
    planSchema: {
      titre: "Le plan relié aux commits",
      desc: "Un fichier de plan contient les lots L4 et L5. Les commits « fix(L4) » et « feat(L5) » citent chacun leur lot. Les commandes raf commits, raf now et raf check lisent ce lien et en tirent ce qu'un lot a produit, la suite du travail et les écarts.",
      legende: "Le plan (un fichier YAML) liste des lots ; chaque commit cite son lot dans son message ; trois commandes lisent ce lien.",
    },
    parcoursTitre: "Le parcours d'un lot dans cadence 2",
    parcoursP1: html`Depuis le 10 novembre 2026, un lot se fait avec <code>cadence run</code> :
        une seule session Opus le prend de bout en bout, dans une copie de
        travail à part (un worktree). Le programme cadence rejoue ensuite la
        porte complète (build et tests) ; si elle est rouge, la même session
        corrige et la repasse. Le travail arrive ensuite sur <code>main</code>
        par avance rapide, sans commit de fusion. Le lead lance alors la revue de code, et la revue
        UX si le lot touche un écran.`,
    parcoursP2: html`Une revue non conforme relance un <code>cadence run</code> de
        correction, qui repasse la porte puis la revue. Dès la troisième passe de
        correction, ou après deux revues non conformes, la correction est confiée à Fable.
        Le lot revu, le lead le livre et fait vérifier les pages livrées (QA).`,
    parcoursSchema: {
      legende: "Les six étapes d'un lot dans cadence 2. Une revue non conforme relance un run de correction : la boucle en pointillés. Cadre orange : les deux contrôles faits par un regard neuf, la revue et la QA.",
      boucle: "non conforme : correction",
      titre: "Le parcours d'un lot dans cadence 2",
      desc: "Six étapes dans l'ordre, chacune avec qui la fait. Une boucle en pointillés ramène de la revue à un nouveau cadence run de correction tant que la revue n'est pas conforme ; dès la troisième passe de correction, ou après deux revues non conformes, la correction passe à Fable.",
    },
    retenirTitre: "À retenir",
    retenir: html`Le lead choisit les lots à jouer, mais aucune étape ne se croit sur
          parole : chacune laisse une trace (sha, verdict, capture) que la
          suivante relit.`,
    livraisonTitre: "La livraison, déléguée",
    livraison: html`Un lot prêt n'est pas livré pour autant. Le lead le confie au livreur,
        qui joue la porte et la livraison (chaîne ci-dessous) et ne rend qu'une ligne ou une question ;
        le lead regarde les captures et décide.
        Les lots visibles se lisent dans le panneau du plan publié sur ce site.`,
    livreurSchema: {
      legende: "La chaîne du livreur, du lot prêt à la ligne rendue au lead. Une étape qui échoue arrête la chaîne.",
      titre: "La chaîne du livreur",
      desc: "Sept étapes dans l'ordre, du lot prêt à la ligne rendue au lead. Une étape qui échoue arrête la chaîne.",
    },
    panneauAlt: "Le panneau des lots de la page Plan de travail : la section « Prévu » et la liste des lots à venir, chacun avec son titre public.",
    panneauLegende: "Le panneau des lots tel que le publie la page Plan de travail : un titre par lot, rangé en cours, prévu ou livré.",
    leadTitre: "Le lead et ses créneaux",
    lead: html`Le lead ne code pas : il tient des créneaux. Chaque créneau est une
        session qui travaille, au plus une par dépôt pour que deux runs ne se
        marchent pas dessus. Dès qu'un run rend la main (une ligne, ou une
        question), le lead relit le résultat et remplit le créneau libéré avec
        le lot suivant du plan, sans attendre qu'on le lui demande. Une question
        se tranche tout de suite quand la réponse est réversible et sourcée ;
        le reste remonte à l'humain, pendant que les autres créneaux continuent.`,
    leadSchema: {
      titre: "Le lead et ses créneaux",
      desc: "Le lead, une session de pilotage, choisit le lot suivant dans l'ordre des priorités, un run par dépôt. Il remplit deux sortes de créneaux : un créneau occupé par un cadence run, une session dans un dépôt, et un créneau libre qu'il remplit sans attendre. Le run occupé rend au lead une ligne ou une question ; le créneau se libère alors pour le lot suivant.",
      legende: "Le lead remplit les créneaux de session, un run par dépôt ; chaque run rend une ligne ou une question. Pointillés : le créneau libéré reçoit aussitôt le lot suivant.",
    },
    hudAlt: "La bande du mod cadence-hud le 8 octobre 2026 : en tête, le contexte de la session et les quotas ; puis deux projets, chacun avec le lot en cours, son étape (revue, implémentation), le modèle qui la joue, les lots en attente, le budget de jetons et « 1 session/2 ».",
    hudLegende: html`Ce que voit le lead : la bande du mod <code class="font-mono text-claude-soft">cadence-hud</code>,
          capturée le 8 octobre 2026, au temps de la V1 (vagues orchestrate). Une ligne par projet
          en cours, avec son lot, l'étape, le modèle et les lots en attente ; « 1 session/2 » y
          compte les créneaux occupés sur le plafond réglé ce jour-là. Toucher l'image l'ouvre en
          taille réelle.`,
    memoireTitre: "Une mémoire en fichiers, jamais dans la conversation",
    memoire: html`Les sessions sont neuves et courtes : aucune ne se souvient de la
        précédente. Ce qui passe d'une session à l'autre est écrit dans des
        fichiers du projet. Le plan et l'historique git sont versionnés avec le
        code ; les journaux de run gardent le brief, le résultat et la porte de
        chaque run. Une session qui démarre les relit ; en partant, elle y
        laisse un commit qui cite son lot, un verdict ou une note.`,
    memoireSchema: {
      titre: "Une mémoire en fichiers",
      desc: "Trois fichiers du projet : le plan (raf.yaml, lots et verdicts), l'historique (git log, commits et lots) et les journaux (.cadence/runs, brief et porte). Chaque session neuve lit ces fichiers au départ ; rien ne vient d'une conversation passée. Ce qu'elle laisse, un commit, un verdict, une note, est écrit dans ces mêmes fichiers et relu par la session suivante.",
      legende: "La mémoire partagée : le plan, l'historique git et les journaux de run. Chaque session neuve les relit et y écrit ; pointillés : ce qu'elle laisse est relu par la suivante.",
    },
  },
  depart: {
    eyebrow: "Le point de départ : la V1",
    date: "Historique · V1 (versions 1.x), jusqu'au 10 novembre 2026",
    titre: "Le parcours d'un lot dans une vague (V1)",
    texte: html`Ce parcours ne tourne plus : c'est celui d'où cadence 2 est parti. En
          V1, dans une vague, un lot passait de session en session, chacune
          courte et neuve. Les tests d'acceptation étaient écrits par une session
          à part et verrouillés rouges : l'implémentation devait les faire passer
          sans les toucher. Le chapitre ${LIEN_V1}
          dit ce que ce parcours coûtait.`,
    schema: {
      legende: "V1 · les six étapes d'un lot dans une vague. La revue pouvait renvoyer le lot en correction, puis le relire : la boucle en pointillés.",
      titre: "V1 · Le parcours d'un lot dans une vague",
      boucle: "reprise",
      desc: "Historique de la V1. Six étapes dans l'ordre, chacune avec qui la faisait. Une boucle en pointillés ramène de la correction à la revue tant que la revue trouve quelque chose.",
    },
    docVagues: "· la documentation des vagues",
  },
  chiffresV1: {
    eyebrow: "Les chiffres mesurés de la V1",
    note: html`Ces relevés datent d'octobre 2026 et portent sur les vagues de la
        <strong>V1 (versions 1.x)</strong> : ils ne mesurent pas <code>cadence run</code>.`,
    intro: html`Cadence se mesure lui-même : <code>cadence perf</code> affiche chaque
        indicateur de vitesse à côté de son jumeau de qualité (« vite <em>et</em>
        bien »), sans compter de volume produit. Les relevés ci-dessous sont dans
        le dépôt, avec la commande qui les rejoue.`,
    source: "V1 · source :",
    limite: html`Limite assumée : le classement des causes est celui d'un modèle local de
        24 milliards de paramètres. Le relevé du 10 octobre a été relu à la main sur
        un échantillon (17 passes sur 24 d'accord) ; le relevé du 30 octobre, d'où
        viennent les 136 et les 96, n'a pas été relu : l'accord n'y est pas calculé. Il
        est un point de départ ; l'effet du mécanisme posé contre les cas limites
        n'est pas encore mesuré.`,
  },
  echecsV1: {
    eyebrow: "Les échecs et ce qu'ils ont changé",
    intro: html`Une méthode qui ne raconte pas ses ratés n'est qu'une plaquette. Cinq
        épisodes de la V1, tirés du journal des versions et des relevés du dépôt :`,
    change: "Ce que ça a changé.",
  },
  problemeV1: {
    eyebrow: "Le problème de la V1",
    essaiTitre: "Un essai perdu, le 7 novembre",
    essai: html`La V1 donnait des lots revus, testés et livrés, mais à un prix que ses
        propres relevés montraient. Le 7 novembre 2026, la 1.62, dernière version
        de la V1, a refait 8 vraies demandes déjà livrées, contre Claude Code seul,
        depuis le même commit. Elle a perdu sur le temps et sur les jetons ; ce qu'en
        ont dit le juge à l'aveugle et les tests cachés est sur la page
        <a href="/case-studies/pourquoi-cadence/">Pourquoi cadence</a>.`,
    source: "Source :",
    causesTitre: "Cinq causes, quatre mesurées",
    causes: html`Le document de conception de cadence 2 (<a href="${doc(DESIGN)}" target="_blank" rel="noopener" class="[overflow-wrap:anywhere]">↗ ${DESIGN}</a>,
        7 novembre 2026) attribue la défaite à cinq causes. Il en mesure quatre ; la deuxième,
        C2, n'y est que décrite, sans chiffre :`,
    decrite: "Décrite, pas mesurée.",
    laisseTitre: "Ce que la V1 laisse",
    laisse: html`Cadence 2 garde ce que la V1 apportait vraiment : le plan relié aux
          commits, la porte de tests, la livraison vérifiée, la revue courte du
          diff, la revue sur captures des écrans et le contrôle dans le
          navigateur après livraison.`,
    decisionsTitre: "Les décisions de cadence 2",
    decisions: html`Chaque décision dit à quelle cause elle répond. Quand son effet est mesuré,
        la mesure est dite ; quand il ne l'est pas encore, c'est dit aussi.`,
    repond: (causes: string[]) => (causes.length ? `Répond à ${causes.join(", ")}` : "Ne répond à aucune des cinq causes"),
    effetMesure: "Effet mesuré.",
    pasMesure: "Pas encore mesuré.",
    preuvesBanc: html`<a href="/case-studies/pourquoi-cadence/">Lire les preuves du banc</a>.`,
    manque: html`Ce qui manque encore : le relevé du temps d'un lot (25 min et 266 k jetons
        en V1) n'a pas été refait pour <code>cadence run</code>. La comparaison de
        la V1 et de cadence 2 sur le travail réel reste à faire ; les preuves qui
        existent viennent du banc, sur quelques demandes.`,
  },
  plusLoin: {
    eyebrow: "Pour aller plus loin",
    note: "",
    liens: [
      html`Les cinq besoins qui ont fait naître cadence, et ce qu'en dit le
          banc qui l'oppose à Claude seul : <a href="/case-studies/pourquoi-cadence/">Pourquoi cadence</a>.`,
      html`Semaine par semaine, ce qui a été appris, fabriqué et testé :
          le <a href="/livre-de-bord/">Livre de bord</a>.`,
      html`Ce qui change pour l'utilisateur de ce site, lot par lot, sur la
          page <a href="/nouveautes/">Nouveautés</a>, et ce qui se prépare dans le
          <a href="/plan-de-travail/">Plan de travail</a>.`,
      html`Le même fonctionnement, appliqué à un produit complet :
          <a href="/case-studies/maritime-atlas">AetherWX</a>.`,
    ],
    depot: "↗ Dépôt cadence",
    paquet: "↗ Paquet npm @sylad/cadence",
    changelog: "↗ CHANGELOG",
    demarrage: "↗ Démarrage en 10 minutes",
    releve: "Chiffres relevés dans le dépôt cadence : ceux de la V1 au 30 octobre 2026, ceux du chapitre « Le problème de la V1 » au 24 novembre 2026.",
  },
};

/**
 * L112 — forme des textes de l'étude, dans les deux langues : celle du français, moins les champs d'audit que seul
 * le français porte (`nombres`, `passages`, vérifiés par l93 sur la version française), rendus facultatifs.
 * en.ts s'y conforme par `satisfies` : une clé absente de l'anglais fait échouer tsc (porte d'analyse).
 */
type ChampsFrancais = "nombres" | "passages";
type Partage<T> = T extends (...a: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? Partage<U>[]
    : T extends object
      ? { [K in keyof T as K extends ChampsFrancais ? never : K]: Partage<T[K]> } & {
          [K in keyof T as K extends ChampsFrancais ? K : never]?: T[K];
        }
      : T;
export type ContenuEtudeCadence = Partage<typeof FR>;
