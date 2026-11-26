// L106 — sur-titres « A · B · C » : chaque « · » est lié au mot qui le suit par une espace insécable.
// La ligne ne peut alors se couper qu'AVANT un « · » (espace ordinaire), entre deux groupes, et jamais
// laisser un « · » seul en fin de ligne (vu à 320–390 px sur l'accueil).
export const lierPoints = (texte) => String(texte).replace(/\s*·\s+/g, ' · ');
