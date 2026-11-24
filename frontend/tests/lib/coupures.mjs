// L88 (WCAG 1.4.10) — oracle des coupures de mots, écrit d'après la spec du lot et la revue r1, sans rien
// reprendre du script de césure (src/lib/cesure.mjs) : il ne connaît ni le dictionnaire ni l'algorithme,
// il regarde le rendu.
//
// 1. Dans la page (`releverCoupures`) : tout le texte visible de <body> (hors code, pre, kbd, samp, svg,
//    éléments masqués), mot par mot — un mot est une suite sans espace, même répartie sur plusieurs nœuds
//    (<span>, <wbr>) d'un même bloc. Chaque endroit où un mot passe à la ligne suivante est une coupure.
//    Une coupure est permise sans trait si la spec l'autorise :
//      - après un trait d'union ou une barre oblique écrits ;
//      - à la ponctuation d'un nom : après un signe (« : », « _ », « . », « ) »… mais ni une apostrophe ni
//        un signe ouvrant), avant « ( », « _ », « . », « ~ », « / » (usage des URL et identifiants), entre
//        minuscule et majuscule (camelCase), entre lettres et chiffres avec 3 caractères au moins de chaque
//        côté (revue r1, M3 ; revue r2, M3-bis).
//    Toute coupure, même permise, qui laisse sur sa ligne un morceau du mot sans lettre ni chiffre
//    (« , utiliser », « ) », « pas / ») est une faute (revue r2, m-a).
//    Toute autre coupure doit montrer un trait d'union dessiné : elle est renvoyée avec la zone de l'écran
//    qui suit la dernière lettre de la ligne.
// 2. Dans le test (`verifierCoupures`) : chaque zone est capturée deux fois, texte visible puis texte
//    transparent ; la différence est l'encre du texte. Sans encre après la dernière lettre, le mot est coupé
//    sans trait. Avec un trait : à une frontière de syllabe (revue r2, M3-bis : pas « tok-ens »,
//    « modelcontextp-rotocol »), au moins 3 lettres de chaque côté (M2), pas plus de 2 lignes à trait de
//    suite dans un même bloc (M2), et le mot ne tient pas sur une ligne entière de son bloc (M1).

export function releverCoupures() {
  // Le texte masqué aux aides techniques mais visible (aria-hidden) compte : on juge ce qui se voit.
  const EXCLUS = 'code, pre, kbd, samp, script, style, noscript, template, svg, textarea';
  const range = document.createRange();
  const blocs = new Map();
  const blocDe = (el) => {
    for (let e = el; e; e = e.parentElement) {
      if (blocs.has(e)) return blocs.get(e);
      const d = getComputedStyle(e).display;
      if (d !== 'inline' && d !== 'contents') {
        blocs.set(e, e);
        return e;
      }
    }
    return document.body;
  };
  // Rectangles d'un caractère. Chromium rattache le trait de césure qu'il dessine à la dernière lettre de
  // la ligne ET au caractère qui ouvre la ligne suivante : la lettre est le premier rectangle du caractère
  // de fin de ligne, la ligne d'un caractère est celle de son dernier rectangle.
  const rectsDe = (node, i) => {
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    return [...range.getClientRects()].filter((x) => x.width > 0.1 || x.height > 0);
  };
  // Le glyphe du caractère : son premier rectangle, sauf si celui-ci est sur une autre ligne (le trait
  // rattaché au caractère qui ouvre la ligne).
  const glyphe = (rs) => (rs.length > 1 && Math.abs(rs[0].top - rs.at(-1).top) > rs.at(-1).height / 2 ? rs.at(-1) : rs[0]);
  // Tous les caractères visibles, dans l'ordre, avec une espace virtuelle entre deux blocs.
  const chars = [];
  const unLigne = new Map();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let blocPrec = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    // Un passage exclu (code en ligne…) ou masqué sépare les mots qui l'entourent.
    // Texte hors écran pour les aides techniques (sr-only : boîte de 1 px), sans rendu visible.
    const boite = el.getBoundingClientRect();
    if (el.closest(EXCLUS) || !el.getClientRects().length || getComputedStyle(el).visibility === 'hidden'
      || boite.width <= 1 || boite.height <= 1) {
      if (chars.at(-1)) chars.push(null);
      continue;
    }
    const bloc = blocDe(el);
    if (bloc !== blocPrec) chars.push(null);
    blocPrec = bloc;
    range.selectNodeContents(n);
    const tops = new Set([...range.getClientRects()].filter((r) => r.width > 0.5).map((r) => Math.round(r.top)));
    unLigne.set(n, tops.size < 2);
    for (let i = 0; i < n.data.length; i++) chars.push({ n, i, c: n.data[i], bloc });
  }
  chars.push(null);
  // Ponctuation après laquelle un mot ou un nom peut passer à la ligne sans trait (pas après une apostrophe
  // ni un signe ouvrant) ; avant un signe ouvrant.
  // Entre lettres et chiffres : au moins 3 caractères de chaque côté dans la suite de lettres et de chiffres
  // (revue r2, M3-bis : « warhammer|40k », jamais « warhammer40|k »).
  const alnum = (m) => m && m.c !== '\u00AD' && /[\p{L}\p{N}]/u.test(m.c);
  const borneChiffres = (mot, j) => {
    let g = j;
    while (g > 0 && (alnum(mot[g - 1]) || mot[g - 1].c === '\u00AD')) g--;
    let d = j;
    while (d < mot.length && (alnum(mot[d]) || mot[d].c === '\u00AD')) d++;
    return mot.slice(g, j).filter(alnum).length >= 3 && mot.slice(j, d).filter(alnum).length >= 3;
  };
  const permise = (mot, j) => {
    const [a, b] = [mot[j - 1].c, mot[j].c];
    return (/[\p{P}\p{S}]/u.test(a) && !/['’«“‘([{<]/u.test(a)) || /[([{<_.~/]/.test(b)
      || (/\p{Ll}/u.test(a) && /\p{Lu}/u.test(b))
      || (((/\p{L}/u.test(a) && /\p{N}/u.test(b)) || (/\p{N}/u.test(a) && /\p{L}/u.test(b))) && borneChiffres(mot, j));
  };
  // Frontière de syllabe (revue r2, M3-bis), jugée sur les lettres de part et d'autre de la coupure : une
  // voyelle de chaque côté ; à droite, la syllabe s'ouvre sur une consonne suivie d'une voyelle, ou sur un
  // groupe qu'on ne sépare pas (consonne + l ou r, ch, ph, th, sh, gn) suivi d'une voyelle ; et ce groupe
  // n'est jamais coupé en son milieu. Ainsi « to|kens », « model|context », « context|protocol » sont des
  // frontières ; « tok|ens », « prot|ocol », « contextp|rotocol » n'en sont pas.
  const V = 'aeiouyàâäéèêëîïôöùûüÿæœ';
  const groupe = /^(?:[bcdfgkptv][lr]|[cpst]h|gn)/i;
  const syllabe = (gauche, droite) => {
    const g = gauche.toLowerCase();
    const d = droite.toLowerCase();
    if (![...g].some((x) => V.includes(x)) || ![...d].some((x) => V.includes(x))) return false;
    const ouvre = new RegExp(`^(?:[bcdfgkptv][lr]|[cpst]h|gn|[^${V}])[${V}]`, 'u');
    if (!ouvre.test(d)) return false;
    return !groupe.test(g.slice(-1) + d[0]);
  };
  const lettre = (x) => x && /[\p{L}\p{M}\u00AD]/u.test(x.c);
  const lettres = (ms) => ms.filter((m) => m.c !== '\u00AD').length;
  const lignesDuBloc = new Map();
  const ligneDans = (bloc, top) => {
    if (!lignesDuBloc.has(bloc)) {
      range.selectNodeContents(bloc);
      const tops = [...new Set([...range.getClientRects()].filter((r) => r.width > 0.5).map((r) => Math.round(r.top)))]
        .sort((a, b) => a - b);
      lignesDuBloc.set(bloc, tops.filter((t, k) => k === 0 || t - tops[k - 1] > 4));
    }
    const tops = lignesDuBloc.get(bloc);
    let best = 0;
    for (let k = 0; k < tops.length; k++) if (Math.abs(tops[k] - top) < Math.abs(tops[best] - top)) best = k;
    return best;
  };
  const ids = new Map();
  const out = [];
  let debut = null;
  for (let k = 0; k < chars.length; k++) {
    const x = chars[k];
    const blanc = !x || /\s/.test(x.c);
    if (!blanc) { if (debut === null) debut = k; continue; }
    if (debut === null) continue;
    const mot = chars.slice(debut, k);
    const debutMot = debut;
    debut = null;
    if (mot.length < 2 || (mot.every((m) => m.n === mot[0].n) && unLigne.get(mot[0].n))) continue;
    const tous = mot.map((m) => rectsDe(m.n, m.i));
    const rects = tous.map((r) => r.at(-1));
    const texte = mot.map((m) => m.c).join('');
    // Endroits où le mot passe à la ligne.
    const sauts = [];
    for (let j = 1; j < mot.length; j++) {
      if (rects[j] && rects[j - 1] && rects[j].top - rects[j - 1].top >= rects[j - 1].height / 2) sauts.push(j);
    }
    const bornes = [0, ...sauts, mot.length];
    for (let s = 0; s < sauts.length; s++) {
      const j = sauts[s];
      // Une coupure dans une suite de signes (« »…). ») ne coupe aucun mot.
      if (!mot.some(alnum)) continue;
      // Ponctuation seule sur sa ligne, même à une coupure permise : « , utiliser », « ) », « pas / »
      // (revue r2, m-a).
      const ponctuation = !mot.slice(bornes[s], j).some(alnum) || !mot.slice(j, bornes[s + 2]).some(alnum);
      if (!ponctuation && permise(mot, j)) continue;
      // Lettres de part et d'autre de la coupure, et largeur du mot (la suite de lettres coupée).
      let g = j;
      while (g > 0 && lettre(mot[g - 1])) g--;
      let d = j;
      while (d < mot.length && lettre(mot[d])) d++;
      // Largeur de ce qui ne peut pas passer à la ligne sans couper le mot : le mot et ce que des espaces
      // insécables lui soudent (« 23 novembre », « « influenceurs » »).
      let a = debutMot + j - 1;
      while (a > 0 && chars[a - 1] && !/[ \t\n\r\f]/.test(chars[a - 1].c)) a--;
      let b = debutMot + j;
      while (chars[b] && !/[ \t\n\r\f]/.test(chars[b].c)) b++;
      const largeurMot = chars.slice(a, b).reduce((s, x) => { const rs = rectsDe(x.n, x.i); return s + (rs.length ? glyphe(rs).width : 0); }, 0);
      const bloc = mot[j - 1].bloc;
      const cs = getComputedStyle(bloc);
      const largeurLigne = bloc.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const r = tous[j - 1][0];
      const taille = parseFloat(getComputedStyle(mot[j - 1].n.parentElement).fontSize);
      if (!ids.has(bloc)) ids.set(bloc, ids.size);
      const titre = mot[j - 1].n.parentElement.closest('h1, h2, h3');
      const sans = texte.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').replace(/\u00AD/g, '');
      out.push({
        ponctuation,
        syllabe: syllabe(mot.slice(g, j).map((m) => m.c).join('').replace(/\u00AD/g, ''),
          mot.slice(j, d).map((m) => m.c).join('').replace(/\u00AD/g, '')),
        // Un nom ou un identifiant (chemin, commande, camelCase, chiffres), et non un mot de la langue.
        nom: !/^[\p{L}\p{M}'’\-‐]+$/u.test(sans) || /\p{Ll}\p{Lu}/u.test(sans),
        titre: Boolean(titre),
        ilot: Boolean(mot[j - 1].n.parentElement.closest('astro-island')),
        vu: `${texte.slice(0, j)}|${texte.slice(j)}`.replace(/\u00AD/g, ''),
        el: `${titre ? titre.tagName.toLowerCase() : mot[j - 1].n.parentElement.tagName.toLowerCase()} « ${bloc.textContent.trim().replace(/\s+/g, ' ').slice(0, 50)}… »`,
        gauche: lettres(mot.slice(g, j)),
        droite: lettres(mot.slice(j, d)),
        largeurMot,
        largeurLigne,
        bloc: ids.get(bloc),
        ligne: ligneDans(bloc, r.top),
        // Zone qui suit la dernière lettre de la ligne, coordonnées du document.
        zone: {
          x: r.right + window.scrollX - 0.5,
          y: r.top + window.scrollY + r.height * 0.2,
          width: Math.max(4, taille * 0.7),
          height: Math.max(4, r.height * 0.65),
        },
      });
    }
  }
  return out;
}

const TRANSPARENT = `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important;
  text-shadow: none !important; text-decoration-color: transparent !important; caret-color: transparent !important; }`;

async function capturer(page, zones) {
  const out = [];
  for (const z of zones) {
    const scrollY = await page.evaluate((y) => {
      // Instantané : le site défile en douceur (scroll-behavior), la capture partirait en plein mouvement.
      window.scrollTo({ left: 0, top: Math.max(0, y - window.innerHeight / 2), behavior: 'instant' });
      return window.scrollY;
    }, z.y);
    const vw = await page.evaluate(() => document.documentElement.clientWidth);
    const x = Math.max(0, Math.min(z.x, vw - 1));
    const clip = { x, y: z.y - scrollY, width: Math.max(1, Math.min(z.width, vw - x)), height: z.height };
    out.push((await page.screenshot({ clip, animations: 'disabled', caret: 'hide' })).toString('base64'));
  }
  return out;
}

// Pixels d'encre : écart de plus de 60 sur un canal entre la capture avec texte et sans texte.
async function encre(page, avec, sans) {
  return page.evaluate(async ([a, b]) => {
    const lire = async (s) => {
      const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${s}`)).blob());
      const c = new OffscreenCanvas(img.width, img.height);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, img.width, img.height).data;
    };
    const out = [];
    for (let k = 0; k < a.length; k++) {
      const [p, q] = [await lire(a[k]), await lire(b[k])];
      let n = 0;
      for (let i = 0; i < Math.min(p.length, q.length); i += 4) {
        if (Math.max(Math.abs(p[i] - q[i]), Math.abs(p[i + 1] - q[i + 1]), Math.abs(p[i + 2] - q[i + 2])) > 60) n++;
      }
      out.push(n);
    }
    return out;
  }, [avec, sans]);
}

// Charge toutes les images (même paresseuses) : sinon, défiler pour capturer les zones les charge et décale
// la page sous la mesure.
export async function chargerImages(page) {
  await page.evaluate(async () => {
    const imgs = [...document.images];
    for (const i of imgs) i.loading = 'eager';
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = r; i.onerror = r; }))));
  });
}

// Renvoie les fautes (chaînes lisibles) de la page dans son état courant (images chargées). `exempter`
// (coupure → booléen) écarte des coupures du jugement ; elles sont ajoutées au tableau `exemptees`.
export async function verifierCoupures(page, { exempter = () => false, exemptees = [] } = {}) {
  const toutes = await page.evaluate(releverCoupures);
  const coupures = toutes.filter((c) => !exempter(c));
  exemptees.push(...toutes.filter((c) => exempter(c)).map((c) => `« ${c.vu} » (${c.el})`));
  if (!coupures.length) return [];
  const scroll = await page.evaluate(() => [window.scrollX, window.scrollY]);
  const avec = await capturer(page, coupures.map((c) => c.zone));
  const style = await page.addStyleTag({ content: TRANSPARENT });
  const sans = await capturer(page, coupures.map((c) => c.zone));
  await style.evaluate((s) => s.remove());
  await page.evaluate(([x, y]) => window.scrollTo({ left: x, top: y, behavior: 'instant' }), scroll);
  // Une page qui bouge pendant la mesure (image paresseuse chargée en défilant) fausserait les zones.
  const apres = (await page.evaluate(releverCoupures)).filter((c) => !exempter(c));
  if (JSON.stringify(apres.map((c) => c.zone)) !== JSON.stringify(coupures.map((c) => c.zone))) {
    throw new Error('la mise en page a changé pendant la mesure des coupures (charger les images avant : chargerImages)');
  }
  const pixels = await encre(page, avec, sans);
  const fautes = [];
  const traits = new Map();
  const blocs = new Map();
  coupures.forEach((c, k) => {
    const ou = `« ${c.vu} » (${c.el})`;
    if (c.ponctuation) { fautes.push(`ponctuation seule sur sa ligne ${ou}`); return; }
    if (pixels[k] < 3) { fautes.push(`sans trait ${ou}`); return; }
    if (c.gauche < 3 || c.droite < 3) fautes.push(`moins de 3 lettres ${ou}`);
    if (!c.syllabe) fautes.push(`césure hors syllabe ${ou}`);
    if (c.largeurMot < c.largeurLigne - 1) fautes.push(`césure d'un mot qui tient (${Math.round(c.largeurMot)} < ${Math.round(c.largeurLigne)} px) ${ou}`);
    if (!traits.has(c.bloc)) traits.set(c.bloc, new Set());
    blocs.set(c.bloc, c.el);
    traits.get(c.bloc).add(c.ligne);
  });
  for (const [bloc, lignes] of traits) {
    for (const l of lignes) {
      if (lignes.has(l + 1) && lignes.has(l + 2)) fautes.push(`3 lignes à trait de suite (lignes ${l + 1} à ${l + 3}, ${blocs.get(bloc)})`);
    }
  }
  return fautes;
}
