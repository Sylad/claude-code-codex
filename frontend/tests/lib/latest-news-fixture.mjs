// Rend le composant LatestNews sur des entrées de flux de test (L76, L78) : les imports des flux
// versionnés sont remplacés le temps du rendu (plugin Vite), le composant est rendu par l'API
// container d'Astro. Les entrées sont toutes de la source « anthropic-news », les autres flux vides.
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { withViteSsr } from './vite-ssr.mjs';

export const entree = (n, summary, source = 'anthropic-news') => ({
  id: `fixture-${n}`, source, url: `https://exemple.org/${n}`,
  title: `Titre fixture ${n}`, summary, publishedAt: `2026-11-${String(10 + n).padStart(2, '0')}T08:00:00Z`,
  fetchedAt: '2026-11-20T08:00:00Z',
});

export async function renderLatestNews(entries) {
  const dir = mkdtempSync(join(tmpdir(), 'latest-news-'));
  try {
    const plein = join(dir, 'plein.json');
    const vide = join(dir, 'vide.json');
    writeFileSync(plein, JSON.stringify(entries));
    writeFileSync(vide, '[]');
    const fixture = {
      name: 'fixture-flux-latest-news', enforce: 'pre',
      resolveId(id) {
        const m = /(?:^|\/)data\/feeds\/([\w-]+)\.json$/.exec(id);
        if (!m) return null;
        return m[1] === 'anthropic-news' ? plein : vide;
      },
    };
    return await withViteSsr([fixture], async (load) => {
      const { default: LatestNews } = await load('/src/components/site/LatestNews.astro');
      return (await AstroContainer.create()).renderToString(LatestNews);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Le <p> du résumé de l'entrée n dans le HTML rendu ('' s'il manque). */
export const resumeDe = (html, n) =>
  html.split('<li').find((c) => new RegExp(`Titre fixture ${n}(?!\\d)`).test(c))?.match(/<p[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';

// Chaque résumé tente une injection différente (chacun sous les 220 caractères de la troncature) ;
// window.__pwn sert de témoin côté navigateur. Utilisés par l78-suite-fil.test et l78-learning.e2e.
export const HOSTILES = [
  '<p>Avant <script>window.__pwn=1</script> <img src=x onerror="window.__pwn=2"> après</p>',
  '&lt;img src=x onerror=window.__pwn=3&gt; <code>&lt;script&gt;window.__pwn=4&lt;/script&gt;</code>',
  'We`re <a href="javascript:alert(5)" onclick="window.__pwn=5">lien</a> it`s',
  '`<svg onload=window.__pwn=6>` et &lt;iframe srcdoc=x&gt; fin',
];

