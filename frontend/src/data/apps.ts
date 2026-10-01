// Applications présentées dans /case-studies — source unique du nombre
// d'apps cité ailleurs (accueil, bloc RTK, Démarrer).
export interface CaseStudyApp {
  name: string;
  tagline: string;
  stack: string;
  role: string;
  href: string;
  repo?: string;
  accent: string;
}

export const apps: CaseStudyApp[] = [
  {
    name: "warhammer40k",
    tagline: "Codex narratif sur l'univers Warhammer 40K",
    stack: "Angular 19 · NestJS · Anthropic SDK",
    role: "Visual-first, lore consolidé, galaxy map Bézier",
    href: "/case-studies/warhammer40k",
    repo: "https://github.com/Sylad/warhammer40k",
    accent: "from-amber-500/20 to-transparent",
  },
  {
    name: "finance-tracker",
    tagline: "Tracker finances perso avec analyse PDF par Claude",
    stack: "React · NestJS · Claude tool_use two-phase",
    role: "Upload multi-PDF, catégorisation auto, démo Cloudflare verrouillée",
    href: "/case-studies/finance-tracker",
    repo: "https://github.com/Sylad/finance-tracker",
    accent: "from-emerald-500/20 to-transparent",
  },
  {
    name: "jobmail-assistant",
    tagline: "Assistant emploi local + pont Thunderbird",
    stack: "Python 3.12 · FastAPI · SQLite · Thunderbird WebExtension · Ollama",
    role: "Pipeline privacy-first, cleaner MBOX, puis délégation des actions à Thunderbird",
    href: "/case-studies/jobmail-assistant",
    repo: "https://github.com/Sylad/jobmail-assistant",
    accent: "from-sky-500/20 to-transparent",
  },
  {
    name: "ol-companion",
    tagline: "Compagnon OL avec live-match et carte Ligue 1",
    stack: "React · NestJS · 365scores API · SSE",
    role: "Live SSE, brackets coupe, carte L1 markers bicolores",
    href: "/case-studies/ol-companion",
    repo: "https://github.com/Sylad/ol-companion",
    accent: "from-red-500/20 to-transparent",
  },
  {
    name: "avatar-pandora",
    tagline: "Codex Avatar / Pandora — atmosphère temps-driven",
    stack: "Astro 6 · React 19 · R3F · GSAP",
    role: "Cinema canvas time-driven, particules WebGL, ambient self-running",
    href: "/case-studies/avatar-pandora",
    repo: "https://github.com/Sylad/avatar-pandora",
    accent: "from-cyan-500/20 to-transparent",
  },
  {
    name: "evatosorus",
    tagline: "Codex paléonto richement illustré",
    stack: "Astro 6 · React 19 · openart.ai assets",
    role: "Hero T-Rex IA, vidéos boucle, codex 200+ espèces",
    href: "/case-studies/evatosorus",
    repo: "https://github.com/Sylad/evatosorus",
    accent: "from-lime-500/20 to-transparent",
  },
  {
    name: "claude-code-codex",
    tagline: "Ce site même — méta-codex sur Claude Code",
    stack: "Astro 6 · Vue 3 · shadcn-vue · GitHub Actions cron",
    role: "Doc + écosystème + case studies, batch update hebdo via Claude",
    href: "/case-studies/claude-code-codex",
    repo: "https://github.com/Sylad/claude-code-codex",
    accent: "from-orange-500/20 to-transparent",
  },
  {
    name: "aetherwx",
    tagline: "AetherWX — atlas live multi-source : AIS + météo + foudre + alerts (anciennement Maritime Atlas)",
    stack: "Angular 19 · MapLibre · NestJS 11 · GeoServer 3.0.1 cluster · PostGIS · RabbitMQ",
    role: "~15 sources externes, slider temps, particules WebGL, cluster GeoServer 3 replicas sur k3s bare-metal",
    href: "/case-studies/maritime-atlas",
    accent: "from-teal-500/20 to-transparent",
  },
];

export const APP_COUNT = apps.length;
