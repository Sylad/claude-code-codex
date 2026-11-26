// L104 (WCAG 1.4.4, revue UX de L103 du 26-11) — le texte des schémas (Schema + StepChain) grandit avec la
// taille de police du navigateur et reste lisible au téléphone. Mesuré par la revue : à 390 px, titres
// 12,2 → 11,0 px et détails 10,6 → 9,6 px de 100 à 200 %, la légende passant à 26 px.
// Critères du lot :
//   - à 320, 375 et 390 px, taille du texte à 200 % ≥ 2 × celle à 100 %, titres ET détails, pour chaque
//     schéma (texte visible : le dessin ou sa version en liste, celle qui est affichée) ;
//   - aucun défilement latéral à 320 et 375 px (100 et 200 %) ;
//   - à 1440 px et 100 %, le schéma reste le dessin SVG (rendu inchangé) ;
//   - une seule des deux versions est affichée (jamais lue deux fois) ;
//   - tablette (règle 2 de Schema.astro, écran ≥ 480 px et cadre < 25 em) : à 600 et 768 px, la liste
//     remplace le dessin à 200 %, le dessin reste à 100 % ;
//   - le dessin et sa liste disent la même chose : chaque texte du SVG se retrouve dans la liste (sauf un
//     en-tête de colonne propre au dessin, marqué data-sch-entete : la liste dit le lien par sa flèche).
// 200 % = police par défaut 32 px réglée par CDP (Page.setFontSizes), comme un vrai réglage du navigateur.
// Lit le site CONSTRUIT : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { setupBrowser } from './lib/e2e-dist.mjs';

const PAGES = ['/case-studies/cadence/', '/case-studies/pourquoi-cadence/', '/livre-de-bord/'];

async function mesurer(env, path, largeur, police) {
  const context = await env.browser.newContext({ viewport: { width: largeur, height: 900 } });
  await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Page.setFontSizes', { fontSizes: { standard: police, fixed: Math.round(police * 13 / 16) } });
  await page.goto(`${env.base}${path}`);
  await page.waitForFunction((v) => getComputedStyle(document.documentElement).fontSize === `${v}px`, police);
  const r = await page.evaluate(() => {
    const visible = (e) => e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
    const schemas = [...document.querySelectorAll('figure.schema')].map((f) => {
      const svg = f.querySelector(':scope > svg');
      const liste = f.querySelector(':scope > .sch-liste');
      const montres = [visible(svg) && 'svg', visible(liste) && 'liste'].filter(Boolean);
      let titre = 0;
      let detail = 0;
      if (montres[0] === 'svg') {
        const k = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
        const px = (sel) => { const e = svg.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) * k : 0; };
        titre = px('.sch-t');
        detail = px('.sch-m') || px('.sch-a') || titre;
      } else if (montres[0] === 'liste') {
        const px = (sel) => { const e = liste.querySelector(sel); return e ? parseFloat(getComputedStyle(e).fontSize) : 0; };
        titre = px('.sch-titre');
        detail = px('.sch-detail') || px('.sch-qui') || titre;
      }
      const norm = (x) => x.replace(/\s+/g, ' ').trim();
      const textesSvg = svg ? [...svg.querySelectorAll('text:not([data-sch-entete])')].map((e) => norm(e.textContent)).filter(Boolean) : [];
      const absents = liste ? textesSvg.filter((x) => !norm(liste.textContent).includes(x)) : [];
      return { id: f.dataset.schema, montres, titre, detail, aListe: Boolean(liste), absents };
    });
    return { schemas, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });
  await context.close();
  return r;
}

test('L104 R1 — au téléphone, texte des schémas à 200 % ≥ 2 × celui à 100 % (titres et détails), sans défilement latéral', { timeout: 300_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const path of PAGES) {
    for (const largeur of [320, 375, 390]) {
      const a = await mesurer(env, path, largeur, 16);
      const b = await mesurer(env, path, largeur, 32);
      assert.ok(a.schemas.length > 0, `${path} : aucun schéma`);
      for (const [r, pct] of [[a, 100], [b, 200]]) {
        assert.ok(r.scroll <= 0, `${path} ${largeur} px ${pct} % : la page défile de ${r.scroll} px`);
        for (const s of r.schemas) assert.equal(s.montres.length, 1, `${path} ${largeur} px ${pct} % ${s.id} : versions affichées ${JSON.stringify(s.montres)}`);
      }
      for (const [i, s] of a.schemas.entries()) {
        const z = b.schemas[i];
        const tag = `${path} ${largeur} px, ${s.id}`;
        assert.ok(s.aListe, `${tag} : pas de version en liste pour le texte agrandi`);
        assert.ok(z.titre >= 2 * s.titre - 0.05, `${tag} : titre ${s.titre.toFixed(1)} → ${z.titre.toFixed(1)} px (×2 attendu)`);
        assert.ok(z.detail >= 2 * s.detail - 0.05, `${tag} : détail ${s.detail.toFixed(1)} → ${z.detail.toFixed(1)} px (×2 attendu)`);
      }
    }
  }
});

test('L104 R2 — à 1440 px et 100 %, chaque schéma reste le dessin SVG ; à 200 % son texte grandit', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const path of PAGES) {
    const a = await mesurer(env, path, 1440, 16);
    const b = await mesurer(env, path, 1440, 32);
    for (const [i, s] of a.schemas.entries()) {
      assert.deepEqual(s.montres, ['svg'], `${path} ${s.id} : à 1440 px et 100 %, le dessin attendu`);
      assert.ok(b.schemas[i].titre >= s.titre * 1.8, `${path} ${s.id} : à 1440 px, titre ${s.titre.toFixed(1)} → ${b.schemas[i].titre.toFixed(1)} px à 200 %`);
    }
    assert.ok(b.scroll <= 0, `${path} 1440 px 200 % : la page défile`);
  }
});

test('L104 R3 — tablette (600 et 768 px) : à 200 % la liste remplace le dessin, à 100 % le dessin reste', { timeout: 120_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const path of PAGES) {
    for (const largeur of [600, 768]) {
      const a = await mesurer(env, path, largeur, 16);
      const b = await mesurer(env, path, largeur, 32);
      assert.ok(a.schemas.length > 0, `${path} : aucun schéma`);
      for (const s of a.schemas) assert.deepEqual(s.montres, ['svg'], `${path} ${largeur} px 100 % ${s.id} : le dessin attendu`);
      for (const [i, s] of b.schemas.entries()) {
        assert.deepEqual(s.montres, ['liste'], `${path} ${largeur} px 200 % ${s.id} : la liste attendue à la place du dessin`);
        // le ×2 est un critère du téléphone ; ici le dessin à 100 % est déjà grand (20 px) : la liste doit
        // au moins faire grandir le titre, et à la taille du texte (0,9375rem = 30 px à 32 px).
        assert.ok(s.titre > a.schemas[i].titre && s.titre >= 0.9375 * 32 - 0.05, `${path} ${largeur} px ${s.id} : titre ${a.schemas[i].titre.toFixed(1)} → ${s.titre.toFixed(1)} px`);
      }
      assert.ok(b.scroll <= 0, `${path} ${largeur} px 200 % : la page défile de ${b.scroll} px`);
    }
  }
});

test('L104 R4 — chaque texte du dessin se retrouve dans sa version en liste (une seule source)', { timeout: 60_000 }, async (t) => {
  const env = await setupBrowser(t);
  if (!env) return;
  for (const path of PAGES) {
    const r = await mesurer(env, path, 1440, 16);
    for (const s of r.schemas) assert.deepEqual(s.absents, [], `${path} ${s.id} : textes du dessin absents de la liste`);
  }
});
