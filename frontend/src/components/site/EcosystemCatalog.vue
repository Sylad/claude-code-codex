<script setup lang="ts">
import { ref, computed } from "vue";
import { Search, Tag, ExternalLink, Check } from "lucide-vue-next";
import type {
  EcosystemEntry,
  EcosystemCategory,
} from "@/data/ecosystem-types";
import {
  CATEGORY_LABELS,
  CATEGORY_ACCENTS,
} from "@/data/ecosystem-types";

const props = defineProps<{ entries: EcosystemEntry[] }>();

const categories: EcosystemCategory[] = ["plugin", "mcp", "skill", "tool"];
const selectedCategories = ref<Set<EcosystemCategory>>(new Set());
const onlyOfficial = ref(false);
const searchQuery = ref("");
const copiedId = ref<string | null>(null);

const counts = computed(() => {
  const map: Record<EcosystemCategory, number> = {
    plugin: 0,
    mcp: 0,
    skill: 0,
    tool: 0,
  };
  for (const entry of props.entries) {
    map[entry.category]++;
  }
  return map;
});

const filteredEntries = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return props.entries.filter((entry) => {
    if (
      selectedCategories.value.size > 0 &&
      !selectedCategories.value.has(entry.category)
    ) {
      return false;
    }
    if (onlyOfficial.value && !entry.official) return false;
    if (query) {
      const haystack = [
        entry.name,
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

function toggleCategory(c: EcosystemCategory) {
  const next = new Set(selectedCategories.value);
  if (next.has(c)) next.delete(c);
  else next.add(c);
  selectedCategories.value = next;
}

function clearFilters() {
  selectedCategories.value = new Set();
  onlyOfficial.value = false;
  searchQuery.value = "";
}

async function copyInstall(entry: EcosystemEntry) {
  try {
    await navigator.clipboard.writeText(entry.install);
    copiedId.value = entry.id;
    setTimeout(() => {
      if (copiedId.value === entry.id) copiedId.value = null;
    }, 1500);
  } catch {
    // ignore
  }
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
          placeholder="Rechercher dans le catalogue..."
          class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-paper-elevated border border-white/10 text-ink placeholder:text-ink-muted focus:outline-none focus:border-claude/50 focus:ring-1 focus:ring-claude/30 transition-colors"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="c in categories"
          :key="c"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors',
            selectedCategories.has(c)
              ? 'bg-claude text-paper border-claude'
              : 'border-white/10 text-ink-muted hover:border-claude/40 hover:text-ink',
          ]"
          @click="toggleCategory(c)"
        >
          <Check v-if="selectedCategories.has(c)" :size="14" />
          <span>{{ CATEGORY_LABELS[c] }}</span>
          <span class="font-mono text-xs opacity-70">{{ counts[c] }}</span>
        </button>

        <span class="w-px h-5 bg-white/10 mx-1"></span>

        <label
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border border-white/10 text-ink-muted cursor-pointer hover:text-ink hover:border-claude/40 transition-colors"
        >
          <input
            v-model="onlyOfficial"
            type="checkbox"
            class="accent-claude"
          />
          Anthropic-officiel uniquement
        </label>

        <button
          v-if="
            selectedCategories.size > 0 ||
            onlyOfficial ||
            searchQuery.trim() !== ''
          "
          class="text-sm text-ink-muted hover:text-claude underline underline-offset-4 ml-auto"
          @click="clearFilters"
        >
          Réinitialiser
        </button>
      </div>

      <p class="font-mono text-xs text-ink-muted">
        {{ filteredEntries.length }} / {{ entries.length }} entrées
      </p>
    </div>

    <div
      v-if="filteredEntries.length === 0"
      class="text-center py-12 text-ink-muted"
    >
      <p>Aucune entrée ne match ces filtres.</p>
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
        :class="[
          'relative overflow-hidden rounded-xl border border-white/10 bg-paper-elevated p-5 transition-colors hover:border-claude/30',
        ]"
      >
        <div
          :class="`absolute inset-0 bg-gradient-to-br ${CATEGORY_ACCENTS[entry.category]} opacity-50 pointer-events-none`"
        ></div>

        <div class="relative flex flex-col gap-3 h-full">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p
                class="font-mono text-[10px] uppercase tracking-wider text-claude"
              >
                {{ CATEGORY_LABELS[entry.category] }}
                <span v-if="entry.official" class="text-claude-soft">
                  · officiel
                </span>
              </p>
              <h3 class="mt-1 text-lg font-medium text-ink">
                {{ entry.name }}
              </h3>
            </div>
            <a
              :href="entry.source"
              target="_blank"
              rel="noopener"
              class="p-1.5 -m-1.5 text-ink-muted hover:text-claude transition-colors"
              :aria-label="`Source de ${entry.name}`"
            >
              <ExternalLink :size="16" />
            </a>
          </div>

          <p class="text-sm text-ink-muted leading-relaxed flex-1">
            {{ entry.description }}
          </p>

          <button
            class="group/install relative flex items-center gap-2 text-left rounded-md border border-white/10 bg-paper px-3 py-2 font-mono text-xs text-ink-muted hover:border-claude/30 hover:text-ink transition-colors"
            :title="'Copier la commande'"
            @click="copyInstall(entry)"
          >
            <span class="text-claude/70 shrink-0">$</span>
            <span class="truncate flex-1">{{ entry.install }}</span>
            <span
              :class="[
                'shrink-0 text-[10px] uppercase tracking-wider transition-opacity',
                copiedId === entry.id ? 'text-claude' : 'opacity-50',
              ]"
            >
              {{ copiedId === entry.id ? "copié" : "copier" }}
            </span>
          </button>

          <ul
            v-if="entry.tags.length > 0"
            class="flex flex-wrap items-center gap-1.5 pt-1"
          >
            <li v-for="tag in entry.tags" :key="tag">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-ink-muted bg-white/5"
              >
                <Tag :size="10" />
                {{ tag }}
              </span>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</template>
