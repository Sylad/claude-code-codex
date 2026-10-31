// L55 — corrections de vérité : topologie et apps déployées (docs/verite-site.md, « Corrections à faire, par page »).
// Lit dist : `npx astro build` avant.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DIST } from './lib/e2e-dist.mjs';
import { APP_COUNT } from '../src/data/apps.ts';

const brut = (p) => readFileSync(join(DIST, p, 'index.html'), 'utf8');
const texte = (p) => brut(p).replace(/<[^>]+>/g, ' ').replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');
const accueil = () => readFileSync(join(DIST, 'index.html'), 'utf8').replace(/<[^>]+>/g, ' ').replace(/&nbsp;| | /g, ' ').replace(/\s+/g, ' ');

test('R1 — accueil : Kubernetes + GitOps ne vaut que pour 4 apps sur le total', () => {
  const t = accueil();
  assert.doesNotMatch(t, /déployées sur Kubernetes \+ GitOps/);
  assert.match(t, new RegExp(`${APP_COUNT} applications construites avec Claude Code, dont 4 sur Kubernetes \\(k3s\\) \\+ GitOps`));
});

test('R2 — about : fin 2025, cinq apps datées de mai 2026, Kubernetes limité à 4 apps', () => {
  const t = texte('about');
  assert.match(t, /depuis fin 2025/);
  assert.doesNotMatch(t, /depuis fin 2026/);
  assert.match(t, /cinq apps perso en prod \(mai 2026\)/);
  assert.doesNotMatch(t, /déployées sur Kubernetes \+ GitOps/);
  assert.match(t, /dont 4 déployées sur Kubernetes \(k3s\) \+ GitOps/);
});

test('R3 — argocd-k8s-pour-les-nuls : v1.4.2 présenté comme un exemple, images réelles sha-<shortsha>', () => {
  const h = brut('argocd-k8s-pour-les-nuls');
  assert.match(h, /v1\.4\.2<\/code> est un exemple/);
  assert.match(h, /sha-&lt;shortsha&gt;/);
});

test('R4 — atelier-ia : le schéma ne fait plus héberger d\'app au NAS (médias et sauvegardes)', () => {
  const h = brut('atelier-ia').replace(/&#34;|&quot;/g, '"');
  assert.doesNotMatch(h, /Cloudflare \/ NAS \/ K8s/);
  assert.match(h, /NAS : médias et sauvegardes/);
});

test('R5 — aetherwx-encyclopedia : Mini-Blue est un PC d\'outillage sans app, pods datés', () => {
  const t = texte('case-studies/aetherwx-encyclopedia');
  assert.doesNotMatch(t, /mini-PC always-on|un mini-PC\s+always-on/);
  assert.match(t, /PC Windows d'outillage, sans app depuis le 14 octobre 2026/);
  assert.match(t, /une vingtaine de pods \(relevé de mai 2026/);
});

test('R6 — claude-code-codex : fichiers mémoire et nombre d\'apps datés', () => {
  const t = texte('case-studies/claude-code-codex');
  assert.match(t, /~70 fichiers \.md au 8 mai 2026/);
  assert.match(t, new RegExp(`aujourd'hui ${APP_COUNT} apps`));
  assert.match(t, /6 sites perso au lancement \(mai 2026\)/);
});

test('R7 — k8s-migration-overnight : l\'« Après » est daté de mai 2026, prod sur dark-blue depuis le 03/09/2026', () => {
  const t = texte('case-studies/k8s-migration-overnight');
  assert.match(t, /Après — k3s \+ GitOps \(état au 14 mai 2026\)/);
  assert.match(t, /Avant — Docker Swarm sur NAS \(état au 13 mai 2026\)/);
  assert.match(t, /dark-blue/);
});
