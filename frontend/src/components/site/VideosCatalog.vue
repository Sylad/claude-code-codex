<script setup lang="ts">
import { ref, computed } from "vue";
import { Search, Tag, ExternalLink, PlaySquare, Check } from "lucide-vue-next";
import type {
  VideoEntry,
  VideoKind,
  VideoLanguage,
} from "@/data/videos-types";
import {
  KIND_LABELS,
  KIND_ACCENTS,
  LANGUAGE_LABELS,
} from "@/data/videos-types";

const props = defineProps<{ entries: VideoEntry[] }>();

const ALL_KINDS: VideoKind[] = ["channel", "video", "playlist"];
const selectedKinds = ref<Set<VideoKind>>(new Set());
const onlyOfficial = ref(false);
const onlyFr = ref(false);
const searchQuery = ref("");

const counts = computed(() => {
  const map: Record<VideoKind, number> = {
    channel: 0,
    video: 0,
    playlist: 0,
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
    if (onlyOfficial.value && !entry.official) return false;
    if (onlyFr.value && entry.language !== "fr") return false;
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

// L10 (Nielsen 5) : un filtre sans aucune entrée (« Playlist 0 ») ne menait qu'à une liste vide.
const kinds = computed(() => ALL_KINDS.filter((k) => counts.value[k] > 0));

function toggleKind(k: VideoKind) {
  const next = new Set(selectedKinds.value);
  if (next.has(k)) next.delete(k);
  else next.add(k);
  selectedKinds.value = next;
}

function clearFilters() {
  selectedKinds.value = new Set();
  onlyOfficial.value = false;
  onlyFr.value = false;
  searchQuery.value = "";
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 mb-8">
      <!-- L81 : l'exemple de recherche était un texte indicatif, tronqué au téléphone (« Rechercher ( »)
           et effacé à la saisie (WCAG 3.3.2, Nielsen 6) : c'est désormais un libellé visible, qui passe à la ligne. -->
      <label for="videos-recherche" class="-mb-2 text-sm text-ink-muted">
        Rechercher une chaîne ou une vidéo <span class="whitespace-nowrap">(auteur, sujet, tag)</span>
      </label>
      <div class="relative">
        <Search
          :size="16"
          aria-hidden="true"
          class="absolute left-[min(0.75rem,12px)] top-1/2 -translate-y-1/2 text-ink-muted"
        />
        <input
          v-model="searchQuery"
          id="videos-recherche"
          type="search"
          class="w-full pl-[min(2.5rem,40px)] pr-[min(1rem,16px)] py-2.5 rounded-lg bg-paper-elevated border border-white/10 text-ink placeholder:text-ink-muted focus:outline-none focus:border-claude focus-visible:ring-2 focus-visible:ring-claude transition-colors"
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
          <Check v-if="selectedKinds.has(k)" :size="14" aria-hidden="true" />
          <span>{{ KIND_LABELS[k] }}</span>
          <span class="font-mono text-xs">{{ counts[k] }}</span>
        </button>

        <span class="w-px h-5 bg-white/10 mx-1" aria-hidden="true"></span>

        <label
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border border-white/10 text-ink-muted cursor-pointer hover:text-ink hover:border-claude/40 transition-colors"
        >
          <input
            v-model="onlyOfficial"
            type="checkbox"
            class="accent-claude"
          />
          Officiel Anthropic
        </label>

        <label
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border border-white/10 text-ink-muted cursor-pointer hover:text-ink hover:border-claude/40 transition-colors"
        >
          <input v-model="onlyFr" type="checkbox" class="accent-claude" />
          FR uniquement
        </label>

        <button
          v-if="
            selectedKinds.size > 0 ||
            onlyOfficial ||
            onlyFr ||
            searchQuery.trim() !== ''
          "
          type="button"
          class="py-1 text-sm text-ink-muted hover:text-claude underline underline-offset-4 ml-auto cursor-pointer"
          @click="clearFilters"
        >
          Réinitialiser
        </button>
      </div>

      <p class="font-mono text-xs text-ink-muted" role="status">
        {{ filteredEntries.length }} / {{ entries.length }} chaînes et vidéos
      </p>
    </div>

    <div
      v-if="filteredEntries.length === 0"
      class="text-center py-12 text-ink-muted"
    >
      <!-- L10 (comme /learning, L78) : un seul bouton de remise à zéro, « Réinitialiser » au-dessus. -->
      <p>Aucune chaîne ni vidéo ne correspond à ces filtres.</p>
      <p class="mt-2 text-sm">
        « Réinitialiser », au-dessus, affiche de nouveau toute la sélection.
      </p>
    </div>

    <ul class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="relative overflow-hidden rounded-xl border border-white/10 bg-paper-elevated p-[min(1.25rem,20px)] transition-[colors,transform,box-shadow] duration-200 hover:border-claude/30 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:hover:shadow-claude/10"
      >
        <div
          :class="`absolute inset-0 bg-gradient-to-br ${KIND_ACCENTS[entry.kind]} opacity-50 pointer-events-none`"
        ></div>

        <div class="relative flex flex-col gap-3 h-full">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-1.5 flex-wrap">
                <p
                  class="font-mono text-[0.625rem] uppercase tracking-wider text-claude"
                >
                  {{ KIND_LABELS[entry.kind] }}
                </p>
                <span class="font-mono text-[0.625rem] text-ink-muted" aria-hidden="true">·</span>
                <p class="font-mono text-[0.625rem] text-ink-muted">
                  {{ LANGUAGE_LABELS[entry.language] }}
                </p>
                <span
                  v-if="entry.official"
                  class="font-mono text-[0.625rem] text-claude-soft"
                  ><span aria-hidden="true">· </span>officiel</span
                >
              </div>
              <h2
                class="mt-1.5 text-base font-medium text-ink leading-tight"
                :lang="entry.nameLang"
              >
                <a
                  :href="entry.url"
                  target="_blank"
                  rel="noopener"
                  class="hover:text-claude transition-colors"
                >
                  {{ entry.name }}
                </a>
              </h2>
              <p class="mt-0.5 text-xs text-ink-muted">
                {{ entry.author }}
              </p>
            </div>
            <!-- L81 : l'icône double le lien du titre (même adresse) : cliquable à la souris, mais
                 un seul arrêt du clavier et un seul lien lu par carte (WCAG 2.4.3, Nielsen 8). -->
            <a
              :href="entry.url"
              target="_blank"
              rel="noopener"
              tabindex="-1"
              aria-hidden="true"
              class="p-1.5 -m-1.5 text-ink-muted hover:text-claude transition-colors shrink-0"
            >
              <PlaySquare v-if="entry.kind === 'video'" :size="16" aria-hidden="true" />
              <ExternalLink v-else :size="16" aria-hidden="true" />
            </a>
          </div>

          <p class="text-sm text-ink-muted leading-relaxed flex-1">
            {{ entry.description }}
          </p>

          <ul
            v-if="entry.tags.length > 0"
            class="flex flex-wrap items-center gap-1.5 pt-1"
          >
            <li v-for="tag in entry.tags" :key="tag">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.625rem] font-mono text-ink-muted bg-white/5"
              >
                <Tag :size="10" aria-hidden="true" />
                {{ tag }}
              </span>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  </div>
</template>
