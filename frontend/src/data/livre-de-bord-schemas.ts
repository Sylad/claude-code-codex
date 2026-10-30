/**
 * L51 — schémas du Livre de bord : la boucle « vérifier plutôt que croire » de l'entrée thématique
 * du 30-10 et une illustration par épisode. Chaque schéma est une chaîne d'étapes (StepChain) ;
 * `accent` marque l'étape où la vérification a arrêté un défaut ou une perte. Un détail tient
 * sur une ligne de la boîte (une cinquantaine de caractères au plus).
 */
export interface SchemaStep {
  titre: string;
  detail: string;
  accent?: boolean;
}

export interface BookSchema {
  titre: string;
  desc: string;
  legende: string;
  steps: SchemaStep[];
  boucle?: { de: number; vers: number; nom: string; mot: string };
}

export const SCHEMAS: Record<string, BookSchema> = {
  "boucle-verification": {
    titre: "La boucle vérifier plutôt que croire",
    desc: "Cinq étapes : l'IA produit, la porte de tests contrôle, la revue de code relit, la QA regarde le résultat, la personne décide. Une boucle en pointillés ramène de la revue à la production tant qu'un défaut est trouvé.",
    legende: "Chaque étape contrôle la précédente au lieu de la croire. Un défaut trouvé renvoie à la production ; seule la personne passe la dernière étape.",
    steps: [
      { titre: "L'IA produit", detail: "code, texte ou page, avec ses tests" },
      { titre: "Porte de tests", detail: "build et suite complète, rejouées" },
      { titre: "Revue de code", detail: "relecteur neuf : bugs, dérive, docs", accent: true },
      { titre: "QA", detail: "on regarde ce qui est réellement livré" },
      { titre: "La personne décide", detail: "elle seule publie" },
    ],
    boucle: { de: 2, vers: 0, nom: "defaut-trouve", mot: "défaut : on reprend" },
  },
  "episode-finance": {
    titre: "Finance : une vérification partielle, un défaut attrapé par la QA",
    desc: "Quatre étapes : le lot L166 est terminé et relu, la QA confirme la vue par défaut, elle trouve un bilan 2025 périmé encore offert, le lot L167 le fait purger.",
    legende: "La vue par défaut était conforme ; l'onglet voisin ne l'était pas.",
    steps: [
      { titre: "L166 terminé et relu", detail: "bilan de /yearly = année des relevés" },
      { titre: "QA du 30 octobre", detail: "la vue par défaut est conforme" },
      { titre: "Défaut trouvé par la QA", detail: "bilan 2025 périmé, offert dans l'onglet", accent: true },
      { titre: "L167 : purge", detail: "le préchargement retire les autres années" },
    ],
  },
  "episode-warhammer": {
    titre: "Warhammer : une régression attrapée par un test de bout en bout",
    desc: "Trois étapes : le lot L37 retire onze liens de la tabulation, le test de bout en bout de L49 rougit en CI, le lot L217 rescelle ce test.",
    legende: "Le changement de tabulation n'aurait pas été vu sans le test d'un lot plus ancien.",
    steps: [
      { titre: "L37 : menu Lore en bouton", detail: "onze liens retirés de la tabulation" },
      { titre: "Le test de L49 rougit en CI", detail: "90 tabulations tournaient autour de la page", accent: true },
      { titre: "L217 : test rescellé", detail: "l'hypothèse du test n'était plus vraie" },
    ],
  },
  "episode-cadence": {
    titre: "Cadence : un lot repris trois fois, la revue neuve trouve le défaut",
    desc: "Quatre étapes : deux revues successives ne voient pas l'entrée mal rangée du CHANGELOG, une revue neuve la trouve, la suite complète repasse au vert avec 4549 tests sur 4549.",
    legende: "Reprendre n'est pas un échec : la vérification refaite à neuf a fait son travail.",
    steps: [
      { titre: "Revue 1 et revue 2 (L439)", detail: "l'entrée mal rangée passe inaperçue" },
      { titre: "Revue neuve (la troisième)", detail: "CHANGELOG sous une version publiée", accent: true },
      { titre: "Correction et relecture", detail: "l'entrée change de version" },
      { titre: "Suite complète", detail: "4549 tests sur 4549" },
    ],
  },
  "episode-avatar": {
    titre: "Avatar : la porte rejouée sur un commit de plan",
    desc: "Quatre étapes : dernier commit de code à 12 h 21, quatre commits de plan jusqu'à 12 h 35, la porte rejouée pour environ cinq minutes perdues, puis cadence lit le verdict de la vague.",
    legende: "Vérifier trop est aussi une perte : on vérifie ce qui a changé.",
    steps: [
      { titre: "Dernier commit de code : 12 h 21", detail: "porte de tests déjà passée" },
      { titre: "Quatre commits de plan, jusqu'à 12 h 35", detail: "aucun code touché" },
      { titre: "Porte rejouée pour rien", detail: "environ cinq minutes perdues", accent: true },
      { titre: "Désormais", detail: "cadence lit le verdict de la vague" },
    ],
  },
};
