<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface TocEntry {
  id: string;
  number: string;
  title: string;
}

defineProps<{ entries: TocEntry[] }>();

const activeId = ref<string>("");
let observer: IntersectionObserver | null = null;

onMounted(() => {
  const sections = document.querySelectorAll("section[id]");
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) {
        activeId.value = visible[0].target.id;
      }
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.5, 1] },
  );
  sections.forEach((s) => observer!.observe(s));
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>

<template>
  <nav
    aria-label="Table des matières"
    class="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2"
  >
    <p
      class="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/60 mb-3"
    >
      Sommaire
    </p>
    <ol class="space-y-1 border-l border-white/10">
      <li v-for="entry in entries" :key="entry.id">
        <a
          :href="`#${entry.id}`"
          :class="[
            '-ml-px block pl-4 py-1.5 text-sm border-l transition-colors',
            activeId === entry.id
              ? 'border-claude text-claude'
              : 'border-transparent text-ink-muted hover:text-ink hover:border-white/30',
          ]"
        >
          <span class="font-mono text-[11px] text-ink/50 mr-1.5">{{
            entry.number
          }}</span>
          <span>{{ entry.title }}</span>
        </a>
      </li>
    </ol>
  </nav>
</template>
