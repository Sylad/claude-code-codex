// L86 — /learning et /about en français courant, comme /videos (L82). Relevé par la QA de L82 en prod
// le 23-11 : « curés », « ship », « Filtres de curation ». Mesuré sur le site CONSTRUIT (`npx astro build`
// avant) : le texte visible du <main>, le <title> et la description de la page ne contiennent plus ces
// mots. Les noms propres (« Dan Shipper ») restent tels quels.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

function texte(page) {
  const h = readFileSync(join(DIST, page, 'index.html'), 'utf8');
  const main = h.slice(h.indexOf('<main'), h.lastIndexOf('</main>'));
  const tete = [...h.matchAll(/<title>([^<]*)<\/title>|<meta[^>]+(?:name|property)="(?:description|og:description|og:title)"[^>]+content="([^"]*)"/g)]
    .map((m) => m[1] ?? m[2]).join(' ');
  return (tete + ' ' + main
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<[^>]+>/g, ' '))
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ');
}

// Mêmes équivalents que L82 : curés → choisis / sélectionnés, ship → livrer / publier, curation → sélection.
const ANGLICISMES = [/\bcur[ée]e?s?\b/i, /\bcuration\b/i, /\bship(p[ée]e?s?|s)?\b/i];

for (const [page, repere] of [['learning', 'Catalogue des sources'], ['about', 'Sources']]) {
  test(`L86 — aucun anglicisme relevé dans le texte de /${page}`, () => {
    const t = texte(page);
    assert.ok(t.includes(repere), `texte de /${page} introuvable (build à jour ?)`);
    const trouves = ANGLICISMES.flatMap((re) => t.match(new RegExp(re.source, 'gi')) ?? []);
    assert.deepEqual(trouves, [], `anglicismes encore présents sur /${page} : ${trouves.join(', ')}`);
  });
}

test('L86 — les noms propres restent tels quels sur /learning', () => {
  const t = texte('learning');
  for (const nom of ['Dan Shipper', 'Every — Source Code', 'Anthropic Engineering']) {
    assert.ok(t.includes(nom), `« ${nom} » a disparu`);
  }
});
