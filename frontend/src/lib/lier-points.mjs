// L106 — sur-titres « A · B · C » : chaque « · » est lié au mot qui le suit par une espace insécable.
// La ligne ne peut alors se couper qu'AVANT un « · » (espace ordinaire), entre deux groupes, et jamais
// laisser un « · » seul en fin de ligne (vu à 320–390 px sur l'accueil).
// Découpage sur « · » plutôt qu'une expression régulière (sonarjs/super-linear-regex).
export const lierPoints = (texte) =>
  String(texte)
    .split('·')
    .map((groupe) => groupe.trim())
    .join(' · ');
