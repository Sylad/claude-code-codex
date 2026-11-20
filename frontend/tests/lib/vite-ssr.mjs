// Charge un module source (.astro, .ts) par Vite, avec la configuration d'Astro du site,
// sans construire le site. Les plugins passés en plus permettent de remplacer un import
// (fixture de test) sans toucher aux fichiers versionnés.
import { createServer } from 'vite';
import { getViteConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export const FRONTEND = fileURLToPath(new URL('../../', import.meta.url));

export async function withViteSsr(plugins, fn) {
  const config = await getViteConfig(
    { server: { middlewareMode: true, hmr: false, ws: false }, logLevel: 'silent' },
    { root: FRONTEND, logLevel: 'silent' },
  )({ mode: 'test', command: 'serve' });
  const server = await createServer({
    ...config,
    configFile: false,
    plugins: [...plugins, ...(config.plugins ?? [])],
  });
  try {
    return await fn((id) => server.ssrLoadModule(id));
  } finally {
    await server.close();
  }
}
