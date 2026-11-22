<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { Maximize2, X } from "lucide-vue-next";

const props = defineProps<{
  definition: string;
  caption?: string;
}>();

const inlineContainer = ref<HTMLDivElement | null>(null);
const fullscreenContainer = ref<HTMLDivElement | null>(null);
const fullscreenScroller = ref<HTMLDivElement | null>(null);
const dialog = ref<HTMLDivElement | null>(null);
const openButton = ref<HTMLButtonElement | null>(null);
const closeButton = ref<HTMLButtonElement | null>(null);
const error = ref<string>("");
const isReady = ref(false);
const isFullscreen = ref(false);
// Une zone qui défile se parcourt au clavier : elle devient alors un arrêt de tabulation NOMMÉ
// (role=region + aria-label, WCAG 4.1.2 — revue L7 r1). Tant qu'elle tient dans son cadre,
// le diagramme garde un seul arrêt, le bouton « Agrandir » (L32).
const inlineScrolls = ref(false);
const fullscreenScrolls = ref(false);
// Le fullscreen est téléporté dans <body> : rendu seulement une fois monté, le serveur
// ne peut pas produire ce que Teleport + Transition attendent à l'hydratation.
const mounted = ref(false);
let svgString = "";
let resizeObserver: ResizeObserver | null = null;

// Nom des zones qui défilent : le titre du schéma (sa légende), sinon un nom générique.
const regionLabel = `Schéma : ${props.caption ?? "architecture"}`;

// Taille rendue minimale du texte d'un schéma (px). En dessous, le schéma garde sa largeur
// et défile dans son cadre plutôt que d'être réduit à la largeur de l'écran (QA 31-10 : 1,6 px).
const MIN_TEXT_PX = 11;

const escapeHtml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sourcePre = (label: string) =>
  `<pre tabindex="0" role="region" aria-label="${label}" class="px-4 py-4 overflow-x-auto text-xs leading-snug font-mono text-ink/80 whitespace-pre">${escapeHtml(props.definition)}</pre>`;
const noscriptHtml = sourcePre("Diagramme (source)");
const errorSourceHtml = sourcePre("Source du schéma");

const scrolls = (el: HTMLElement | null) =>
  !!el && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1);

function measureScroll() {
  inlineScrolls.value = scrolls(inlineContainer.value);
  fullscreenScrolls.value = scrolls(fullscreenScroller.value);
}

// inline : le svg prend la largeur du cadre (hauteur libre).
// fullscreen : il s'ajuste à la largeur ET à la hauteur de la fenêtre (revue L7 r1 : à 1440×900,
// 74 % de la hauteur seulement était visible), sans passer sous MIN_TEXT_PX : au-delà, la zone défile.
function injectInto(el: HTMLDivElement | null, mode: "inline" | "fullscreen" = "inline") {
  if (!el || !svgString) return;
  el.innerHTML = svgString;
  const svg = el.querySelector("svg");
  if (svg) {
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute(
      "style",
      mode === "inline"
        ? "width: 100%; height: auto; display: block; max-width: 100%;"
        : "width: 100%; height: 100%; display: block;",
    );
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    // Plus petit texte en unités du viewBox : la taille plancher du svg en découle.
    const sizes = [...svg.querySelectorAll("text, foreignObject *")]
      .filter((n) => [...n.childNodes].some((c) => c.nodeType === 3 && c.textContent?.trim()))
      .map((n) => parseFloat(getComputedStyle(n).fontSize))
      .filter((px) => px > 0);
    const { width: viewBoxWidth, height: viewBoxHeight } = svg.viewBox.baseVal;
    if (sizes.length && viewBoxWidth) {
      const ratio = MIN_TEXT_PX / Math.min(...sizes);
      svg.style.minWidth = `${Math.ceil(viewBoxWidth * ratio)}px`;
      if (mode === "fullscreen" && viewBoxHeight) {
        svg.style.minHeight = `${Math.ceil(viewBoxHeight * ratio)}px`;
      }
    }
  }
  measureScroll();
}

onMounted(async () => {
  mounted.value = true;
  const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
  try {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      // mermaid 12 passe par défaut à la mise en page ELK et à l'aspect « neo » : on garde
      // dagre + classic, le rendu relu et mesuré des schémas du site (MIN_TEXT_PX, captures).
      layout: "dagre",
      look: "classic",
      theme: "base",
      themeVariables: {
        fontFamily: "'JetBrains Mono', 'ui-monospace', monospace",
        fontSize: "13px",
        background: "transparent",
        primaryColor: "rgba(217, 119, 87, 0.12)",
        secondaryColor: "rgba(255,255,255,0.04)",
        tertiaryColor: "rgba(255,255,255,0.02)",
        primaryBorderColor: "rgba(217, 119, 87, 0.45)",
        secondaryBorderColor: "rgba(255,255,255,0.10)",
        tertiaryBorderColor: "rgba(255,255,255,0.08)",
        primaryTextColor: "#e8e6e3",
        secondaryTextColor: "#a8a29e",
        tertiaryTextColor: "#a8a29e",
        textColor: "#e8e6e3",
        nodeTextColor: "#e8e6e3",
        lineColor: "rgba(217, 119, 87, 0.55)",
        edgeLabelBackground: "rgba(20,20,20,0.85)",
        clusterBkg: "rgba(255,255,255,0.02)",
        clusterBorder: "rgba(217, 119, 87, 0.25)",
      },
      flowchart: {
        curve: "basis",
        padding: 16,
        nodeSpacing: 36,
        rankSpacing: 60,
        useMaxWidth: false,
        htmlLabels: true,
        // mermaid 12 abaisse ce défaut de 200 à 120 px : libellés repliés plus tôt, boîtes plus hautes.
        wrappingWidth: 200,
      },
    });
    const { svg } = await mermaid.render(id, props.definition);
    svgString = svg;
    injectInto(inlineContainer.value);
    isReady.value = true;
    if (typeof ResizeObserver !== "undefined" && inlineContainer.value) {
      resizeObserver = new ResizeObserver(measureScroll);
      resizeObserver.observe(inlineContainer.value);
    }
  } catch (err) {
    // En échec, mermaid laisse en bas de <body> un svg « Syntax error in text » (QA L66) : on le retire,
    // l'erreur reste affichée dans la figure.
    document.getElementById(`d${id}`)?.remove();
    document.getElementById(id)?.remove();
    error.value = (err as Error).message ?? String(err);
    console.error("[MermaidDiagram] render failed:", err);
  }

  window.addEventListener("keydown", onKeydown);
});

// À l'ouverture : schéma injecté dans la fenêtre, focus déplacé dedans (WCAG 2.4.3).
watch(isFullscreen, async (open) => {
  if (!open) return;
  await nextTick();
  injectInto(fullscreenContainer.value, "fullscreen");
  resizeObserver?.observe(fullscreenScroller.value as Element);
  closeButton.value?.focus();
});

function open() {
  if (!isReady.value) return;
  isFullscreen.value = true;
  document.body.style.overflow = "hidden";
}

// À la fermeture, le focus revient à « Agrandir » (WCAG 2.4.3), même si la fenêtre a été
// ouverte d'un clic sur le schéma.
function close() {
  if (fullscreenScroller.value) resizeObserver?.unobserve(fullscreenScroller.value);
  isFullscreen.value = false;
  fullscreenScrolls.value = false;
  document.body.style.overflow = "";
  openButton.value?.focus();
}

const TABBABLE = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function onKeydown(e: KeyboardEvent) {
  if (!isFullscreen.value) return;
  if (e.key === "Escape") {
    e.preventDefault();
    close();
    return;
  }
  // Le focus reste dans la fenêtre modale : Tab et Maj+Tab bouclent sur ses éléments (WCAG 2.4.3, 2.4.11).
  if (e.key === "Tab" && dialog.value) {
    const items = [...dialog.value.querySelectorAll<HTMLElement>(TABBABLE)].filter(
      (n) => n.tabIndex >= 0 && n.offsetParent !== null,
    );
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    const inside = !!active && dialog.value.contains(active);
    if (e.shiftKey && (!inside || active === first)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (!inside || active === last)) {
      e.preventDefault();
      first.focus();
    }
  }
}

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
  resizeObserver?.disconnect();
  document.body.style.overflow = "";
});
</script>

<template>
  <figure
    class="my-6 rounded-lg border border-white/10 bg-paper overflow-hidden"
  >
    <div
      class="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center gap-2"
    >
      <span class="inline-block w-2 h-2 rounded-full bg-claude/70"></span>
      <span
        class="font-mono text-[10px] uppercase tracking-wider text-ink-muted"
      >
        Architecture
      </span>
      <button
        v-if="isReady"
        ref="openButton"
        type="button"
        aria-haspopup="dialog"
        class="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-claude hover:bg-white/5 transition-colors motion-safe:active:scale-95"
        :title="'Afficher en grand'"
        @click="open"
      >
        <Maximize2 :size="12" />
        Agrandir
      </button>
    </div>

    <div
      :class="[
        'relative transition-opacity',
        isReady ? 'cursor-zoom-in' : 'opacity-50',
      ]"
      :title="isReady ? 'Cliquer pour agrandir' : undefined"
      @click="isReady && open()"
    >
      <!-- Anneau de focus en retrait (outline-offset négatif) : la figure en overflow-hidden ne le rogne pas. -->
      <div
        ref="inlineContainer"
        data-mermaid-inline
        :tabindex="inlineScrolls ? 0 : undefined"
        :role="inlineScrolls ? 'region' : undefined"
        :aria-label="inlineScrolls ? regionLabel : undefined"
        class="px-4 py-6 overflow-x-auto min-h-[200px] rounded-b-lg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-claude"
      ></div>
    </div>

    <!-- v-html : le navigateur lit le contenu de <noscript> comme du texte quand JS est actif,
         Vue y attendait un <pre> (mismatch d'hydratation) ; en innerHTML, il ne compare pas l'enfant. -->
    <noscript v-html="noscriptHtml"></noscript>

    <div
      v-if="!isReady && !error"
      class="px-4 py-3 text-xs font-mono text-ink-muted border-t border-white/5"
    >
      Chargement du schéma…
    </div>

    <div
      v-if="error"
      role="alert"
      class="px-4 py-3 text-sm text-rose-300 border-t border-white/5 space-y-2"
    >
      <p>
        Le schéma n'a pas pu s'afficher. Rechargez la page pour réessayer ;
        en attendant, sa source ci-dessous décrit les mêmes liens.
      </p>
      <p class="font-mono text-xs text-ink-muted">Détail technique : {{ error }}</p>
    </div>
    <details v-if="error" class="border-t border-white/5">
      <summary class="px-4 py-2 text-xs font-mono text-ink-muted cursor-pointer">Voir la source du schéma</summary>
      <div v-html="errorSourceHtml"></div>
    </details>

    <figcaption
      v-if="caption"
      class="px-4 py-2 border-t border-white/5 bg-white/[0.02] text-xs text-ink-muted"
    >
      {{ caption }}
    </figcaption>
  </figure>

  <Teleport v-if="mounted" to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isFullscreen"
        ref="dialog"
        class="fixed inset-0 z-50 bg-paper/95 backdrop-blur-md flex flex-col"
        role="dialog"
        aria-modal="true"
        :aria-label="caption ?? 'Schéma d\'architecture'"
      >
        <div
          class="shrink-0 flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]"
        >
          <div class="flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-claude/70"></span>
            <span
              class="font-mono text-[11px] uppercase tracking-wider text-ink-muted"
            >
              Architecture · plein écran
            </span>
          </div>
          <button
            ref="closeButton"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded cursor-pointer text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-claude hover:bg-white/5 transition-colors motion-safe:active:scale-95"
            :title="'Fermer (Esc)'"
            @click="close"
          >
            <X :size="14" />
            Fermer
          </button>
        </div>

        <!-- min-h-0 : la zone prend la hauteur restante de la fenêtre, le svg s'y ajuste (largeur et hauteur). -->
        <div
          ref="fullscreenScroller"
          :tabindex="fullscreenScrolls ? 0 : undefined"
          :role="fullscreenScrolls ? 'region' : undefined"
          :aria-label="fullscreenScrolls ? regionLabel : undefined"
          class="flex-1 min-h-0 flex overflow-auto p-4 sm:p-8 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-claude"
          @click.self="close"
        >
          <div
            ref="fullscreenContainer"
            class="flex-1 min-w-0 min-h-0 max-w-[1600px] mx-auto"
          ></div>
        </div>

        <div
          v-if="caption"
          class="shrink-0 px-5 py-3 border-t border-white/5 bg-white/[0.02] text-xs text-ink-muted text-center"
        >
          {{ caption }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
