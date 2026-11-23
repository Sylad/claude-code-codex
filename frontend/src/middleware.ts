// L87 — à la construction, chaque page HTML passe par la fonction unique qui lie un jour à son nom de
// mois par une insécable (« 31 octobre », jamais « 31 | octobre » en fin de ligne), quelle que soit
// l'origine du texte : markdown des Nouveautés, données, pages. Voir src/lib/jour-mois.mjs.
// Les pages sont prérendues : le middleware tourne au build (et en dev), jamais chez le visiteur.
import { defineMiddleware } from 'astro:middleware';
import { lierJourMoisHtml } from '@/lib/jour-mois.mjs';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const html = lierJourMoisHtml(await response.text());
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
});
