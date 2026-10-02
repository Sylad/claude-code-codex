/**
 * L15 — ce que la page « Plan de travail » publie du plan (docs/plan/raf.yaml, tenu par raf).
 * Repris d'evatosorus (L28, après ses revues de code et d'ergonomie), modèle finance-tracker :
 *
 *   1. seuls les lots `visible: true` (changements pour le visiteur), non abandonnés ;
 *   2. TITRE PUBLIC seulement, jamais le titre brut du plan : le champ `public:` du lot
 *      (une chaîne sur une ligne), sinon — pour un lot LIVRÉ seulement — le titre de la
 *      Nouveauté la plus récente qui le cite, sinon le lot est masqué ; les lots de
 *      processus (« Revue … », « Audit … », « Campagne … ») exigent un `public:` ;
 *   3. liste blanche : id, titre public, état, date de livraison, décompte des
 *      sous-tâches non abandonnées — jamais les notes, verdicts UX, raisons d'abandon,
 *      titres de sous-tâches ;
 *   4. un titre public non conforme (> 80 caractères, « / », nom de fichier, nom de
 *      technique, identifiant de lot, sujet de sécurité) fait échouer le build : on
 *      corrige le plan, on ne publie pas. Un plan absent ou illisible aussi.
 *
 * Module pur, testé par node --test (tests/plan-public.test.mjs) ; la page l'appelle au
 * build. `publicTitleOf` est LA règle d'exclusion : le test de fuite sur dist/ l'importe.
 */
import { parse } from 'yaml';

export type PublicStatus = 'doing' | 'todo' | 'done';

export interface PublicLot {
  id: string;
  title: string;
  status: PublicStatus;
  /** Lot terminé : date de livraison (YYYY-MM-DD) si le plan la connaît. */
  finished?: string;
  /** Sous-tâches non abandonnées : combien sont faites sur combien. */
  tasks?: { done: number; total: number };
  /** Autres lots du même groupe au même titre public, fondus dans cette ligne. */
  also?: string[];
}

export interface PublicPlan {
  doing: PublicLot[];
  todo: PublicLot[];
  /** Les RECENT_DONE derniers lots terminés publiés, le plus récent en haut. */
  done: PublicLot[];
  counts: { doing: number; todo: number; done: number };
}

/** Nombre de lots livrés affichés (« récemment livré »). */
export const RECENT_DONE = 8;
export const PUBLIC_TITLE_MAX = 80;

const STATUSES: ReadonlySet<string> = new Set(['doing', 'todo', 'done']);
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const day = (v: unknown): string | undefined => (typeof v === 'string' && DAY.test(v) ? v : undefined);
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Même liste noire que finance-tracker et evatosorus (comparaison sans casse ni accents).
const DENY = [
  /securit/, /faille/, /spoof/, /injection/, /\btoken/, /\bjeton/, /secret/,
  /mot de passe/, /password/, /\bpin\b/, /\bcve\b/, /vulnerab/, /\bxss\b/,
  /\bcsrf\b/, /x-forwarded/, /forgeable/, /\bauth/, /bypass/,
];
const isDenied = (title: unknown) => DENY.some((re) => re.test(fold(String(title ?? ''))));

/** Noms de technique interne (pas « vue » : c’est aussi un mot courant) : sans intérêt pour le visiteur. */
const TECH = /\b(localstorage|sessionstorage|ya?ml|json|astro|tailwind|playwright|cdp|aria|css|html|dom|raf|cadence|regex)\b/i;
/** Nom de fichier (« raf.yaml », « Navbar.vue », « news-badge.ts »…). */
const FILE = /\b[\w-]+\.(ya?ml|json|m?[jt]s|astro|vue|md|css|html?|png|jpe?g|svg|sh)\b/i;

/** Lots de processus : jamais publiés sans `public:` explicite. */
const PROCESS = [/^revue\b/, /^audit\b/, /^campagne\b/];
export const isProcessLot = (title: unknown) => PROCESS.some((re) => re.test(fold(String(title ?? '')).trim()));

/** Titre montré au visiteur ; non conforme → erreur (le build échoue). */
export function checkPublicTitle(title: unknown, where: string): string {
  const t = String(title ?? '').trim();
  const why =
    !t ? 'vide'
      : /[\r\n]/.test(t) ? 'sur plusieurs lignes'
        : t.length > PUBLIC_TITLE_MAX ? `${t.length} caractères (> ${PUBLIC_TITLE_MAX})`
          : t.includes('/') ? 'contient « / »'
            : FILE.test(t) ? 'cite un fichier'
              : TECH.test(t) ? 'nom de technique'
                : /\b[A-Z]{1,3}\d+\b/.test(t) ? 'cite un identifiant de lot'
                  : isDenied(t) ? 'liste noire sécurité'
                    : null;
  if (why) throw new Error(`titre public de ${where} non conforme (${why}) : « ${t} »`);
  return t;
}

/** Entrées Nouveautés (du plus récent au plus ancien) → titre de la plus récente citant chaque lot. */
export function newsTitlesByLot(entries: readonly { title?: unknown; lots?: unknown }[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const e of entries) {
    if (typeof e?.title !== 'string' || !Array.isArray(e.lots)) continue;
    for (const id of e.lots) if (!m.has(String(id))) m.set(String(id), e.title);
  }
  return m;
}

/**
 * LA règle d'exclusion : titre public d'un lot du plan, ou null s'il n'est pas publié.
 * Un `public:` qui n'est pas une chaîne sur une ligne est une erreur de plan (exception),
 * même sur un lot masqué ; le contenu d'un titre publié est vérifié par checkPublicTitle.
 */
export function publicTitleOf(raw: unknown, newsTitles: ReadonlyMap<string, string | undefined> = new Map()): string | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const where = typeof r.id === 'string' ? r.id : 'un lot';
  if (r.public !== undefined && r.public !== null && (typeof r.public !== 'string' || /[\r\n]/.test(r.public))) {
    throw new Error(`champ public: de ${where} non conforme (une chaîne sur une seule ligne attendue)`);
  }
  if (r.visible !== true || typeof r.id !== 'string') return null;
  if (typeof r.status !== 'string' || !STATUSES.has(r.status)) return null;
  if (isDenied(r.title)) return null;
  let title: unknown = r.public;
  if (title == null && r.status === 'done' && !isProcessLot(r.title)) title = newsTitles.get(r.id);
  if (title == null) return null;
  return checkPublicTitle(title, r.id);
}

type Ranked = PublicLot & { sortKey: string };

function toPublic(raw: unknown, newsTitles: ReadonlyMap<string, string | undefined>): Ranked | null {
  const title = publicTitleOf(raw, newsTitles);
  if (title === null) return null;
  const r = raw as Record<string, unknown>;
  const lot: Ranked = {
    id: r.id as string,
    title,
    status: r.status as PublicStatus,
    sortKey: day(r.finished) ?? day(r.started) ?? day(r.created) ?? '',
  };
  if (lot.status === 'done' && day(r.finished)) lot.finished = day(r.finished);
  if (Array.isArray(r.tasks)) {
    const states = r.tasks
      .filter((t) => typeof t === 'object' && t !== null)
      .map((t) => (t as Record<string, unknown>).status)
      .filter((s) => s !== 'dropped');
    if (states.length) lot.tasks = { done: states.filter((s) => s === 'done').length, total: states.length };
  }
  return lot;
}

const strip = ({ sortKey: _sortKey, ...lot }: Ranked): PublicLot => lot;

/**
 * Deux lots d'un même groupe au même titre public (une Nouveauté qui en raconte deux) ne
 * font qu'une ligne — la première de la liste reçue (la plus récente pour les livrés),
 * étapes additionnées, les autres identifiants en `also`.
 */
function mergeSameTitle(group: Ranked[]): Ranked[] {
  const byTitle = new Map<string, Ranked>();
  for (const l of group) {
    const kept = byTitle.get(l.title);
    if (!kept) {
      byTitle.set(l.title, { ...l });
      continue;
    }
    kept.also = [...(kept.also ?? []), l.id];
    if (l.tasks) {
      const t = kept.tasks ?? { done: 0, total: 0 };
      kept.tasks = { done: t.done + l.tasks.done, total: t.total + l.tasks.total };
    }
  }
  return [...byTitle.values()];
}

export function publicPlan(
  plan: unknown,
  { newsTitles = new Map() }: { newsTitles?: ReadonlyMap<string, string | undefined> } = {},
): PublicPlan {
  const rawLots = typeof plan === 'object' && plan !== null ? (plan as { lots?: unknown }).lots : null;
  const lots = (Array.isArray(rawLots) ? rawLots : []).map((l) => toPublic(l, newsTitles)).filter((l) => l !== null);
  const doing = mergeSameTitle(lots.filter((l) => l.status === 'doing'));
  const todo = mergeSameTitle(lots.filter((l) => l.status === 'todo'));
  // Tri stable : à date égale, le lot le plus loin dans le plan (le plus récent) d'abord.
  const done = mergeSameTitle(lots
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => l.status === 'done')
    .sort((a, b) => b.l.sortKey.localeCompare(a.l.sortKey) || b.i - a.i)
    .map(({ l }) => l));
  return {
    doing: doing.map(strip),
    todo: todo.map(strip),
    done: done.slice(0, RECENT_DONE).map(strip),
    counts: { doing: doing.length, todo: todo.length, done: done.length },
  };
}

/**
 * Lit le texte de raf.yaml (schéma YAML 1.2 core : dates laissées en texte). Un YAML
 * illisible ou sans liste `lots` est une erreur : le build échoue plutôt que publier une
 * page vide en silence.
 */
export function parsePublicPlan(
  yamlText: string,
  newsEntries: readonly { title?: unknown; lots?: unknown }[] = [],
): PublicPlan {
  const plan: unknown = parse(yamlText);
  if (typeof plan !== 'object' || plan === null || !Array.isArray((plan as { lots?: unknown }).lots)) {
    throw new Error('plan illisible : docs/plan/raf.yaml doit contenir une liste « lots »');
  }
  return publicPlan(plan, { newsTitles: newsTitlesByLot(newsEntries) });
}

const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

/** Bandeau de décomptes de la page : groupes vides omis (pas de « 0 prévu »). */
export function planSummary(counts: PublicPlan['counts']): string[] {
  return [
    counts.doing ? count(counts.doing, 'travail en cours', 'travaux en cours') : '',
    counts.todo ? count(counts.todo, 'prévu', 'prévus') : '',
    counts.done ? count(counts.done, 'livré', 'livrés') : '',
  ].filter(Boolean);
}

/** Avancement d'un lot : « 1 étape faite sur 2 », « 2 étapes faites sur 3 » (0 et 1 au singulier). */
export function stepsLabel({ done, total }: { done: number; total: number }): string {
  return `${done} ${done > 1 ? 'étapes faites' : 'étape faite'} sur ${total}`.replace(/ /g, ' ');
}
