/**
 * L44 — règles de publication du Livre de bord (/livre-de-bord/) : une entrée datée par
 * semaine ISO, trois rubriques (appris, fabriqué, testé), des liens vers des pages qui
 * existent. Le filtre est strict : un chemin de machine, un secret, un nom de machine, du
 * compte pro, une adresse e-mail ou une mention de confidentialité dans un titre, un texte,
 * un résumé ou un libellé de lien fait échouer le build — on corrige l'entrée, on ne publie pas.
 *
 * Module pur, testé par node --test (tests/livre-de-bord.test.mjs) ; la page l'appelle au build
 * (src/pages/livre-de-bord.astro) et le test de la page importe PRIVATE_PATTERNS.
 */
export interface BookLink {
  label: string;
  href: string;
}

export interface BookItem {
  titre: string;
  texte: string;
  liens?: BookLink[];
}

export interface BookEntry {
  /** Semaine ISO « 2026-W44 » (lundi au dimanche). */
  semaine: string;
  /** Jour d'écriture « YYYY-MM-DD », dans la semaine. */
  date: string;
  resume: string;
  appris: BookItem[];
  fabrique: BookItem[];
  teste: BookItem[];
}

/** Motifs interdits dans tout texte publié (le premier qui touche suffit). */
export const PRIVATE_PATTERNS: RegExp[] = [
  /\/home\//, // chemin de machine
  /~\//,
  /[A-Za-z]:\\/,
  /\/volume\d/,
  /\b\d{1,3}(?:\.\d{1,3}){3}\b/, // adresse IP
  /\bsk-[A-Za-z0-9_-]{6,}/, // clé d'API
  /\bghp_\w+/, // jeton GitHub
  /API[_-]?KEY/i,
  /\b(?:dark|big|mini)-blue\b/i, // noms de machines
  /\bmeteo-gis\b/i, // banc du projet pro
  /\bcompte pro\b/i,
  /[\w.+-]+@[\w-]+\.\w{2,}/, // adresse e-mail
  /confidentiel/i,
  /contractuel/i,
];

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const WEEK = /^\d{4}-W\d{2}$/;
const DAY_MS = 86_400_000;

const utc = (day: string) => new Date(`${day}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Semaine ISO « YYYY-Www » d'un jour « YYYY-MM-DD ». */
export function weekOf(day: string): string {
  const d = utc(day);
  const dow = (d.getUTCDay() + 6) % 7; // lundi = 0
  const thursday = new Date(d.getTime() + (3 - dow) * DAY_MS); // le jeudi donne l'année ISO
  const year = thursday.getUTCFullYear();
  const jan1 = Date.UTC(year, 0, 1);
  const week = Math.floor((thursday.getTime() - jan1) / DAY_MS / 7) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Lundi et dimanche d'une semaine ISO « YYYY-Www ». */
export function weekBounds(week: string): { from: string; to: string } {
  const [y, w] = week.split('-W').map(Number);
  const jan4 = Date.UTC(y, 0, 4);
  const mondayOfWeek1 = jan4 - ((new Date(jan4).getUTCDay() + 6) % 7) * DAY_MS;
  const from = new Date(mondayOfWeek1 + (w - 1) * 7 * DAY_MS);
  return { from: iso(from), to: iso(new Date(from.getTime() + 6 * DAY_MS)) };
}

function linkProblem(l: BookLink | undefined, isKnownPath: (path: string) => boolean): string | null {
  if (!l || typeof l.label !== 'string' || !l.label.trim()) return 'libellé vide';
  if (typeof l.href !== 'string') return 'adresse absente';
  if (/^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)*\/?)?(?:#[\w-]+)?$/.test(l.href)) {
    const path = l.href.split('#')[0];
    return isKnownPath(path.length > 1 ? path.replace(/\/$/, '') : path) ? null : `page inconnue ${l.href}`;
  }
  if (/^https:\/\/github\.com\/Sylad\/cadence(\/[\w./#-]*)?$/.test(l.href)) return null;
  return `adresse non permise ${l.href}`;
}

/** Tout ce qui empêche de publier ces entrées ; liste vide = publiable. */
export function findProblems(entries: BookEntry[], isKnownPath: (path: string) => boolean): string[] {
  const out: string[] = [];
  const texts = (where: string, ...values: unknown[]) => {
    for (const v of values) {
      const hit = typeof v === 'string' ? PRIVATE_PATTERNS.find((re) => re.test(v)) : undefined;
      if (hit) out.push(`${where} : contenu privé, bloqué par le filtre (${hit})`);
    }
  };
  const seen = new Set<string>();
  let previous: string | undefined;
  for (const e of entries) {
    const where = `entrée ${e.semaine}`;
    if (typeof e.semaine !== 'string' || !WEEK.test(e.semaine)) {
      out.push(`${where} : semaine attendue au format 2026-W44`);
      continue;
    }
    if (typeof e.date !== 'string' || !DAY.test(e.date)) out.push(`${where} : date attendue au format AAAA-MM-JJ`);
    else if (weekOf(e.date) !== e.semaine) out.push(`${where} : la date ${e.date} est hors de la semaine ${e.semaine}`);
    if (seen.has(e.semaine)) out.push(`${where} : deux entrées pour la semaine ${e.semaine}`);
    else if (previous !== undefined && e.semaine > previous) out.push(`${where} : la plus récente en premier (après ${previous})`);
    seen.add(e.semaine);
    previous = e.semaine;
    if (typeof e.resume !== 'string' || !e.resume.trim()) out.push(`${where} : résumé vide`);
    texts(`${where} résumé`, e.resume);
    const rubriques = { appris: e.appris, fabrique: e.fabrique, teste: e.teste };
    let filled = 0;
    for (const [name, items] of Object.entries(rubriques)) {
      if (!Array.isArray(items)) {
        out.push(`${where} : rubrique ${name} absente`);
        continue;
      }
      filled += items.length;
      items.forEach((it, i) => {
        const at = `${where} ${name}[${i}]`;
        if (typeof it.titre !== 'string' || !it.titre.trim()) out.push(`${at} : titre vide`);
        if (typeof it.texte !== 'string' || !it.texte.trim()) out.push(`${at} : texte vide`);
        texts(at, it.titre, it.texte);
        for (const l of it.liens ?? []) {
          const p = linkProblem(l, isKnownPath);
          if (p) out.push(`${at} : lien refusé (${p})`);
          texts(`${at} lien`, l?.label, l?.href);
        }
      });
    }
    if (filled === 0 && Object.values(rubriques).every(Array.isArray)) out.push(`${where} : aucune rubrique remplie`);
  }
  return out;
}
