// L107 — trois outils testés le 27-11 ajoutés au catalogue Tools tested : verdict, raison et mesures,
// sans rien de privé (machines, chemins, numéros de lot ou de demande internes, compte pro), sans étude de cas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { testedTools } from '../src/data/tools-tested.ts';

const ATTENDU = {
  impeccable: {
    author: 'pbakaus',
    url: 'https://github.com/pbakaus/impeccable',
    license: 'Apache-2.0',
    verdict: /reject \+ watchlist/,
    mesures: [/v4\.11\.1/, /62 règles/, /117,7 k étoiles/, /chevauch/],
  },
  hallmark: {
    author: 'Nutlope',
    url: 'https://github.com/Nutlope/hallmark',
    license: 'MIT',
    verdict: /skillify/,
    mesures: [/v2\.0\.0/, /61,8 k étoiles/, /22 FAIL/, /inventaire avant\/après/],
  },
  'agent-browser': {
    author: 'vercel-labs',
    url: 'https://github.com/vercel-labs/agent-browser',
    license: 'Apache-2.0',
    verdict: /reject \+ watchlist/,
    mesures: [/v0\.45\.0/, /54,2 k étoiles/, /75 contre 62 Ko/, /30 %/, /Playwright/],
  },
};

const PRIVE = [
  /big-blue|mini-blue|dark-blue|mobi-blue/i,
  /\bL\d{2,}\b/,
  /\bD-\d+/,
  /compte pro/i,
  /\/home\/|~\/|\btmp\//,
  /sylvain/i,
  /sladoire/i,
  /interface-utilisable|qa-reviewer/,
];

for (const [id, a] of Object.entries(ATTENDU)) {
  test(`L107 — ${id} : fiche testée, verdict, source et mesures de la note`, () => {
    const t = testedTools.find((x) => x.id === id);
    assert.ok(t, `fiche ${id} absente`);
    assert.equal(t.status, 'tested');
    assert.equal(t.author, a.author);
    assert.equal(t.url, a.url);
    assert.equal(t.license, a.license);
    assert.equal(t.caseStudyHref, undefined, 'pas d’étude de cas');
    assert.match(t.description, /2026-11-27/);
    assert.match(t.description, a.verdict);
    for (const re of a.mesures) assert.match(t.description, re, `${id} : ${re}`);
  });

  test(`L107 — ${id} : rien de privé dans la fiche`, () => {
    const t = testedTools.find((x) => x.id === id);
    const tout = [t.name, t.description, ...t.tags].join(' ');
    for (const re of PRIVE) assert.doesNotMatch(tout, re, `${id} : ${re}`);
  });
}
