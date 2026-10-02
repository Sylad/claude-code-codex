<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { Menu, X, BookOpenText, ChevronDown } from "lucide-vue-next";
import {
  NEWS_SEEN_EVENT,
  badgeLabel,
  browserStorage,
  countUnseen,
  ensureBaseline,
  readSeen,
  unseenLabel,
} from "@/lib/news-badge";

const props = defineProps<{
  pathname: string;
  news?: { slug: string; date: string }[];
}>();

// Pastille « nouveau » du lien Nouveautés (L13, L17) : entrées non vues (localStorage),
// relue après la visite de /nouveautes et entre onglets. La toute première page vue du
// site pose la mémoire de base (aucune pastille), pour que les entrées publiées ensuite
// lèvent la pastille même sans visite de /nouveautes.
const unseen = ref(0);
const badge = computed(() => badgeLabel(unseen.value));
const unseenText = computed(() => unseenLabel(unseen.value));
function refreshBadge() {
  unseen.value = countUnseen(props.news ?? [], readSeen(browserStorage()));
}
const NEWS_HREF = "/nouveautes";

type Child = { href: string; label: string };
type NavLink = { href: string; label: string } | { label: string; children: Child[] };

// L17 — barre du bureau dès 64em (1024 px à la taille de police par défaut) : Learning et
// Vidéos regroupés sous « Ressources ▾ », « Nouveautés » toujours visible (avec sa
// pastille). « Plan de travail » et « À propos » ne tiennent pas dans la barre avec une
// vraie marge (mesuré par tests/navbar.e2e.test.mjs) : pied de page et menu du téléphone.
const links: NavLink[] = [
  { href: "/start", label: "Démarrer" },
  { href: "/atelier-ia", label: "Atelier IA" },
  { href: "/theory", label: "Théorie" },
  { href: "/ecosystem", label: "Écosystème" },
  { href: "/case-studies", label: "Case studies" },
  {
    label: "Guides",
    children: [
      { href: "/k8s-for-java-developers", label: "K8s pour Java" },
      { href: "/argocd-k8s-pour-les-nuls", label: "ArgoCD pour les nuls" },
      { href: "/cloudflare-pour-les-nuls", label: "Cloudflare pour les nuls" },
    ],
  },
  {
    label: "Ressources",
    children: [
      { href: "/learning", label: "Learning" },
      { href: "/videos", label: "Vidéos" },
    ],
  },
  { href: NEWS_HREF, label: "Nouveautés" },
];
/** Menu du téléphone seulement (et pied de page). */
const phoneOnly: Child[] = [
  { href: "/plan-de-travail", label: "Plan de travail" },
  { href: "/about", label: "À propos" },
];

const open = ref(false);
const scrolled = ref(false);
/** Un seul panneau ouvert à la fois (Guides ou Ressources). */
const openDropdown = ref<string | null>(null);

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

const menuToggle = ref<HTMLButtonElement | null>(null);
const toggleOf = (label: string) =>
  document.querySelector<HTMLButtonElement>(`[data-dropdown-toggle="${label}"]`);

// Échap ferme le panneau ouvert ou le menu du téléphone et rend le focus au bouton
// qui l'a ouvert (WCAG 2.1.1 / 2.4.3).
function onKeydown(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  if (openDropdown.value) {
    const label = openDropdown.value;
    openDropdown.value = null;
    toggleOf(label)?.focus();
  } else if (open.value) {
    open.value = false;
    menuToggle.value?.focus();
  }
}

function onClickOutside(e: MouseEvent) {
  if (!openDropdown.value) return;
  const target = e.target as HTMLElement;
  if (!target.closest(`[data-dropdown="${openDropdown.value}"]`)) openDropdown.value = null;
}

/** Le focus quitte le bouton et son panneau (Tab au-delà du dernier lien) : on referme. */
function onFocusOut(label: string, e: FocusEvent) {
  const group = e.currentTarget as HTMLElement;
  const next = e.relatedTarget as Node | null;
  if (next && group.contains(next)) return;
  if (openDropdown.value === label) openDropdown.value = null;
}

/** Après une navigation (routeur des transitions Astro) : panneaux et menu fermés. */
function closeAll() {
  openDropdown.value = null;
  open.value = false;
}

onMounted(() => {
  ensureBaseline(browserStorage(), props.news ?? []);
  refreshBadge();
  window.addEventListener(NEWS_SEEN_EVENT, refreshBadge);
  window.addEventListener("storage", refreshBadge);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClickOutside);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener("astro:after-swap", closeAll);
});

onUnmounted(() => {
  window.removeEventListener(NEWS_SEEN_EVENT, refreshBadge);
  window.removeEventListener("storage", refreshBadge);
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("click", onClickOutside);
  document.removeEventListener("keydown", onKeydown);
  document.removeEventListener("astro:after-swap", closeAll);
});

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function isGroupActive(children: Child[], pathname: string) {
  return children.some((c) => isActive(c.href, pathname));
}

function toggleDropdown(label: string) {
  openDropdown.value = openDropdown.value === label ? null : label;
}

const panelId = (label: string) => `panneau-${label.toLowerCase()}`;
</script>

<template>
  <header
    :class="[
      'fixed top-0 inset-x-0 z-50 transition-colors duration-300 backdrop-blur-md border-b',
      // Fond toujours présent (WCAG 1.4.3) : en haut de page, la barre
      // transparente laissait les liens à 4,2:1 sur l'image de fond.
      scrolled || open
        ? 'bg-paper/95 border-white/5'
        : 'bg-paper/85 border-transparent',
    ]"
  >
    <!-- Seuils en rem dans les requêtes média (= em : taille de police par défaut du
         navigateur) : avec une police par défaut plus grande, le menu du téléphone prend
         le relais plus tôt au lieu d'une barre qui déborde. -->
    <nav class="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between gap-3">
      <a
        href="/"
        class="flex min-w-0 lg:shrink-0 items-center gap-2.5 whitespace-nowrap group"
        aria-label="Claude Code Codex — accueil"
      >
        <span
          class="grid shrink-0 place-items-center w-8 h-8 rounded-md border border-claude/40 bg-claude/10 text-claude transition-[colors,transform] duration-200 group-hover:bg-claude/20 motion-safe:group-hover:rotate-[-3deg] motion-safe:group-active:scale-95"
        >
          <BookOpenText :size="16" />
        </span>
        <span class="min-w-0 truncate font-mono text-sm tracking-tight text-ink">
          claude-code-codex
        </span>
      </a>

      <ul class="hidden lg:flex min-w-0 items-center gap-0.5 ml-4">
        <template v-for="link in links" :key="link.label">
          <!-- Lien simple -->
          <li v-if="'href' in link">
            <a
              :href="link.href"
              :aria-current="isActive(link.href, props.pathname) ? 'page' : undefined"
              :class="[
                'relative whitespace-nowrap px-2 xl:px-2.5 py-2 text-sm rounded-md transition-colors motion-safe:active:scale-95',
                isActive(link.href, props.pathname)
                  ? 'text-claude bg-claude/10'
                  : 'text-ink-muted hover:text-ink hover:bg-white/5',
              ]"
            >
              {{ link.label }}
              <template v-if="link.href === NEWS_HREF && badge">
                <!-- Pastille posée sur le coin du lien : n'élargit pas la barre. -->
                <span
                  class="news-badge absolute -top-1.5 -right-1.5 grid place-items-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-claude text-paper text-[0.6875rem] font-semibold leading-none"
                  aria-hidden="true"
                  >{{ badge }}</span
                >
                <span class="sr-only"> ({{ unseenText }})</span>
              </template>
            </a>
          </li>
          <!-- Bouton à divulgation (pas un menu ARIA, pas d'ouverture au survol) :
               Entrée/Espace ouvrent et ferment, le focus reste sur le bouton ; Tab
               parcourt les liens ; Échap ferme et rend le focus ; fermé aussi par un clic
               à l'extérieur, quand le focus quitte le groupe et après une navigation. -->
          <li
            v-else
            class="relative"
            :data-dropdown="link.label"
            @focusout="onFocusOut(link.label, $event)"
          >
            <button
              type="button"
              :class="[
                'flex items-center gap-1 whitespace-nowrap px-2 xl:px-2.5 py-2 text-sm rounded-md transition-colors motion-safe:active:scale-95',
                isGroupActive(link.children, props.pathname)
                  ? 'text-claude bg-claude/10'
                  : 'text-ink-muted hover:text-ink hover:bg-white/5',
              ]"
              :data-dropdown-toggle="link.label"
              :aria-expanded="openDropdown === link.label"
              :aria-controls="panelId(link.label)"
              @click="toggleDropdown(link.label)"
            >
              {{ link.label }}
              <ChevronDown
                :size="14"
                aria-hidden="true"
                :class="[
                  'transition-transform duration-200',
                  openDropdown === link.label ? 'rotate-180' : '',
                ]"
              />
            </button>
            <div
              v-show="openDropdown === link.label"
              :id="panelId(link.label)"
              class="absolute left-0 mt-2 min-w-56 rounded-md border border-white/10 bg-paper/95 backdrop-blur-md shadow-xl py-1"
            >
              <a
                v-for="child in link.children"
                :key="child.href"
                :href="child.href"
                :aria-current="isActive(child.href, props.pathname) ? 'page' : undefined"
                :class="[
                  'flex items-center min-h-11 px-3 text-sm transition-colors',
                  isActive(child.href, props.pathname)
                    ? 'text-claude bg-claude/10'
                    : 'text-ink-muted hover:text-ink hover:bg-white/5',
                ]"
                @click="openDropdown = null"
              >
                {{ child.label }}
              </a>
            </div>
          </li>
        </template>
      </ul>

      <button
        class="lg:hidden relative shrink-0 grid place-items-center w-11 h-11 rounded-md text-ink hover:bg-white/5 transition-colors"
        ref="menuToggle"
        type="button"
        :aria-expanded="open"
        aria-controls="mobile-menu"
        :aria-label="
          open
            ? 'Fermer le menu'
            : unseenText
              ? `Ouvrir le menu (${unseenText})`
              : 'Ouvrir le menu'
        "
        @click="open = !open"
      >
        <X v-if="open" :size="20" />
        <Menu v-else :size="20" />
        <span
          v-if="badge && !open"
          class="news-badge absolute top-0.5 right-0.5 grid place-items-center min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-claude text-paper text-[0.6875rem] font-semibold leading-none"
          aria-hidden="true"
          >{{ badge }}</span
        >
      </button>
    </nav>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        id="mobile-menu"
        class="lg:hidden border-t border-white/5 bg-paper max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
      >
        <ul class="px-5 py-4 flex flex-col gap-1">
          <template v-for="link in links" :key="link.label">
            <li v-if="'href' in link">
              <a
                :href="link.href"
                :aria-current="isActive(link.href, props.pathname) ? 'page' : undefined"
                :class="[
                  'flex items-center gap-2 px-3 py-3 rounded-md text-base transition-colors',
                  isActive(link.href, props.pathname)
                    ? 'text-claude bg-claude/10'
                    : 'text-ink-muted hover:text-ink hover:bg-white/5',
                ]"
                @click="open = false"
              >
                {{ link.label }}
                <template v-if="link.href === NEWS_HREF && badge">
                  <span
                    class="news-badge grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-claude text-paper text-xs font-semibold leading-none"
                    aria-hidden="true"
                    >{{ badge }}</span
                  >
                  <span class="sr-only"> ({{ unseenText }})</span>
                </template>
              </a>
            </li>
            <!-- Téléphone : les groupes sont dépliés sous leur intitulé -->
            <li v-else>
              <div class="px-3 pt-3 pb-1 text-xs uppercase tracking-wider text-ink-muted">
                {{ link.label }}
              </div>
              <a
                v-for="child in link.children"
                :key="child.href"
                :href="child.href"
                :aria-current="isActive(child.href, props.pathname) ? 'page' : undefined"
                :class="[
                  'block px-6 py-3 rounded-md text-base transition-colors',
                  isActive(child.href, props.pathname)
                    ? 'text-claude bg-claude/10'
                    : 'text-ink-muted hover:text-ink hover:bg-white/5',
                ]"
                @click="open = false"
              >
                {{ child.label }}
              </a>
            </li>
          </template>
          <li v-for="item in phoneOnly" :key="item.href">
            <a
              :href="item.href"
              :aria-current="isActive(item.href, props.pathname) ? 'page' : undefined"
              :class="[
                'flex items-center gap-2 px-3 py-3 rounded-md text-base transition-colors',
                isActive(item.href, props.pathname)
                  ? 'text-claude bg-claude/10'
                  : 'text-ink-muted hover:text-ink hover:bg-white/5',
              ]"
              @click="open = false"
            >
              {{ item.label }}
            </a>
          </li>
        </ul>
      </div>
    </Transition>
  </header>
</template>
