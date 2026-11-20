// L76 — sur le site CONSTRUIT : aucun lien (href, src, action…) d'aucune page ne commence par
// javascript:, data: ou vbscript:, et les liens du fil d'actualités (/learning/) sont tous http(s).
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

function htmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const decode = (s) => s
  .replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);?/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&colon;/gi, ':').replace(/&tab;/gi, '\t').replace(/&newline;/gi, '\n').replace(/&amp;/g, '&');
// Ce que le navigateur lit comme protocole : sans espaces, tabulations ni retours, en minuscules.
const scheme = (v) => decode(v).replace(/[\u0000- ]/g, '').toLowerCase();

test('aucun lien du site construit ne commence par javascript:, data: ou vbscript:', (t) => {
  if (!existsSync(join(DIST, 'index.html'))) { t.skip('dist absent : lancer astro build'); return; }
  const bad = [];
  for (const file of htmlFiles(DIST)) {
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/\s(href|xlink:href|action|formaction)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      const v = m[2] ?? m[3] ?? m[4] ?? '';
      if (/^(javascript|data|vbscript):/.test(scheme(v))) bad.push(`${file.slice(DIST.length)} : ${m[1]}=${v.slice(0, 60)}`);
    }
  }
  assert.deepEqual(bad, []);
});

test('/learning/ : chaque lien du fil d\'actualités est une URL http(s)', (t) => {
  const file = join(DIST, 'learning', 'index.html');
  if (!existsSync(file)) { t.skip('dist absent : lancer astro build'); return; }
  const html = readFileSync(file, 'utf8');
  const start = html.indexOf('Dernières news');
  assert.ok(start > 0, 'section du fil introuvable');
  const section = html.slice(start, html.indexOf('</section>', start));
  const links = [...section.matchAll(/href="([^"]*)"/g)].map((m) => decode(m[1]));
  assert.ok(links.length > 0, 'aucun lien dans le fil');
  for (const href of links) assert.match(href, /^https?:\/\//, href);
});
