# Montée Astro 6.4 → 7.4 et mermaid 11.17 → 12.3 (L70, 17 novembre 2026)

## Pourquoi

`npm audit` signalait une faille **critique** sur `astro <= 7.4.6` (XSS, RCE par l'optimisation
AVIF, contournement d'autorisation…), une **haute** sur `sharp <= 0.35.5-rc.1` (libvips, libheif,
librsvg), une **modérée** sur `esbuild` et des **basses** sur `katex`/`mermaid`. Seule voie : Astro 7.

| | avant | après |
|---|---|---|
| astro | 6.4.8 | 7.4.12 |
| @astrojs/vue | 6.0.1 | 7.1.6 |
| vite | 7.3.8 (forcé par `overrides`) | 8.3.8 (celui d’Astro, override retiré) |
| sharp | 0.34.5 | 0.35.5 |
| esbuild | 0.27.7 | 0.28.2 |
| mermaid / katex | 11.17.2 / 0.16.47 | 12.3.0 / 0.18.10 |
| `npm audit` | 6 failles : 1 critique, 1 haute, 1 modérée, 3 basses | **0** |

## Changements cassants rencontrés et leur correction

1. **Node ≥ 22.23.4 exigé** (`engines` d'Astro 7.4.7 et suivants). La machine avait 22.22.3.
   Correction : Node 22.23.5 installé par nvm (l'alias `22` y pointe), `.nvmrc` fixé à `22.23.5`
   (lu par Cloudflare Pages et par le workflow `batch-update`), `engines` du `package.json` à `>=22.23.4`.
2. **`compressHTML` passe de `true` à `'jsx'`** (guide de migration Astro 7) : les espaces entre
   éléments inline disparaissent. Mesuré : **38 pages sur 40** perdaient des espaces
   (« avecClaude Code », « Dépôt décrit :maritime-atlas », « vibe coded withClaude Code »).
   Correction : `compressHTML: true` dans `astro.config.mjs`. Après correction, le texte lu des 40
   pages est identique à celui du build Astro 6, à deux exceptions voulues près (points 3 et 6).
3. **Le compilateur Rust ne décode plus les entités HTML dans un attribut passé à un composant.**
   `description="… &quot;Vent fort&quot; …"` s'affichait littéralement `&quot;Vent fort&quot;` sur
   l'étude maritime-atlas. Correction : la valeur passe en expression JS
   (``description={`… "Vent fort" …`}``). Seule occurrence du site (recherche dans `src/` et
   comparaison des `&amp;…;` de chaque page avant/après).
4. **Le minifieur CSS abrège les couleurs** (`#ffffff` → `#fff`, changement « cosmétique » annoncé).
   Le CSS est équivalent, mais le test R6 de `cadence-schemas.e2e` ne lisait que les couleurs à
   6 chiffres et calculait un contraste faux (1,13). Correction : le test relit les deux formes.
5. **Vite 8 (rolldown)** : aucune option Vite propre au site (`rollupOptions` absent), rien à changer.
   L'override `vite: ^7.3.8` du `package.json` est retiré. Le seul avertissement du build reste celui
   d'avant (chunk de plus de 500 kB : mermaid), avec un texte qui cite désormais `rolldownOptions`.
   Le build passe de ~21 s à ~2,2 s.
6. **mermaid 12 change trois défauts** (notes de version 12.0.0, et `flowchart.wrappingWidth` relevé
   dans le code de la bibliothèque) : mise en page **ELK** au lieu de dagre, aspect **neo** au lieu
   de classic, repli des libellés à **120 px** au lieu de 200. Mesuré sans correction : nœuds,
   tailles et formes de tous les schémas changés (ex. maritime : 772 × 4472 → 1080 × 1876 px).
   Correction dans `MermaidDiagram.vue` : `layout: "dagre"`, `look: "classic"`,
   `flowchart.wrappingWidth: 200`. Après : mêmes nœuds, mêmes libellés et mêmes hauteurs pour les
   17 schémas des 12 pages ; quelques largeurs gagnent de 0 à 6 % (ex. k8s 2241 → 2387 px).
7. **Schéma jobmail-assistant cassé (déjà avant la montée)** : un libellé de flèche contenant des
   parenthèses (`-->|messages.delete(deletePermanently=false)|`) faisait échouer l'analyse ; la
   page affichait « Mermaid render failed ». Correction : libellé entre guillemets. Aucun test ne
   le voyait : `tests/l70-astro7-mermaid12.e2e.test.mjs` dessine maintenant chaque schéma de
   chaque page et échoue sur le site d'avant, à cet endroit.

## Ce qui n'a rien demandé

`@astrojs/vue` 7.1 (aucun changement de code), `client:visible` ; non utilisés ici : `define:vars`/`is:inline`,
`astro:assets` (non utilisé), `src/fetch.ts` (absent), Markdown (aucun `.md` rendu par Astro).
