// L76 — lien externe sûr : seules les URL absolues http(s) passent. Tout le reste (autre
// protocole, URL relative, chaîne illisible) renvoie null. Partagé par le batch qui écrit
// les flux (scripts/batch-update.ts) et par la page qui les affiche (LatestNews.astro).
export function safeHttpUrl(value) {
  if (typeof value !== 'string') return null;
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
}
