/**
 * L9 — les trois guides longs (revue UX r0) : même mise en page (GuideLayout), sommaire, ancres,
 * date de mise à jour, et le bloc « Les autres guides » en bas de page.
 */
export interface GuideSectionInfo {
  /** Ancre stable de la section (id du <section>), en minuscules et tirets. */
  id: string;
  /** Petit surtitre (numéro de section, « Conclusion »…), facultatif. */
  number?: string;
  /** Intitulé du h2. */
  title: string;
}

export interface Guide {
  href: string;
  titre: string;
  resume: string;
}

export const GUIDES: Guide[] = [
  {
    href: "/k8s-for-java-developers/",
    titre: "Kubernetes pour développeurs Java",
    resume: "Le vocabulaire de Kubernetes traduit en concepts Spring, Maven et Tomcat.",
  },
  {
    href: "/argocd-k8s-pour-les-nuls/",
    titre: "ArgoCD + K8s pour les nuls",
    resume: "Pourquoi tant de YAML, ce que fait GitOps, et deux incidents vécus.",
  },
  {
    href: "/cloudflare-pour-les-nuls/",
    titre: "Cloudflare pour les nuls",
    resume: "Tunnel, DNS et Access, racontés à travers une panne de trois semaines.",
  },
];

/** Indexe les sections par id, en vérifiant qu'aucun id n'est vide ni répété (échec du build sinon). */
export function sectionsParId<T extends GuideSectionInfo>(sections: T[]): Record<string, T> {
  const vus = new Set<string>();
  for (const s of sections) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) throw new Error(`guide : id de section invalide « ${s.id} »`);
    if (vus.has(s.id)) throw new Error(`guide : id de section répété « ${s.id} »`);
    vus.add(s.id);
  }
  return Object.fromEntries(sections.map((s) => [s.id, s]));
}
