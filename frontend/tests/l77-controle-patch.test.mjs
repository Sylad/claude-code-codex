// L77 — contrôle du patch que le job « commit » du batch hebdomadaire applique
// (.github/scripts/controle-patch.sh). Le batch n'écrit que frontend/src/data/feeds/*.json :
// tout autre chemin, lien symbolique, changement de mode, binaire, renommage ou suppression
// fait refuser le patch ENTIER (code 1, motif journalisé). Chaque cas fabrique un vrai patch
// avec git (comme l'étape « Export changes ») dans un dépôt jetable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync, chmodSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../../.github/scripts/controle-patch.sh', import.meta.url));
const FEEDS = 'frontend/src/data/feeds';

const ENV = {
  ...process.env,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t',
};

function git(dir, ...args) {
  const r = spawnSync('git', args, { cwd: dir, env: ENV, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} : ${r.stderr}`);
  return r.stdout;
}

function ecrire(dir, chemin, contenu) {
  mkdirSync(join(dir, chemin, '..'), { recursive: true });
  writeFileSync(join(dir, chemin), contenu);
}

/** Dépôt jetable dans l'état de main, puis `modifier(dir)`, puis export comme dans la CI. */
function fabriquer(modifier, { renommages = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'l77-patch-'));
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'config', 'core.symlinks', 'true');
  ecrire(dir, `${FEEDS}/anthropic-news.json`, '[\n  {"id": "a"}\n]\n');
  ecrire(dir, 'frontend/src/data/apps.ts', 'export const apps = [];\n');
  ecrire(dir, 'README.md', '# site\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'base');
  modifier(dir);
  git(dir, 'add', '--all');
  const patch = git(dir, 'diff', '--cached', '--binary', renommages ? '-M' : '--no-renames');
  const fichier = join(dir, '..', `${dir.split('/').pop()}.patch`);
  writeFileSync(fichier, patch);
  // Le job commit part d'un checkout propre : on revient à l'état de base.
  git(dir, 'reset', '-q', '--hard');
  git(dir, 'clean', '-qfdx');
  return { dir, fichier, nettoyer: () => { rmSync(dir, { recursive: true, force: true }); rmSync(fichier, { force: true }); } };
}

function controler(dir, fichier) {
  return spawnSync('bash', [SCRIPT, fichier], { cwd: dir, env: ENV, encoding: 'utf8' });
}

function refuse(nom, modifier, motif, options) {
  test(`refusé : ${nom}`, () => {
    const { dir, fichier, nettoyer } = fabriquer(modifier, options);
    try {
      assert.ok(readFileSync(fichier, 'utf8').length > 0, 'le patch piégé ne doit pas être vide');
      const r = controler(dir, fichier);
      assert.equal(r.status, 1, `code attendu 1, reçu ${r.status}\n${r.stdout}\n${r.stderr}`);
      assert.match(r.stderr, motif, `motif journalisé attendu ${motif}\n${r.stderr}`);
      assert.match(r.stdout, /::error title=Patch du batch refusé::/);
      assert.match(r.stderr, /patch NON appliqué/);
    } finally {
      nettoyer();
    }
  });
}

test('admis : modification et création de flux JSON, puis git apply les applique', () => {
  const { dir, fichier, nettoyer } = fabriquer((d) => {
    ecrire(d, `${FEEDS}/anthropic-news.json`, '[\n  {"id": "b"},\n  {"id": "a"}\n]\n');
    ecrire(d, `${FEEDS}/nouvelle-source.json`, '[]\n');
  });
  try {
    const r = controler(dir, fichier);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /2 fichier\(s\).*admis/);
    assert.equal(r.stderr, '');
    git(dir, 'apply', fichier);
    assert.ok(existsSync(join(dir, FEEDS, 'nouvelle-source.json')));
    assert.match(readFileSync(join(dir, FEEDS, 'anthropic-news.json'), 'utf8'), /"b"/);
  } finally {
    nettoyer();
  }
});

refuse('module TypeScript du site sous data/', (d) => {
  ecrire(d, 'frontend/src/data/apps.ts', 'export const apps = ["piège"];\n');
}, /chemin hors de .*frontend\/src\/data\/apps\.ts/);

refuse('workflow et README hors de data/', (d) => {
  ecrire(d, '.github/workflows/x.yml', 'on: push\n');
  ecrire(d, 'README.md', '# piégé\n');
}, /chemin hors de .*\.github\/workflows\/x\.yml/);

refuse('flux légitime mêlé à un chemin interdit (le patch entier est refusé)', (d) => {
  ecrire(d, `${FEEDS}/anthropic-news.json`, '[]\n');
  ecrire(d, 'frontend/src/data/apps.ts', 'export const apps = ["piège"];\n');
}, /chemin hors de .*apps\.ts/);

refuse('sous-dossier de feeds/', (d) => {
  ecrire(d, `${FEEDS}/sous/x.json`, '[]\n');
}, /chemin hors de .*feeds\/sous\/x\.json/);

refuse('fichier non JSON dans feeds/', (d) => {
  ecrire(d, `${FEEDS}/x.mjs`, 'export default 1;\n');
}, /chemin hors de .*feeds\/x\.mjs/);

refuse('création d\'un lien symbolique', (d) => {
  mkdirSync(join(d, FEEDS), { recursive: true });
  symlinkSync('../../../../.github', join(d, FEEDS, 'evil.json'));
}, /(mode non admis|opération non admise).*120000/);

refuse('changement de mode (exécutable)', (d) => {
  chmodSync(join(d, FEEDS, 'anthropic-news.json'), 0o755);
}, /(mode non admis|opération non admise).*100755/);

refuse('création d\'un fichier exécutable', (d) => {
  ecrire(d, `${FEEDS}/x.json`, '[]\n');
  chmodSync(join(d, FEEDS, 'x.json'), 0o755);
}, /(mode non admis|opération non admise).*100755/);

refuse('fichier binaire', (d) => {
  ecrire(d, `${FEEDS}/x.json`, Buffer.from([0, 1, 2, 255, 0, 7]));
}, /fichier binaire : frontend\/src\/data\/feeds\/x\.json/);

refuse('renommage', (d) => {
  git(d, 'mv', `${FEEDS}/anthropic-news.json`, `${FEEDS}/autre.json`);
}, /opération non admise : rename .*anthropic-news\.json => autre\.json/, { renommages: true });

refuse('renommage vers un module du site', (d) => {
  git(d, 'mv', `${FEEDS}/anthropic-news.json`, 'frontend/src/data/news.ts');
}, /opération non admise : rename/, { renommages: true });

refuse('renommage d\'un module du site vers feeds/ (chemin d\'arrivée autorisé)', (d) => {
  git(d, 'mv', 'frontend/src/data/apps.ts', `${FEEDS}/apps.json`);
}, /opération non admise : rename .*apps\.ts => .*apps\.json/, { renommages: true });

refuse('suppression d\'un flux', (d) => {
  rmSync(join(d, FEEDS, 'anthropic-news.json'));
}, /(opération non admise : delete|mode non admis : deleted file)/);

test('refusé : chemin qui remonte par « .. » (patch écrit à la main)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'l77-patch-'));
  const fichier = join(dir, 'p.patch');
  try {
    git(dir, 'init', '-q');
    writeFileSync(fichier, [
      `diff --git a/${FEEDS}/../apps.ts b/${FEEDS}/../apps.ts`,
      'new file mode 100644',
      'index 0000000..1111111',
      '--- /dev/null',
      `+++ b/${FEEDS}/../apps.ts`,
      '@@ -0,0 +1 @@',
      '+export const x = 1;',
      '',
    ].join('\n'));
    const r = controler(dir, fichier);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /refusé : /);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('refusé : lien symbolique existant modifié (ligne index en 120000)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'l77-patch-'));
  const fichier = join(dir, 'p.patch');
  try {
    git(dir, 'init', '-q');
    writeFileSync(fichier, [
      `diff --git a/${FEEDS}/lien.json b/${FEEDS}/lien.json`,
      'index 1111111..2222222 120000',
      `--- a/${FEEDS}/lien.json`,
      `+++ b/${FEEDS}/lien.json`,
      '@@ -1 +1 @@',
      '-ancien',
      '\\ No newline at end of file',
      '+../../../../.github',
      '\\ No newline at end of file',
      '',
    ].join('\n'));
    const r = controler(dir, fichier);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /mode non admis : index 1111111\.\.2222222 120000/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('refusé : patch non vide sans aucun fichier reconnu', () => {
  const dir = mkdtempSync(join(tmpdir(), 'l77-patch-'));
  const fichier = join(dir, 'p.patch');
  try {
    git(dir, 'init', '-q');
    writeFileSync(fichier, 'ceci n\'est pas un patch\n');
    const r = controler(dir, fichier);
    assert.equal(r.status, 1, r.stdout + r.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
