// Analyse statique (L94, D-31) : jouée par `cadence analyse` (clé analyse: de cadence.yaml) à chaque lot.
// L'existant est figé dans la base de cadence (.cadence/analyse/eslint.json) ; seules les violations nouvelles
// font échouer la porte. Ce fichier est dans `configs:` : le changer est un lot `config: true` du plan.
// Seuils de cadence : max-lines 400, max-lines-per-function 80, max-depth 4, max-params 5,
// complexity 15, cognitive-complexity 15.
// Les fichiers .astro ne sont PAS lus par ESLint (aucun analyseur .astro installé) : seuls .ts, .mjs, .js et .vue.
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import sonarjs from 'eslint-plugin-sonarjs';

const seuils = {
  'max-lines': ['error', { max: 400, skipBlankLines: true, skipComments: true }],
  'max-lines-per-function': ['error', { max: 80, skipBlankLines: true, skipComments: true }],
  'max-depth': ['error', 4],
  'max-params': ['error', 5],
  complexity: ['error', 15],
  'sonarjs/cognitive-complexity': ['error', 15],
};

export default tseslint.config(
  { ignores: ['dist/**', '.astro/**', 'node_modules/**', 'public/**'] },
  ...tseslint.configs.recommended,
  ...vue.configs['flat/essential'],
  sonarjs.configs.recommended,
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  { files: ['**/*.{ts,mjs,js,vue}'], rules: seuils },
);
