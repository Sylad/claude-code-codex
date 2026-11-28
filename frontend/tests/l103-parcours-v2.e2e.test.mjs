// L103 (D-4) — étude de cas cadence : le parcours d'un lot montré est celui de cadence 2 (cadence run),
// et le parcours des vagues V1 reste affiché comme historique daté, à part. D'après la demande :
//   - V2 : cadence run (une session Opus, worktree) → porte complète et intégration sur main → revue de
//     code (+ UX si écran), lancée par le lead → livraison et QA par le lead ; une revue non conforme
//     relance un run de correction ; Fable dès la 3e passe ou après deux revues non conformes ;
//   - V1 gardée, datée, clairement séparée, placée après la V2 ;
//   - lisible au téléphone (390 px) et texte agrandi à 200 % sans débordement.
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST, setupBrowser } from './lib/e2e-dist.mjs';

const html = () => readFileSync(join(DIST, 'case-studies', 'cadence', 'index.html'), 'utf8');
const plain = (s) => s.split('<').map((p, i) => (i === 0 ? p : p.slice(p.indexOf('>') + 1))).join(' ').replace(/&#39;/g, "'").replace(/\s+/g, ' ');
const figure = (id) => {
  // découpe par indexOf plutôt qu'une expression à retour arrière (sonarjs/super-linear-regex)
  const h = html();
  const debut = h.indexOf(`data-schema="${id}"`);
  assert.ok(debut >= 0, `figure « ${id} » absente`);
  const fin = h.indexOf('</figure>', debut);
  assert.ok(fin > debut, `figure « ${id} » non fermée`);
  return h.slice(h.indexOf('>', debut) + 1, fin);
};
const nomAccessible = (f) => plain(`${f.match(/<title[^>]*>([^<]*)<\/title>/)[1]} ${f.match(/<desc[^>]*>([^<]*)<\/desc>/)[1]}`);
/** Les mots de `mots` absents de `t` ou hors ordre (liste vide : tout y est, dans l'ordre). */
const horsOrdre = (t, mots) => {
  let from = 0;
  const manquants = [];
  for (const w of mots) {
    const at = t.indexOf(w, from);
    if (at < 0) manquants.push(w);
    else from = at + w.length;
  }
  return manquants;
};

test('R1 — le parcours V2 suit run → porte et intégration sur main → revue → livraison → QA, dans le dessin et le nom accessible', () => {
  const f = figure('parcours-v2');
  const etapes = ['cadence run', 'worktree', 'Porte', 'main', 'Revue', 'revue UX', 'Livraison', 'QA'];
  assert.deepEqual(horsOrdre(plain(f), etapes), [], 'dessin : étapes absentes ou hors ordre');
  assert.deepEqual(horsOrdre(nomAccessible(f), etapes), [], 'nom accessible : étapes absentes ou hors ordre');
});

test('R2 — le parcours V2 dit qui fait quoi : session Opus, Fable en escalade, revue et livraison par le lead', () => {
  const t = nomAccessible(figure('parcours-v2'));
  assert.deepEqual(horsOrdre(t, ['lead', 'Opus', 'Fable', '3e passe de correction', 'cadence', 'même session', 'lead', 'lead', 'lead']), [], 'qui : absent ou hors ordre');
  assert.doesNotMatch(t, /Sonnet|spec-writer|vague/, 'le parcours V2 ne doit rien garder de la V1');
  // revue de code du 26-11 : l'intégration est une avance rapide (rebase, fast-forward), pas une fusion ;
  // une porte rouge est corrigée par la même session, donc pas « sans modèle »
  assert.match(t, /avance rapide sur main/);
  assert.doesNotMatch(plain(figure('parcours-v2')), /fusion|sans modèle/);
});

test('R3 — une revue non conforme ramène à un run de correction (boucle revue → cadence run)', () => {
  const f = figure('parcours-v2');
  assert.match(f, /data-boucle="revue-correction"/, 'boucle absente');
  assert.match(plain(f), /non conforme/);
  // sens de la boucle : le chemin part de la boîte « Revue » et arrive à la boîte « cadence run »
  // (StepChain : M<x> <yDépart> H… V<yArrivée> H…), pas seulement sa présence
  const boites = [...f.matchAll(/<rect[^>]*\by="([\d.]+)"[^>]*\bheight="([\d.]+)"[^>]*><\/rect>\s*<text[^>]*>\d+\. ([^<]+)<\/text>/g)]
    .map((m) => ({ y: Number(m[1]), h: Number(m[2]), titre: m[3] }));
  const boite = (titre) => {
    const b = boites.find((x) => x.titre === titre);
    assert.ok(b, `boîte « ${titre} » introuvable`);
    return b;
  };
  const d = f.match(/<g data-boucle="revue-correction">\s*<path[^>]*\bd="M[\d.]+ ([\d.]+) H[\d.]+ V([\d.]+) /);
  assert.ok(d, 'chemin de la boucle illisible');
  const dans = (y, b) => y > b.y && y < b.y + b.h;
  assert.ok(dans(Number(d[1]), boite('Revue')), `la boucle part de y=${d[1]}, hors de la boîte « Revue »`);
  assert.ok(dans(Number(d[2]), boite('cadence run')), `la boucle arrive à y=${d[2]}, hors de la boîte « cadence run »`);
});

test('R4 — la règle d’escalade est écrite en entier près du schéma : Fable dès la 3e passe de correction ou après deux revues non conformes', () => {
  // L112 : le titre vient des textes de la page (src/contenus/etude-cadence/), l'apostrophe sort en entité
  const h = html().replace(/&#39;/g, "'");
  const avant = plain(h.slice(h.indexOf("Le parcours d'un lot dans cadence 2"), h.indexOf('data-schema="parcours-v2"')));
  assert.match(avant, /troisième passe de correction/);
  assert.match(avant, /deux revues non conformes/);
  assert.match(avant, /Fable/);
});

test('R7 — les étapes encadrées d’orange (accent) sont expliquées par la légende du schéma V2', () => {
  // revue UX du 26-11 (Nielsen 4) : un accent sans légende n'a pas de sens pour le lecteur
  const f = figure('parcours-v2');
  const accent = [...f.matchAll(/<rect class="sch-box-accent"[^>]*><\/rect>\s*<text[^>]*>\d+\. ([^<]+)<\/text>/g)].map((m) => m[1]);
  assert.deepEqual(accent, ['Revue', 'QA']);
  const legende = plain(f.match(/<figcaption[^>]*>([^<]*)<\/figcaption>/)[1]);
  assert.match(legende, /Cadre orange : [^.]*la revue et la QA/, 'légende de l’accent absente');
});

test('R5 — la V1 reste, datée, dans un bloc historique séparé placé après la V2', () => {
  const h = html();
  const v2 = h.indexOf('data-schema="parcours-v2"');
  const bloc = h.indexOf('data-historique="v1"');
  const v1 = h.indexOf('data-schema="parcours-lot"');
  assert.ok(v2 > 0 && bloc > v2 && v1 > bloc, 'ordre attendu : V2, puis bloc historique, puis schéma V1 dedans');
  const date = h.slice(bloc).match(/data-historique-date[^>]*>([^<]+)</);
  assert.ok(date, 'date de l’historique absente');
  assert.match(date[1], /Historique/);
  assert.match(date[1], /V1/);
  assert.match(date[1], /10\s+novembre\s+2026/u);
  assert.match(nomAccessible(figure('parcours-lot')), /V1/, 'le schéma V1 ne se dit pas V1');
  // revue UX du 26-11 : la figure elle-même se dit V1, en texte visible (pas seulement dans son nom accessible)
  const titreVisible = figure('parcours-lot').match(/<p[^>]*data-schema-titre[^>]*>([^<]+)<\/p>/);
  assert.ok(titreVisible, 'figure V1 sans titre visible');
  assert.match(titreVisible[1], /^V1 · /);
  assert.doesNotMatch(figure('parcours-v2'), /data-schema-titre/, 'le titre « V1 » ne doit pas marquer la V2');
  // le bloc historique a sa propre section, distincte de « La méthode »
  const h2s = [...h.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => [m.index, m[1].trim()]);
  const sect = (pos) => h2s.filter(([i]) => i < pos).pop()[1];
  assert.equal(sect(v2), 'La méthode');
  assert.match(sect(v1), /point de départ/i);
});

test('R6 — 390 px et texte à 200 % : le schéma V2 et ses textes restent dans le cadre, lisibles', async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const [largeur, police] of [[390, 16], [1440, 16], [390, 32], [1440, 32]]) {
    const page = await env.browser.newPage({ viewport: { width: largeur, height: 900 } });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: police, fixed: Math.round(police * 13 / 16) } });
    await page.goto(`${env.base}/case-studies/cadence/`);
    const r = await page.evaluate(() => {
      const fig = document.querySelector('figure[data-schema="parcours-v2"]');
      const svg = fig.querySelector('svg');
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const textes = [...svg.querySelectorAll('text')];
      // chaque texte d'étape tient dans la boîte de son étape (rect du même groupe)
      const debordeBoite = textes.filter((x) => {
        const rect = x.parentNode.querySelector(':scope > rect');
        if (!rect) return false;
        const b = x.getBBox();
        return b.x + b.width > rect.x.baseVal.value + rect.width.baseVal.value - 4;
      }).map((x) => x.textContent);
      return {
        scroll: document.documentElement.scrollWidth - window.innerWidth,
        figDroite: fig.getBoundingClientRect().right - window.innerWidth,
        min: Math.min(...textes.map((x) => parseFloat(getComputedStyle(x).fontSize) * scale)),
        debordeBoite,
        vb: svg.viewBox.baseVal.width,
        textesHors: textes.filter((x) => !x.closest('[data-boucle]')).filter((x) => { const b = x.getBBox(); return b.x + b.width > svg.viewBox.baseVal.width; }).length,
      };
    });
    await page.close();
    assert.ok(r.scroll <= 0, `${largeur} px, police ${police} : la page défile de ${r.scroll} px`);
    assert.ok(r.figDroite <= 0.5, `${largeur} px, police ${police} : le schéma dépasse de ${r.figDroite} px`);
    assert.deepEqual(r.debordeBoite, [], `${largeur} px, police ${police} : texte(s) hors de leur boîte`);
    assert.equal(r.textesHors, 0, `${largeur} px, police ${police} : ${r.textesHors} texte(s) hors du viewBox`);
    if (largeur === 390 && police === 16) assert.ok(r.min >= 11, `390 px : plus petit texte rendu à ${r.min.toFixed(1)} px`);
  }
});
