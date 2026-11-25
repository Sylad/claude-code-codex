// L82 — page /videos en français courant (Nielsen 2, correspondance avec le monde réel ; relevé par la
// revue L10). Mesuré sur le site CONSTRUIT (`npx astro build` avant) : le texte visible du <main>, hors
// titres de vidéos en anglais (lang="en", gardés tels quels), ne contient plus aucun des anglicismes
// relevés, et reste impersonnel, ni « tu » ni « vous » (le site tutoie depuis L18 ; cette page garde
// le style impersonnel choisi par L82, compatible avec ce choix).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';

function texteVisible() {
  const h = readFileSync(join(DIST, 'videos', 'index.html'), 'utf8');
  const main = h.slice(h.indexOf('<main'), h.lastIndexOf('</main>'));
  return main
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/g, ' ')
    .replace(/<h2[^>]*lang="en"[^>]*>[\s\S]*?<\/h2>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ');
}

// Anglicismes relevés par la revue L10 et dans la relecture de L82 (un mot français existe pour chacun).
const ANGLICISMES = [
  /\bcurés?\b/i, /\bcuration\b/i, /\bdemos?\b/i, /\blaunch\b/i, /\bwalkthroughs?\b/i, /\bfeatures?\b/i,
  /\bship(p[ée]e?s?|s)?\b/i, /\bfireside\b/i, /\bpatterns?\b/i, /\bworkflows?\b/i, /\btalks?\b/i,
  /\bphilo\b/i, /\bterminal-first\b/i, /\butility\b/i, /\bagentic\b/i, /\blong-form\b/i,
  /\bdogfooding\b/i, /\bdeep\b/i, /\bbuilds?\b/i, /\borigin story\b/i, /\bshift\b/i, /\bsandboxing\b/i,
  /\blocal-first\b/i, /\btooling\b/i, /\btutos?\b/i, /\btutorial\b/i, /\bAI-influencers?\b/i,
  /\bHead of (Product|Cowork)\b/i, /\brepo\b/i, /\bissue\b/i, /\btag\b/i, /\bLLMs?\b/, /\bsub-agents\b/i,
  /\bMCP servers\b/i, /\bslash commands\b/i, /\bconference\b/i, /\binterview\b/i, /\bproduct\b/i,
  /\bhistory\b/i, /\b(ai|ia)[- ]dev\b/i, /\ben FR\b/, /\bPlaylist\b/, /\bcoding\b/i,
];

test('L82 — aucun anglicisme relevé dans le texte visible de /videos', () => {
  const t = texteVisible();
  assert.ok(t.includes('Chaîne'), 'texte du catalogue introuvable (build à jour ?)');
  const trouves = ANGLICISMES.map((re) => t.match(re)?.[0]).filter(Boolean);
  assert.deepEqual(trouves, [], `anglicismes encore présents : ${trouves.join(', ')}`);
});

test('L82 — style impersonnel : ni tutoiement ni vouvoiement', () => {
  const t = texteVisible();
  const adresse = t.match(/\b(tu|te|toi|ton|ta|tes|vous|votre|vos)\b/gi) ?? [];
  assert.deepEqual(adresse, [], `adresse directe au lecteur : ${adresse.join(', ')}`);
});

test('L82 — les titres de vidéos et les noms propres restent tels quels', () => {
  const h = readFileSync(join(DIST, 'videos', 'index.html'), 'utf8').replace(/\u00a0|&nbsp;|&#160;/g, ' ');
  for (const titre of [
    'A conversation on Claude Code — Boris Cherny &amp; Alex Albert',
    'Head of Claude Code — Boris Cherny',
    'Anthropic&#39;s Surprise Hit: How Claude Code Became an AI Coding Powerhouse',
    'Code w/ Claude', 'AI Engineer World&#39;s Fair', 'Latent Space', 'IndyDevDan',
  ]) assert.ok(h.includes(titre), `« ${titre} » a disparu`);
});
