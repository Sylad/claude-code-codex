<script setup lang="ts">
import { ref, computed } from "vue";
import { Search, Tag, ExternalLink, Rss } from "lucide-vue-next";
import type { LearningEntry, LearningKind } from "@/data/learning-types";
import { KIND_LABELS, KIND_ACCENTS } from "@/data/learning-types";

const props = defineProps<{ entries: LearningEntry[] }>();

const kinds: LearningKind[] = ["blog", "newsletter", "engineering", "podcast"];
const selectedKinds = ref<Set<LearningKind>>(new Set());
const searchQuery = ref("");

const counts = computed(() => {
  const map: Record<LearningKind, number> = {
    blog: 0,
    newsletter: 0,
    engineering: 0,
    podcast: 0,
  };
  for (const entry of props.entries) {
    map[entry.kind]++;
  }
  return map;
});

const filteredEntries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return props.entries.filter((entry) => {
    if (
      selectedKinds.value.size > 0 &&
      !selectedKinds.value.has(entry.kind)
    ) {
      return false;
    }
    if (query) {
      const haystack = [
        entry.name,
        entry.author,
        entry.description,
        entry.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
});

function toggleKind(k: LearningKind) {
  const next = new Set(selectedKinds.value);
  if (next.has(k)) next.delete(k);
  else next.add(k);
  selectedKinds.value = next;
}

function clearFilters() {
  selectedKinds.value = new Set();
  searchQuery.value = "";
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 mb-8">
      <div class="relative">
        <Search
          :size="16"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Rechercher (auteur, sujet, tag)..."
          class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-paper-elevated border border-white/10 text-ink placeholder:text-ink-muted focus:outline-none focus:border-claude/50 focus:ring-1 focus:ring-claude/30 transition-colors"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="k in kinds"
          :key="k"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors',
            selectedKinds.has(k)
              ? 'bg-claude text-paper border-claude'
              : 'border-white/10 text-ink-muted hover:border-claude/40 hover:text-ink',
          ]"
          @click="toggleKind(k)"
        >
          <span>{{ KIND_LABELS[k] }}</span>
          <span class="font-mono text-xs opacity-70">{{ counts[k] }}</span>
        </button>

        <button
          v-if="selectedKinds.size > 0 || searchQuery.trim() !== ''"
          class="text-sm text-ink-muted hover:text-claude underline underline-offset-4 ml-auto"
          @click="clearFilters"
        >
          Réinitialiser
        </button>
      </div>

      <p class="font-mono text-xs text-ink-muted">
        {{ filteredEntries.length }} / {{ entries.length }} sources
      </p>
    </div>

    <div
      v-if="filteredEntries.length === 0"
      class="text-center py-12 text-ink-muted"
    >
      <p>Aucune source ne match ces filtres.</p>
      <button
        class="mt-3 text-claude hover:text-claude-soft underline underline-offset-4"
        @click="clearFilters"
      >
        Réinitialiser les filtres
      </button>
    </div>

    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="relative overflow-hidden rounded-xl border border-white/10 bg-paper-elevated p-5 transition-colors hover:border-claude/30"
      >
        <div
          :class="`absolute inset-0 bg-gradient-to-br ${KIND_ACCENTS[entry.kind]} opacity-50 pointer-events-none`"
        ></div>

        <div class="relative flex flex-col gap-3 h-full">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p
                class="font-mono text-[10px] uppercase tracking-wider text-claude"
              >
                {{ KIND_LABELS[entry.kind] }} · {{ entry.author }}
              </p>
              <h3 class="mt-1 text-lg font-medium text-ink">
                <a
                  :href="entry.url"
                  target="_blank"
                  rel="noopener"
                  class="hover:text-claude transition-colors"
                >
                  {{ entry.name }}
                </a>
              </h3>
            </div>
            <a
              :href="entry.url"
              target="_blank"
              rel="noopener"
              class="p-1.5 -m-1.5 text-ink-muted hover:text-claude transition-colors"
              :aria-label="`Ouvrir ${entry.name}`"
            >
              <ExternalLink :size="16" />
            </a>
          </div>

          <p class="text-sm text-ink-muted leading-relaxed flex-1">
            {{ entry.description }}
          </p>

          <div class="flex flex-wrap items-center gap-1.5 pt-1">
            <a
              v-if="entry.feed"
              :href="entry.feed"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-claude/80 bg-claude/10 hover:bg-claude/20 transition-colors"
              :title="'Flux RSS'"
            >
              <Rss :size="10" />
              RSS
            </a>
            <span
              v-for="tag in entry.tags"
              :key="tag"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-ink-muted bg-white/5"
            >
              <Tag :size="10" />
              {{ tag }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
