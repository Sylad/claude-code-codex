// @ts-check
import { defineConfig } from 'astro/config';

import { renameSync, rmdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';

// L112 — la 404 anglaise (src/pages/en/404.astro) sort en dist/en/404/index.html : Cloudflare Pages sert le
// 404.html le plus proche de l'adresse demandée (dist/en/404.html pour une adresse inconnue sous /en/).
const page404Anglaise = {
  name: 'page-404-anglaise',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const racine = fileURLToPath(dir);
      const source = `${racine}en/404/index.html`;
      if (!existsSync(source)) return;
      renameSync(source, `${racine}en/404.html`);
      rmdirSync(`${racine}en/404`);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://claude-code-codex-25m.pages.dev',
  // Astro 7 passe compressHTML à 'jsx' par défaut : les espaces entre éléments inline
  // disparaissent (« avecClaude Code » sur 38 pages sur 40, mesuré au passage à Astro 7).
  compressHTML: true,
  // L108 (D-5) — deux langues : le français par défaut, aux URL de toujours (sans préfixe), l'anglais sous
  // /en/. Une page n'a sa version anglaise que si elle existe sous src/pages/en/ (liste dans src/lib/langues.mjs).
  i18n: {
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [vue(), page404Anglaise],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // L88 — le script de la mise en page (césure, src/lib/cesure.mjs) est servi en fichier, partagé et mis
      // en cache, plutôt que recopié dans chaque page ; le reste suit la règle par défaut (4 Kio).
      assetsInlineLimit: (fichier) => (/BaseLayout\.astro_astro_type_script/.test(fichier) ? false : undefined),
    },
  },
});
