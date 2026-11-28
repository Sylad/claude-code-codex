# aetherwx-encyclopedia · assets

Images référencées par `/case-studies/aetherwx-encyclopedia.astro` :

- `big-blue-tower.jpg` (720 × 959, `src` par défaut), `big-blue-tower-480.jpg` (480 × 639) et
  `big-blue-tower-960.jpg` (960 × 1278) : photo de la tour Big-Blue du 31 octobre 2026 (section
  « 01 · Le truc qui tourne ça »), servie en `srcset`. Tirées de l'original fourni par Sylvain
  (3064 × 4080, Display P3) : converties en sRGB, JPEG qualité 80 progressif, **sans aucune
  métadonnée** (ni EXIF, ni GPS, ni profil ICC). Chacune ≤ 300 Ko ; le test
  `tests/l64-photo-big-blue.test.mjs` vérifie poids, dimensions et absence d'EXIF.

Le test `tests/l60-livre-suite.e2e.test.mjs` (R5) échoue si une `<img>` de `dist` pointe un
fichier absent.

Pour d'autres captures (ArgoCD UI, k9s, GH Actions) : préfixer en `NN-description.jpg`,
retirer les métadonnées, poser `width`/`height`, chargement différé et `figcaption`.
