<script setup lang="ts">
import { ref, computed } from "vue";
import { espacesOrdinaires } from "@/lib/jour-mois.mjs";
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
  // L87 : le texte rendu lie le jour à son mois par une insécable ; la recherche les lit comme des espaces.
  const query = espacesOrdinaires(searchQuery.value).trim().toLowerCase();
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
      if (!espacesOrdinaires(haystack).includes(query)) return false;
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
      <!-- L81 : libellé visible au lieu d'un texte indicatif tronqué au téléphone (comme /videos). -->
      <label for="learning-recherche" class="-mb-2 text-sm text-ink-muted">
        Rechercher une source <span class="whitespace-nowrap">(auteur, sujet, tag)</span>
      </label>
      <div class="relative">
        <Search
          :size="16"
          aria-hidden="true"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          v-model="searchQuery"
          id="learning-recherche"
          type="search"
          class="w-full pl-10 pr-4 py-2.5 rounded-lg bg-paper-elevated border border-white/10 text-ink placeholder:text-ink-muted focus:outline-none focus:border-claude focus-visible:ring-2 focus-visible:ring-claude transition-colors"
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="k in kinds"
          :key="k"
          type="button"
          :aria-pressed="selectedKinds.has(k)"
          :class="[
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors motion-safe:active:scale-95',
            selectedKinds.has(k)
              ? 'bg-claude text-paper border-claude'
              : 'border-white/10 text-ink-muted hover:border-claude/40 hover:text-ink',
          ]"
          @click="toggleKind(k)"
        >
          <span>{{ KIND_LABELS[k] }}</span>
          <span class="font-mono text-xs">{{ counts[k] }}</span>
        </button>

        <button
          v-if="selectedKinds.size > 0 || searchQuery.trim() !== ''"
          type="button"
          class="py-1 text-sm text-ink-muted hover:text-claude underline underline-offset-4 ml-auto cursor-pointer"
          @click="clearFilters"
        >
          Réinitialiser
        </button>
      </div>

      <p class="font-mono text-xs text-ink-muted" role="status">
        {{ filteredEntries.length }} / {{ entries.length }} sources
      </p>
    </div>

    <div
      v-if="filteredEntries.length === 0"
      class="text-center py-12 text-ink-muted"
    >
      <!-- L78 : un seul bouton pour remettre à zéro, « Réinitialiser » au-dessus (toujours affiché avec un filtre actif). -->
      <p>Aucune source ne correspond à ces filtres.</p>
      <p class="mt-2 text-sm">
        « Réinitialiser », au-dessus, affiche de nouveau toutes les sources.
      </p>
    </div>

    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="relative overflow-hidden rounded-xl border border-white/10 bg-paper-elevated p-borne-5 transition-[colors,transform,box-shadow] duration-200 hover:border-claude/30 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:hover:shadow-claude/10"
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
            <!-- L81 : l'icône double le lien du titre : un seul arrêt du clavier par carte (comme /videos). -->
            <a
              :href="entry.url"
              target="_blank"
              rel="noopener"
              tabindex="-1"
              aria-hidden="true"
              class="p-1.5 -m-1.5 text-ink-muted hover:text-claude transition-colors shrink-0"
            >
              <ExternalLink :size="16" aria-hidden="true" />
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
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-claude bg-claude/10 hover:bg-claude/20 transition-colors"
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
