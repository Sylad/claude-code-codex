// L15 — preuve qu'aucun texte privé du plan (docs/plan/raf.yaml) ne sort dans le site
// construit. La règle « publié ou pas » n'est PAS recopiée ici : elle vient du code de la
// page (publicTitleOf, src/lib/plan-public.ts).
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { newsTitlesByLot, publicTitleOf } from '../../src/lib/plan-public.ts';

const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', ecirc: 'ê',
  agrave: 'à', acirc: 'â', ccedil: 'ç', ocirc: 'ô', ucirc: 'û', icirc: 'î', laquo: '«', raquo: '»',
  rsquo: '’', lsquo: '‘', hellip: '…', mdash: '—', ndash: '–', Eacute: 'É', Agrave: 'À',
};

/** Texte comparable : entités HTML et échappements JSON/JS décodés, espaces fusionnées. */
export function normalize(s) {
  return String(s)
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\([\\/"'])/g, '$1')
    .replace(/\\[nrt]/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, n) => NAMED[n] ?? m)
    .replace(/[\s  ]+/g, ' ');
}

/** Plancher : en dessous, un texte n'est qu'un mot ou deux qui peuvent figurer ailleurs. */
export const MIN_NEEDLE = 12;

/**
 * Textes privés du plan : titres bruts (sauf s'ils sont aussi le titre publié), notes,
 * verdicts UX, raisons, titres de sous-tâches, et `public:` des lots NON publiés.
 * Renvoie [[étiquette, texte normalisé (60 premiers caractères)]].
 */
export function privateTexts(raf, newsEntries) {
  const newsTitles = newsTitlesByLot(newsEntries);
  const published = new Set();
  for (const l of raf.lots) {
    const t = publicTitleOf(l, newsTitles);
    if (t) published.add(t);
  }
  const out = [];
  for (const l of raf.lots) {
    const isPublished = publicTitleOf(l, newsTitles) !== null;
    out.push([`${l.id} titre brut`, l.title]);
    if (!isPublished && typeof l.public === 'string') out.push([`${l.id} public: (lot non publié)`, l.public]);
    for (const n of l.notes ?? []) out.push([`${l.id} note`, n.text]);
    if (l.ux?.verdict) out.push([`${l.id} verdict UX`, l.ux.verdict]);
    if (l.reason) out.push([`${l.id} raison`, l.reason]);
    for (const t of l.tasks ?? []) {
      out.push([`${l.id}/${t.id} titre`, t.title]);
      for (const n of t.notes ?? []) out.push([`${l.id}/${t.id} note`, n.text]);
      if (t.reason) out.push([`${l.id}/${t.id} raison`, t.reason]);
    }
  }
  return out
    .filter(([, s]) => typeof s === 'string' && !published.has(s.trim()))
    .map(([k, s]) => [k, normalize(s).trim().slice(0, 60)]);
}

const SCANNED = new Set(['.html', '.js', '.mjs', '.json', '.css', '.txt', '.xml', '.svg', '.map', '.webmanifest']);

export function listFiles(dir) {
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (SCANNED.has(extname(e.name))) files.push(p);
    }
  };
  walk(dir);
  return files;
}

/** Fuites trouvées dans `dir` : [« étiquette → fichier »]. */
export function scanForLeaks(dir, needles) {
  const leaks = [];
  for (const f of listFiles(dir)) {
    const text = normalize(readFileSync(f, 'utf8'));
    for (const [k, s] of needles) if (text.includes(s)) leaks.push(`${k} → ${f.slice(dir.length)}`);
  }
  return leaks;
}
