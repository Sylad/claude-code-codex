// @ts-check
import { defineConfig } from 'astro/config';

import vue from '@astrojs/vue';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://claude-code-codex-25m.pages.dev',
  // Astro 7 passe compressHTML à 'jsx' par défaut : les espaces entre éléments inline
  // disparaissent (« avecClaude Code » sur 38 pages sur 40, mesuré au passage à Astro 7).
  compressHTML: true,
  integrations: [vue()],
  vite: {
    plugins: [tailwindcss()],
  },
});
