<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { Menu, X, BookOpenText, ChevronDown } from "lucide-vue-next";

const props = defineProps<{ pathname: string }>();

type NavLink =
  | { href: string; label: string }
  | { label: string; children: { href: string; label: string }[] };

const links: NavLink[] = [
  { href: "/start", label: "Démarrer" },
  { href: "/theory", label: "Théorie" },
  { href: "/ecosystem", label: "Écosystème" },
  { href: "/case-studies", label: "Case studies" },
  {
    label: "Guides",
    children: [
      { href: "/k8s-for-java-developers", label: "K8s pour Java" },
      { href: "/argocd-k8s-pour-les-nuls", label: "ArgoCD pour les nuls" },
    ],
  },
  { href: "/learning", label: "Learning" },
  { href: "/videos", label: "Vidéos" },
  { href: "/about", label: "À propos" },
];

const open = ref(false);
const scrolled = ref(false);
const openDropdown = ref<string | null>(null);

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

function onClickOutside(e: MouseEvent) {
  if (!openDropdown.value) return;
  const target = e.target as HTMLElement;
  if (!target.closest("[data-dropdown]")) openDropdown.value = null;
}

onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClickOutside);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("click", onClickOutside);
});

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

function isGroupActive(children: { href: string }[], pathname: string) {
  return children.some((c) => isActive(c.href, pathname));
}

function toggleDropdown(label: string) {
  openDropdown.value = openDropdown.value === label ? null : label;
}
</script>

<template>
  <header
    :class="[
      'fixed top-0 inset-x-0 z-50 transition-colors duration-300',
      scrolled || open
        ? 'bg-paper/90 backdrop-blur-md border-b border-white/5'
        : 'bg-transparent',
    ]"
  >
    <nav class="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between">
      <a
        href="/"
        class="flex items-center gap-2.5 group"
        aria-label="Claude Code Codex — accueil"
      >
        <span
          class="grid place-items-center w-8 h-8 rounded-md border border-claude/40 bg-claude/10 text-claude transition-[colors,transform] duration-200 group-hover:bg-claude/20 motion-safe:group-hover:rotate-[-3deg] motion-safe:group-active:scale-95"
        >
          <BookOpenText :size="16" />
        </span>
        <span class="font-mono text-sm tracking-tight text-ink">
          claude-code-codex
        </span>
      </a>

      <ul class="hidden md:flex items-center gap-1">
        <template v-for="link in links" :key="link.label">
          <!-- Lien simple -->
          <li v-if="'href' in link">
            <a
              :href="link.href"
              :class="[
                'px-3 py-2 text-sm rounded-md transition-colors motion-safe:active:scale-95',
                isActive(link.href, props.pathname)
                  ? 'text-claude bg-claude/10'
                  : 'text-ink-muted hover:text-ink hover:bg-white/5',
              ]"
            >
              {{ link.label }}
            </a>
          </li>
          <!-- Dropdown groupé -->
          <li v-else class="relative" data-dropdown>
            <button
              type="button"
              :class="[
                'flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors motion-safe:active:scale-95',
                isGroupActive(link.children, props.pathname)
                  ? 'text-claude bg-claude/10'
                  : 'text-ink-muted hover:text-ink hover:bg-white/5',
              ]"
              :aria-expanded="openDropdown === link.label"
              @click="toggleDropdown(link.label)"
            >
              {{ link.label }}
              <ChevronDown
                :size="14"
                :class="[
                  'transition-transform duration-200',
                  openDropdown === link.label ? 'rotate-180' : '',
                ]"
              />
            </button>
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div
                v-if="openDropdown === link.label"
                class="absolute left-0 mt-2 min-w-56 rounded-md border border-white/10 bg-paper/95 backdrop-blur-md shadow-xl py-1"
              >
                <a
                  v-for="child in link.children"
                  :key="child.href"
                  :href="child.href"
                  :class="[
                    'block px-3 py-2 text-sm transition-colors',
                    isActive(child.href, props.pathname)
                      ? 'text-claude bg-claude/10'
                      : 'text-ink-muted hover:text-ink hover:bg-white/5',
                  ]"
                  @click="openDropdown = null"
                >
                  {{ child.label }}
                </a>
              </div>
            </Transition>
          </li>
        </template>
      </ul>

      <button
        class="md:hidden grid place-items-center w-10 h-10 rounded-md text-ink hover:bg-white/5 transition-colors"
        :aria-expanded="open"
        aria-label="Ouvrir le menu"
        @click="open = !open"
      >
        <X v-if="open" :size="20" />
        <Menu v-else :size="20" />
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
        class="md:hidden border-t border-white/5 bg-paper/95 backdrop-blur-md"
      >
        <ul class="px-5 py-4 flex flex-col gap-1">
          <template v-for="link in links" :key="link.label">
            <li v-if="'href' in link">
              <a
                :href="link.href"
                :class="[
                  'block px-3 py-3 rounded-md text-base transition-colors',
                  isActive(link.href, props.pathname)
                    ? 'text-claude bg-claude/10'
                    : 'text-ink-muted hover:text-ink hover:bg-white/5',
                ]"
                @click="open = false"
              >
                {{ link.label }}
              </a>
            </li>
            <!-- Mobile : flatten les children sous un label de groupe -->
            <li v-else>
              <div class="px-3 pt-3 pb-1 text-xs uppercase tracking-wider text-ink-muted/70">
                {{ link.label }}
              </div>
              <a
                v-for="child in link.children"
                :key="child.href"
                :href="child.href"
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
        </ul>
      </div>
    </Transition>
  </header>
</template>
