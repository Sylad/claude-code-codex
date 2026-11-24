// L88, revue de code r4 (mineur) — un sigle sans voyelle se détache du mot qui le suit sans lui prendre son
// « s » d'attaque : « JDBC|Store », « jdbc|store », « wms|store », jamais « JDBCS|tore », « jdbcs|tore »,
// « wmss|tore ». Règles du script (src/lib/cesure.mjs) ; l'oracle du rendu (tests/lib/coupures.mjs) est
// vérifié sur les mêmes cas dans tests/l88-cesure.e2e.test.mjs (« l'oracle voit… »).
import test from 'node:test';
import assert from 'node:assert/strict';
import { bornesDeNom, frontiereDeSyllabe } from '../src/lib/cesure.mjs';

const coupe = (mot) => mot.indexOf('|');
const sans = (mot) => mot.replace('|', '');

test('un sigle se détache du mot qui suit, son « s » d\'attaque compris', () => {
  for (const m of ['jdbc|store', 'JDBC|Store', 'wms|store', 'jdbc|config', 'wms|layer', 'html|stream']) {
    assert.equal(frontiereDeSyllabe(sans(m), coupe(m)), true, m);
  }
  for (const m of ['jdbcs|tore', 'JDBCS|tore', 'wmss|tore', 'jd|bcconfig', 'htmls|tream']) {
    assert.equal(frontiereDeSyllabe(sans(m), coupe(m)), false, m);
  }
});

test('les frontières de syllabe déjà tenues ne bougent pas', () => {
  for (const m of ['to|kens', 'model|context', 'context|protocol', 'post|gresql', 'proto|col']) {
    assert.equal(frontiereDeSyllabe(sans(m), coupe(m)), true, m);
  }
  for (const m of ['tok|ens', 'prot|ocol', 'contextp|rotocol']) {
    assert.equal(frontiereDeSyllabe(sans(m), coupe(m)), false, m);
  }
});

test('un nom se coupe entre un sigle en capitales et le mot capitalisé qui le suit', () => {
  assert.deepEqual(bornesDeNom('JDBCStore'), [4]);
  assert.deepEqual(bornesDeNom('MCPServers'), [3]);
  assert.deepEqual(bornesDeNom('httpClient'), [4]);
  // Un pluriel de sigle n'ouvre pas de mot : jamais « UR|Ls ».
  assert.deepEqual(bornesDeNom('URLs'), []);
  assert.deepEqual(bornesDeNom('JDBC'), []);
});
