// L111 — une source unique de libellés par langue pour la barre et le pied (src/lib/libelles-site.mjs),
// préparée pour L112 (site entier bilingue) : mêmes entrées, mêmes adresses dans les deux langues, aucun
// libellé écrit en dur dans les composants.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LIBELLES, libelles, lienDans } from '../src/lib/libelles-site.mjs';
import { ENTREE_EN, TRADUITES } from '../src/lib/langues.mjs';

/** Squelette d'un jeu de libellés : clés et adresses, sans le texte. */
const squelette = (v) =>
  Array.isArray(v) ? v.map(squelette)
  : typeof v === 'function' ? 'fn'
  : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'href' || k === 'id' ? x : squelette(x)]))
  : typeof v;

/** Tous les textes d'un jeu de libellés. */
const textes = (v) =>
  Array.isArray(v) ? v.flatMap(textes)
  : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => (k === 'href' || k === 'id' ? [] : textes(x)))
  : typeof v === 'string' ? [v] : [];

test('R1 — les deux langues ont les mêmes entrées, dans le même ordre, vers les mêmes adresses', () => {
  assert.deepEqual(squelette(LIBELLES.en), squelette(LIBELLES.fr));
  for (const t of [...textes(LIBELLES.fr), ...textes(LIBELLES.en)]) assert.ok(t.trim(), 'libellé vide');
});

test('R2 — les libellés anglais sont en anglais (aucun mot français courant ni accent du français)', () => {
  const fr = /[éèàùçêâîôû]|\b(le|la|les|des|du|pour|avec|sans|de|ouvrir|fermer|nouveautés?)\b/i;
  for (const t of textes(LIBELLES.en)) assert.doesNotMatch(t, fr, `« ${t} »`);
  assert.equal(libelles('en').nonVues(1), '1 unseen update');
  assert.equal(libelles('en').nonVues(3), '3 unseen updates');
  assert.equal(libelles('en').nonVues(0), '');
  assert.equal(libelles('fr').nonVues(2), '2 nouveautés non vues');
  assert.equal(libelles('xx'), LIBELLES.fr, 'langue inconnue : français');
});

test('R3 — un lien mène à la version anglaise quand elle existe, sinon à la page française (annoncée)', () => {
  for (const p of TRADUITES) {
    assert.deepEqual(lienDans(p, 'en'), { href: `/en${p}`, langue: 'en' });
    assert.deepEqual(lienDans(p, 'fr'), { href: p, langue: 'fr' });
  }
  assert.deepEqual(lienDans('/about', 'en'), { href: '/about', langue: 'fr' });
  assert.deepEqual(lienDans('/about', 'fr'), { href: '/about', langue: 'fr' });
  assert.ok(TRADUITES.some((p) => `/en${p}` === ENTREE_EN), '« No English yet » doit mener à une page traduite');
});

test('R4 — la barre et le pied n’écrivent aucun libellé en dur : ils lisent la source unique', () => {
  const navbar = readFileSync(new URL('../src/components/site/Navbar.vue', import.meta.url), 'utf8');
  const pied = readFileSync(new URL('../src/components/site/Footer.astro', import.meta.url), 'utf8');
  const code = (src) => src.split('\n').filter((l) => !/^\s*(\/\/|<!--|\*|\{\/\*)/.test(l)).join('\n');
  for (const [nom, src] of [['Navbar.vue', code(navbar)], ['Footer.astro', code(pied)]]) {
    for (const t of [...textes(LIBELLES.fr.barre), ...textes(LIBELLES.fr.telephone), ...textes(LIBELLES.fr.pied)]) {
      if (['Learning', 'Guides', 'Case studies', 'Claude Code (Anthropic)', 'vibe coded with'].includes(t)) continue;
      assert.ok(!src.includes(`"${t}"`) && !src.includes(`>${t}<`) && !src.includes(`'${t}'`), `${nom} écrit « ${t} » en dur`);
    }
    assert.match(src, /libelles-site\.mjs/, `${nom} ne lit pas libelles-site.mjs`);
  }
});
