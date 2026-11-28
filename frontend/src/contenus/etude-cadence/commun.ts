/*
  L112 — l'étude de cas de cadence en contenu partagé : une seule mise en page
  (src/components/pages/EtudeCadence.astro), un fichier de textes par langue (fr.ts, en.ts) et ce module,
  commun aux deux : les adresses du dépôt et les fichiers sources, écrits une seule fois.
*/
export const CADENCE = "https://github.com/Sylad/cadence";
export const NPM = "https://www.npmjs.com/package/@sylad/cadence";
export const doc = (chemin: string) => `${CADENCE}/blob/main/${chemin}`;
export const DESIGN = "docs/v2/2026-11-07-cadence-2-design.md";
export const TEMPS_LOT = "docs/mesures/temps-d-un-lot.md";

/** Texte HTML d'un paragraphe écrit sur plusieurs lignes du fichier : espaces resserrés comme dans le gabarit. */
export function html(morceaux: TemplateStringsArray, ...valeurs: unknown[]) {
  return String.raw({ raw: morceaux }, ...valeurs).replace(/\s+/g, " ").trim();
}
