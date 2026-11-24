<script setup lang="ts">
import { ref, computed } from "vue";
import { espacesOrdinaires } from "@/lib/jour-mois.mjs";
import { Search, Tag, ExternalLink, Check } from "lucide-vue-next";
import type {
  EcosystemEntry,
  EcosystemCategory,
} from "@/data/ecosystem-types";
import {
  CATEGORY_LABELS,
  CATEGORY_ACCENTS,
} from "@/data/ecosystem-types";

const props = withDefaults(
  defineProps<{
    entries: EcosystemEntry[];
    /** Nom accessible de la recherche, propre à la section (deux catalogues sur la page). */
    searchLabel: string;
    /** Sous ce nombre d'entrées, ni recherche ni filtres : la liste se lit d'un coup d'œil. */
    filtersFrom?: number;
  }>(),
  { filtersFrom: 6 },
);

const showFilters = computed(() => props.entries.length >= props.filtersFrom);

const categories: EcosystemCategory[] = ["plugin", "mcp", "skill", "tool"];
const selectedCategories = ref<Set<EcosystemCategory>>(new Set());
const searchQuery = ref("");
const copiedId = ref<string | null>(null);
const copiedMessage = ref("");

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
  // L87 : le texte rendu lie le jour à son mois par une insécable ; la recherche les lit comme des espaces.
  const query = espacesOrdinaires(searchQuery.value).trim().toLowerCase();
  return props.entries.filter((entry) => {
    if (
      selectedCategories.value.size > 0 &&
      !selectedCategories.value.has(entry.category)
    ) {
      return false;
    }
    if (query) {
      const haystack = [
        entry.name,
        entry.description,
        entry.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      if (!espacesOrdinaires(haystack).includes(query)) return false;
    }
    return true;
  });
});

function isShellCommand(command: string): boolean {
  return !command.startsWith("/") && !command.startsWith("uses:");
}

function toggleCategory(c: EcosystemCategory) {
  const next = new Set(selectedCategories.value);
  if (next.has(c)) next.delete(c);
  else next.add(c);
  selectedCategories.value = next;
}

function clearFilters() {
  selectedCategories.value = new Set();
  searchQuery.value = "";
}

async function copyInstall(entry: EcosystemEntry) {
  if (!entry.install) return;
  try {
    await navigator.clipboard.writeText(entry.install);
    copiedId.value = entry.id;
    copiedMessage.value = `Commande de ${entry.name} copiée.`;
    setTimeout(() => {
      if (copiedId.value === entry.id) {
        copiedId.value = null;
        copiedMessage.value = "";
      }
    }, 1500);
  } catch {
    copiedMessage.value = `Copie impossible : sélectionne la commande de ${entry.name} à la main.`;
  }
}
</script>

<template>
  <div>
    <p role="status" class="sr-only">{{ copiedMessage }}</p>

    <div v-if="showFilters" class="flex flex-col gap-4 mb-8">
      <div class="relative">
        <Search
          :size="16"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          v-model="searchQuery"
          type="search"
          :aria-label="searchLabel"
          placeholder="Nom, description, étiquette…"
          class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-paper-elevated border border-white/10 text-ink placeholder:text-ink-muted focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-claude transition-colors"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="c in categories"
          :key="c"
          type="button"
          :aria-pressed="selectedCategories.has(c)"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors motion-safe:active:scale-95',
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

        <button
          v-if="selectedCategories.size > 0 || searchQuery.trim() !== ''"
          type="button"
          class="text-sm text-ink-muted hover:text-claude underline underline-offset-4 ml-auto cursor-pointer"
          @click="clearFilters"
        >
          Réinitialiser
        </button>
      </div>

      <p role="status" class="font-mono text-xs text-ink-muted">
        {{ filteredEntries.length }} / {{ entries.length }} entrées
      </p>
    </div>

    <div
      v-if="filteredEntries.length === 0"
      class="text-center py-12 text-ink-muted"
    >
      <p>Aucune entrée ne correspond à ces filtres.</p>
      <button
        type="button"
        class="cursor-pointer mt-3 text-claude hover:text-claude-soft underline underline-offset-4"
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
          'relative overflow-hidden rounded-xl border border-white/10 bg-paper-elevated p-[min(1.25rem,20px)] transition-[colors,transform,box-shadow] duration-200 hover:border-claude/30 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:hover:shadow-claude/10',
        ]"
      >
        <div
          :class="`absolute inset-0 bg-gradient-to-br ${CATEGORY_ACCENTS[entry.category]} opacity-50 pointer-events-none`"
        ></div>

        <div class="relative flex flex-col gap-3 h-full">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p
                class="font-mono text-xs uppercase tracking-wider text-claude"
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

          <!-- Conteneur de requête : « copier » quitte la ligne de la commande quand le bloc fait
               moins de 16rem (police agrandie, carte étroite) ; la commande garde toute la largeur. -->
          <div v-if="entry.install" class="@container">
            <button
              type="button"
              class="w-full flex flex-wrap items-start gap-x-2 gap-y-1 text-left rounded-md border border-white/10 bg-paper px-3 py-2 font-mono text-xs text-ink-muted cursor-pointer hover:border-claude/30 hover:text-ink transition-colors"
              @click="copyInstall(entry)"
            >
              <span class="flex gap-2 min-w-0 basis-full @[16rem]:basis-0 @[16rem]:flex-1">
                <!-- « $ » seulement devant une commande du terminal : « /plugin … » se tape dans
                     Claude Code, « uses: … » est une ligne de workflow. -->
                <span
                  v-if="isShellCommand(entry.install)"
                  class="text-claude shrink-0"
                  aria-hidden="true"
                  >$</span
                >
                <span class="flex-1 min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{{
                  entry.install
                }}</span>
              </span>
              <span
                :class="[
                  'ml-auto shrink-0 uppercase tracking-wider',
                  copiedId === entry.id ? 'text-claude' : 'text-ink-muted',
                ]"
              >
                {{ copiedId === entry.id ? "copié" : "copier" }}
              </span>
            </button>
          </div>
          <p
            v-else-if="entry.guide"
            class="rounded-md border border-dashed border-white/10 px-3 py-2 text-xs text-ink-muted leading-relaxed [overflow-wrap:anywhere]"
          >
            <span class="font-mono uppercase tracking-wider text-claude">Installation</span>
            · {{ entry.guide }}
          </p>

          <ul
            v-if="entry.tags.length > 0"
            class="flex flex-wrap items-center gap-1.5 pt-1"
          >
            <li v-for="tag in entry.tags" :key="tag">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono text-ink-muted bg-white/5"
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
