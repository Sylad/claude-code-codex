// L20 — rubrique « Nouveau projet » (/nouveau-projet/). Critères tirés du lot et de la consigne du 02-10,
// mesurés sur le site CONSTRUIT (`npx astro build` avant ; tests navigateur en « skip » sans Chromium) :
//  - la page couvre CLAUDE.md de départ, skills et agents, cadence (plan, Nouveautés, livraison),
//    garde-fous (tests, revue UX, confidentialité), liste de contrôle du premier jour ;
//  - la gestion des tokens y figure point par point : une session par chantier, /clear en fin de lot,
//    contexte relu à chaque tour, sous-agents, mémoires courtes et triées, index de mémoire sous sa limite ;
//  - leçons générales : aucun texte privé (filtre du livre de bord) ;
//  - elle est trouvable : menu Guides, « Les autres guides », accueil ;
//  - lisible à 390 et 1440 px : aucun défilement horizontal, aucun bloc qui sort de son cadre.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';
import { PRIVATE_PATTERNS } from '../src/lib/livre-de-bord.ts';

const PAGE = 'nouveau-projet';
const html = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const main = (h) => h.slice(h.indexOf('<main'), h.indexOf('</main>'));
/** Retire les blocs <script> et <style> (découpage par indexOf, sans expression à retour arrière). */
function sansBlocs(h) {
  let out = h;
  for (const tag of ['script', 'style']) {
    let debut = out.indexOf(`<${tag}`);
    while (debut >= 0) {
      const fin = out.indexOf(`</${tag}>`, debut);
      if (fin < 0) break;
      out = `${out.slice(0, debut)} ${out.slice(fin + tag.length + 3)}`;
      debut = out.indexOf(`<${tag}`, debut);
    }
  }
  return out;
}
/** Remplace chaque balise par une espace (découpage par indexOf). */
function sansBalises(h) {
  let out = '';
  let i = 0;
  for (let debut = h.indexOf('<'); debut >= 0; debut = h.indexOf('<', i)) {
    const fin = h.indexOf('>', debut);
    if (fin < 0) break;
    out += `${h.slice(i, debut)} `;
    i = fin + 1;
  }
  return out + h.slice(i);
}
const texte = (h) => sansBalises(sansBlocs(h))
  .replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');
const section = (h, id) => {
  const m = main(h);
  const debut = m.indexOf(`<section id="${id}"`);
  assert.ok(debut >= 0, `section #${id} absente`);
  const fin = m.indexOf('</section>', debut);
  return texte(m.slice(debut, fin));
};

test('les cinq volets du lot ont chacun leur section', () => {
  const h = html(PAGE);
  assert.match(section(h, 'claude-md'), /CLAUDE\.md/);
  const sk = section(h, 'skills-agents');
  assert.match(sk, /skill/i);
  assert.match(sk, /agent/i);
  const c = section(h, 'cadence');
  for (const mot of [/plan/i, /Nouveautés/, /livraison/i]) assert.match(c, mot);
  const g = section(h, 'garde-fous');
  for (const mot of [/tests?/i, /revue UX/i, /confidentialité/i, /390 px/, /1440 px/]) assert.match(g, mot);
});

test('gestion des tokens : les six points de la consigne', () => {
  const t = section(html(PAGE), 'tokens');
  assert.match(t, /une session par chantier/i);
  assert.match(t, /\/clear en fin de lot/i);
  assert.match(t, /relu à chaque tour/i);
  assert.match(t, /sous-agents?/i);
  assert.match(t, /mémoires courtes et triées/i);
  assert.match(t, /index de mémoire sous sa limite/i);
});

test('liste de contrôle du premier jour : une liste numérotée d\'au moins 8 points', () => {
  const m = main(html(PAGE));
  const liste = m.match(/<ol[^>]*data-liste-premier-jour[^>]*>([\s\S]*?)<\/ol>/)?.[1];
  assert.ok(liste, 'liste de contrôle absente');
  assert.ok((liste.match(/<li\b/g) ?? []).length >= 8);
});

test('aucun texte privé (filtre du livre de bord) dans la page', () => {
  const t = texte(main(html(PAGE)));
  for (const motif of PRIVATE_PATTERNS) assert.doesNotMatch(t, motif);
});

test('trouvable : menu Guides, « Les autres guides » des autres guides, accueil', () => {
  assert.match(html(''), /href="\/nouveau-projet"/, 'accueil');
  for (const g of ['k8s-for-java-developers', 'argocd-k8s-pour-les-nuls', 'cloudflare-pour-les-nuls']) {
    assert.match(html(g), /href="\/nouveau-projet\/"/, `${g} : « Les autres guides »`);
  }
  // L111 : libellés de la barre dans src/lib/libelles-site.mjs (source unique par langue).
  const nav = readFileSync(new URL('../src/lib/libelles-site.mjs', import.meta.url), 'utf8');
  assert.match(nav, /href: '\/nouveau-projet', label: 'Nouveau projet'/);
  // La page ne se liste pas elle-même parmi les autres guides.
  const autres = main(html(PAGE)).match(/<nav aria-labelledby="autres-guides"[\s\S]*?<\/nav>/)[0];
  assert.doesNotMatch(autres, /href="\/nouveau-projet\/"/);
});

test('390 et 1440 px : pas de défilement horizontal, aucun bloc hors de la colonne', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const width of [390, 1440]) {
    const context = await env.browser.newContext({ viewport: { width, height: 900 } });
    await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
    const page = await context.newPage();
    await page.goto(`${env.base}/${PAGE}/`, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const art = document.querySelector('[data-guide]').getBoundingClientRect();
      const dehors = [...document.querySelectorAll('[data-guide] p, [data-guide] li, [data-guide] figure, [data-guide] aside')]
        .filter((el) => { const b = el.getBoundingClientRect(); return b.width > 0 && (b.left < art.left - 1 || b.right > art.right + 1); })
        .map((el) => el.textContent.trim().slice(0, 40));
      return { debord: document.documentElement.scrollWidth - document.documentElement.clientWidth, dehors };
    });
    await context.close();
    assert.equal(r.debord, 0, `${width} px : ${r.debord} px de défilement horizontal`);
    assert.deepEqual(r.dehors, [], `${width} px : blocs hors colonne`);
  }
});
