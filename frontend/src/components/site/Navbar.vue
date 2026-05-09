<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { Menu, X, BookOpenText } from "lucide-vue-next";

defineProps<{ pathname: string }>();

const links = [
  { href: "/start", label: "Démarrer" },
  { href: "/theory", label: "Théorie" },
  { href: "/ecosystem", label: "Écosystème" },
  { href: "/case-studies", label: "Case studies" },
  { href: "/learning", label: "Learning" },
  { href: "/videos", label: "Vidéos" },
  { href: "/about", label: "À propos" },
];

const open = ref(false);
const scrolled = ref(false);

function onScroll() {
  scrolled.value = window.scrollY > 8;
}

onMounted(() => {
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
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
        <li v-for="link in links" :key="link.href">
          <a
            :href="link.href"
            :class="[
              'px-3 py-2 text-sm rounded-md transition-colors motion-safe:active:scale-95',
              isActive(link.href, pathname)
                ? 'text-claude bg-claude/10'
                : 'text-ink-muted hover:text-ink hover:bg-white/5',
            ]"
          >
            {{ link.label }}
          </a>
        </li>
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
          <li v-for="link in links" :key="link.href">
            <a
              :href="link.href"
              :class="[
                'block px-3 py-3 rounded-md text-base transition-colors',
                isActive(link.href, pathname)
                  ? 'text-claude bg-claude/10'
                  : 'text-ink-muted hover:text-ink hover:bg-white/5',
              ]"
              @click="open = false"
            >
              {{ link.label }}
            </a>
          </li>
        </ul>
      </div>
    </Transition>
  </header>
</template>
