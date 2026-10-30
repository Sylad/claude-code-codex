// L49 — audit de lisibilité du site construit : `node scripts/audit-lisibilite.mjs [dist]`.
// Lecture seule (ne lit que frontend/dist, qu'il faut construire avant : `npx astro build`).
import { auditDist, rapportMarkdown } from '../src/lib/lisibilite.mjs';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const dist = args.find((a) => !a.startsWith('--')) ?? fileURLToPath(new URL('../dist/', import.meta.url));
const pages = auditDist(dist);
if (pages.length === 0) {
  console.error(`Aucune page index.html dans ${dist} : construire le site d'abord (cd frontend && npx astro build).`);
  process.exit(1);
}
console.log(rapportMarkdown(pages));
