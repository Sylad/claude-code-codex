// L117 — la légende d'une image dit « Photo du … » pour une photo et « Capture du … » pour une capture
// d'écran, d'après la nature DÉCLARÉE de l'image (champ `nature`), jamais d'après le nom du fichier ;
// dans les deux langues. Les tests sur dist demandent `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { legendeCapture, messageCapture, NATURES } from '../src/lib/etude-fraicheur.mjs';
import { DIST } from './lib/e2e-dist.mjs';

const nb = (s) => s.replace(/[\u00a0\u202f]/g, ' ');
const D = 'Une description.';

test('L117 — formateur : « Photo du » pour une photo, « Capture du » pour une capture, en français', () => {
  assert.deepEqual(NATURES, ['capture', 'photo']);
  assert.equal(nb(legendeCapture({ date: '2026-10-31', nature: 'photo', description: D })), `Photo du 31 octobre 2026 — ${D}`);
  assert.equal(nb(legendeCapture({ date: '2026-10-31', nature: 'capture', description: D })), `Capture du 31 octobre 2026 — ${D}`);
  assert.equal(nb(legendeCapture({ date: '2026-05-11', nature: 'capture', carte2d: true, description: D, langue: 'fr' })),
    `Capture du 11 mai 2026 (carte 2D, avant le globe) — ${D}`);
  assert.equal(nb(legendeCapture({ date: '2026-10-01', nature: 'photo', description: D })), `Photo du 1er octobre 2026 — ${D}`);
});

test('L117 — formateur : « Photo from » et « Screenshot from » en anglais', () => {
  assert.equal(legendeCapture({ date: '2026-10-31', nature: 'photo', description: D, langue: 'en' }), `Photo from October 31, 2026 — ${D}`);
  assert.equal(legendeCapture({ date: '2026-10-31', nature: 'capture', description: D, langue: 'en' }), `Screenshot from October 31, 2026 — ${D}`);
  assert.equal(legendeCapture({ date: '2026-05-11', nature: 'capture', carte2d: true, description: D, langue: 'en' }),
    `Screenshot from May 11, 2026 (2D map, before the globe) — ${D}`);
});

test('L117 — formateur : nature absente ou inconnue, langue inconnue, photo « carte 2D », date invalide en anglais : refusés', () => {
  assert.throws(() => legendeCapture({ date: '2026-10-31', description: D }), /nature/);
  assert.throws(() => legendeCapture({ date: '2026-10-31', nature: 'image', description: D }), /nature/);
  assert.throws(() => legendeCapture({ date: '2026-10-31', nature: 'photo', description: D, langue: 'de' }), /langue/);
  assert.throws(() => legendeCapture({ date: '2026-10-31', nature: 'photo', carte2d: true, description: D }), /photo/);
  assert.throws(() => legendeCapture({ date: '2026-02-30', nature: 'photo', description: D, langue: 'en' }), /date/);
});

test('L117 — messages de chargement : le mot suit la nature', () => {
  assert.match(messageCapture('Big-Blue', 'photo').chargement, /^Photo « Big-Blue » en cours de chargement/);
  assert.match(messageCapture('Big-Blue').erreur, /^Capture « Big-Blue » indisponible/);
  assert.throws(() => messageCapture('x', 'image'), /nature/);
});

test('L117 — chaque appel du formateur et chaque <Capture> des sources déclare sa nature', () => {
  const SRC = fileURLToPath(new URL('../src/', import.meta.url));
  const fichiers = readdirSync(SRC, { recursive: true }).filter((f) => /\.(astro|ts|mjs|vue)$/.test(f)).map((f) => join(SRC, f));
  let appels = 0;
  for (const f of fichiers) {
    const s = readFileSync(f, 'utf8');
    for (const m of s.matchAll(/legendeCapture\(\{([^}]*)\}\)/g)) {
      if (f.endsWith('etude-fraicheur.mjs')) continue;
      appels++;
      assert.match(m[1], /nature/, `${f} : appel sans nature`);
    }
    for (const m of s.matchAll(/<Capture\s[^>]*?\/>/g)) {
      appels++;
      assert.match(m[0], /\bnature="(capture|photo)"/, `${f} : <Capture> sans nature`);
    }
  }
  assert.ok(appels >= 10, `${appels} appels trouvés`);
});

// balises retirées sans expression régulière (sonarjs/super-linear-regex) : chaque « <…> » devient une espace
const sansBalises = (h) => h.split('<').map((p, i) => (i === 0 ? p : p.slice(p.indexOf('>') + 1))).join(' ');
const texte = (h) => sansBalises(h).replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&nbsp;|[\u00a0\u202f]/g, ' ').replace(/\s+/g, ' ').trim();

// Étude AetherWX : sur /en/ la page n'est pas traduite (TRADUITES), son texte reste français sous lang="fr",
// la légende aussi (langueDuContenu) — elle dit donc « Photo du » dans les deux versions, jamais « Capture du ».
for (const [langue, prefixe] of [['fr', ''], ['en', '/en']]) {
  test(`L117 — étude AetherWX rendue (${langue}) : la photo de Big-Blue est légendée « Photo du », les captures « Capture du »`, (t) => {
    const page = join(DIST, prefixe, 'case-studies/aetherwx-encyclopedia/index.html');
    if (!existsSync(page)) return t.skip('dist absent : lancer astro build');
    const h = readFileSync(page, 'utf8');
    const fig = h.match(/<figure[^>]*data-photo="big-blue"[\s\S]*?<\/figure>/)?.[0];
    assert.ok(fig, 'figure de la photo absente');
    const leg = texte(fig.match(/<figcaption[^>]*data-testid="legende-capture"[^>]*>([\s\S]*?)<\/figcaption>/)[1]);
    assert.match(leg, /^Photo du 31 octobre 2026 — Big-Blue, RTX SUPRIM/);
    if (langue === 'en') {
      // la légende est dans le bloc français de la page non traduite
      const iFr = h.lastIndexOf('lang="fr"', h.indexOf('data-photo="big-blue"'));
      assert.ok(iFr > 0, 'légende hors du bloc lang="fr"');
    }
    const ma = readFileSync(join(DIST, prefixe, 'case-studies/maritime-atlas/index.html'), 'utf8');
    const legs = [...ma.matchAll(/data-testid="legende-capture"[^>]*>([\s\S]*?)<\/figcaption>/g)].map((m) => texte(m[1]));
    assert.equal(legs.length, 9);
    for (const l of legs) assert.match(l, /^Capture du /, l.slice(0, 60));
  });
}
