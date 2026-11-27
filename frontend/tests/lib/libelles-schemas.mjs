// L110 — mesure des libellés des schémas (Schema.astro et ses dessins) sur la page affichée.
// Raisonne sur la largeur RÉELLE du texte rendu (getBoundingClientRect), jamais sur un écart fixe :
//   - dessin SVG : chaque <text> qui part dans une boîte (<rect>) doit tenir dans cette boîte, avec à droite
//     la même marge qu'à gauche (celle de son libellé le plus à gauche, au moins MARGE px) ; un <text> hors
//     de toute boîte (lien entre deux groupes, mot de la boucle) ne touche aucune boîte et reste dans le dessin ;
//   - un libellé resserré par src/lib/ajuster-libelles.mjs ne l'est pas au-delà de SERRAGE_MAX ;
//   - deux libellés ne se chevauchent jamais (intersection des rectangles rendus) ;
//   - version en liste (texte agrandi) : chaque libellé tient dans son cadre (pas de débordement).
// Les fonctions ci-dessous tournent DANS la page (injectées par leur source) : chacune n'utilise que ses
// paramètres et les autres fonctions de LIB.
export const MARGE = 2; // px : un texte collé au trait de sa boîte se lit comme un débordement
// un libellé trop long est resserré à sa place (textLength) ; au-delà de 15 %, il faut le raccourcir
export const SERRAGE_MAX = 1.15;
export const TOLERANCE = 1.5; // px : approche des glyphes (le rectangle rendu d'un texte n'est pas son encre)

function rect(e) {
  const r = e.getBoundingClientRect();
  return { l: r.left, t: r.top, r: r.right, b: r.bottom };
}

function seCroisent(a, b) {
  return Math.min(a.r, b.r) - Math.max(a.l, b.l) > 0.5 && Math.min(a.b, b.b) - Math.max(a.t, b.t) > 0.5;
}

function estAffiche(e) {
  return Boolean(e) && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0;
}

// largeur naturelle / largeur imposée par textLength (1 si le libellé n'est pas resserré)
function serrage(t) {
  const impose = t.getAttribute('textLength');
  if (!impose) return 1;
  const ajuste = t.getAttribute('lengthAdjust');
  t.removeAttribute('textLength');
  t.removeAttribute('lengthAdjust');
  const naturel = t.getComputedTextLength();
  t.setAttribute('textLength', impose);
  t.setAttribute('lengthAdjust', ajuste);
  return naturel / Number(impose);
}

// la plus petite boîte qui contient le point d'ancrage (début de la ligne de base), sauf texte tourné
function boiteDe(t, boites) {
  if (t.hasAttribute('transform')) return undefined;
  const x = t.x.baseVal[0]?.value ?? 0;
  const y = t.y.baseVal[0]?.value ?? 0;
  return boites
    .filter((b) => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)
    .sort((p, q) => p.w * p.h - q.w * q.h)[0];
}

function ecartDansBoite(x, textes, o) {
  const b = x.dans.box;
  const premier = Math.min(...textes.filter((y) => y.dans === x.dans).map((y) => y.box.l));
  const gauche = Math.max(o.MARGE, premier - b.l - o.TOLERANCE);
  const depasse = Math.max(b.l + o.MARGE - x.box.l, x.box.r - (b.r - gauche), b.t - x.box.t, x.box.b - b.b);
  if (depasse <= 0.5) return [];
  return [`« ${x.txt} » déborde de sa boîte de ${depasse.toFixed(1)} px (texte ${(x.box.r - x.box.l).toFixed(1)} px, boîte ${(b.r - b.l).toFixed(1)} px)`];
}

function ecartHorsBoite(x, boites, cadre) {
  const e = boites.filter((b) => seCroisent(x.box, b.box)).map(() => `« ${x.txt} » (hors boîte) chevauche une boîte`);
  const sort = Math.max(cadre.l - x.box.l, x.box.r - cadre.r, cadre.t - x.box.t, x.box.b - cadre.b);
  if (sort > 0.5) e.push(`« ${x.txt} » sort du dessin de ${sort.toFixed(1)} px`);
  return e;
}

// deux éléments dont l'un contient l'autre (un <span> dans un autre) ne comptent pas comme un chevauchement
function chevauchements(elements, libelle) {
  const e = [];
  const imbriques = (a, b) => Boolean(a.s && b.s && (a.s.contains(b.s) || b.s.contains(a.s)));
  elements.forEach((a, i) => {
    for (const b of elements.slice(i + 1)) {
      if (!imbriques(a, b) && seCroisent(a.box, b.box)) e.push(`${libelle(a)} chevauche ${libelle(b)}`);
    }
  });
  return e;
}

function ecartsDessin(svg, o) {
  const boites = [...svg.querySelectorAll('rect')].map((rc) => ({
    x: rc.x.baseVal.value, y: rc.y.baseVal.value, w: rc.width.baseVal.value, h: rc.height.baseVal.value, box: rect(rc),
  }));
  const cadre = rect(svg);
  const ecarts = [];
  const textes = [...svg.querySelectorAll('text')].filter((t) => t.textContent.trim()).map((t) => {
    const serre = serrage(t);
    if (serre > o.SERRAGE_MAX) ecarts.push(`« ${t.textContent.trim()} » resserré ×${serre.toFixed(2)} (illisible au-delà de ×${o.SERRAGE_MAX})`);
    return { txt: t.textContent.trim(), box: rect(t), dans: boiteDe(t, boites) };
  });
  for (const x of textes) ecarts.push(...(x.dans ? ecartDansBoite(x, textes, o) : ecartHorsBoite(x, boites, cadre)));
  ecarts.push(...chevauchements(textes, (x) => `« ${x.txt} »`));
  return ecarts;
}

function ecartsCadreListe(c) {
  const ecarts = [];
  if (c.scrollWidth > c.clientWidth + 0.5) ecarts.push(`liste : « ${c.textContent.trim().slice(0, 40)} » déborde (${c.scrollWidth} > ${c.clientWidth} px)`);
  const b = rect(c);
  const lignes = [...c.querySelectorAll(':scope > span')].flatMap((s) => [...s.getClientRects()].map((r) => ({ s, r })));
  for (const { s, r } of lignes) {
    const depasse = Math.max(b.l - r.left, r.right - b.r);
    if (depasse > 0.5) ecarts.push(`liste : « ${s.textContent.trim()} » déborde de ${depasse.toFixed(1)} px`);
  }
  return ecarts;
}

function ecartsListe(liste) {
  const ecarts = [...liste.querySelectorAll('.sch-etape, .sch-sous > li, .sch-boucle')].flatMap(ecartsCadreListe);
  const lignes = [...liste.querySelectorAll('span, .sch-boucle')]
    .flatMap((s) => [...s.getClientRects()].map((r) => ({ s, box: { l: r.left, t: r.top, r: r.right, b: r.bottom } })));
  ecarts.push(...chevauchements(lignes, (x) => `liste : « ${x.s.textContent.trim()} »`));
  return ecarts;
}

function mesurerFigures(o) {
  return [...document.querySelectorAll('figure.schema')].map((f) => {
    const svg = f.querySelector(':scope > svg');
    const liste = f.querySelector(':scope > .sch-liste');
    if (estAffiche(svg)) return { id: f.dataset.schema, version: 'svg', ecarts: [...new Set(ecartsDessin(svg, o))] };
    if (estAffiche(liste)) return { id: f.dataset.schema, version: 'liste', ecarts: [...new Set(ecartsListe(liste))] };
    return { id: f.dataset.schema, version: null, ecarts: [] };
  });
}

const LIB = [rect, seCroisent, estAffiche, serrage, boiteDe, ecartDansBoite, ecartHorsBoite, chevauchements, ecartsDessin, ecartsCadreListe, ecartsListe, mesurerFigures];

/** Par schéma de la page : { id, version ('svg' | 'liste' | null), ecarts: [texte] } (vide = conforme). */
export async function mesurerLibelles(page) {
  await page.addScriptTag({ content: `window.__libellesL110 = (o) => {\n${LIB.map(String).join('\n')}\nreturn mesurerFigures(o);\n};` });
  return page.evaluate((o) => window.__libellesL110(o), { MARGE, TOLERANCE, SERRAGE_MAX });
}

// Largeurs et tailles de police par défaut (16 = 100 %, 32 = 200 %) mesurées par L110 et L113.
export const LARGEURS = [320, 390, 840, 1440];
export const POLICES = [16, 32];

/**
 * Ouvre `path` à la largeur et à la taille de police données (police réglée par CDP, Page.setFontSizes, comme
 * un vrai réglage du navigateur), polices web bloquées ou chargées, et rend la mesure de mesurerLibelles.
 */
export async function mesurerPage(env, path, largeur, police, policesWeb) {
  const context = await env.browser.newContext({ viewport: { width: largeur, height: 900 } });
  if (!policesWeb) await context.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Page.setFontSizes', { fontSizes: { standard: police, fixed: Math.round(police * 13 / 16) } });
  await page.goto(`${env.base}${path}`);
  await page.waitForFunction((v) => getComputedStyle(document.documentElement).fontSize === `${v}px`, police);
  await page.evaluate(() => document.fonts.ready);
  const r = await mesurerLibelles(page);
  await context.close();
  return r;
}
