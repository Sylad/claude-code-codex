<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { Maximize2, X } from "lucide-vue-next";

const props = defineProps<{
  definition: string;
  caption?: string;
}>();

const inlineContainer = ref<HTMLDivElement | null>(null);
const fullscreenContainer = ref<HTMLDivElement | null>(null);
const error = ref<string>("");
const isReady = ref(false);
const isFullscreen = ref(false);
let svgString = "";

function injectInto(el: HTMLDivElement | null) {
  if (!el || !svgString) return;
  el.innerHTML = svgString;
  // Force the SVG to scale to its container width.
  const svg = el.querySelector("svg");
  if (svg) {
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute(
      "style",
      "width: 100%; height: auto; display: block; max-width: 100%;",
    );
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  }
}

onMounted(async () => {
  try {
    const { default: mermaid } = await import("mermaid");
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
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
      },
    });
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    const { svg } = await mermaid.render(id, props.definition);
    svgString = svg;
    injectInto(inlineContainer.value);
    isReady.value = true;
  } catch (err) {
    error.value = (err as Error).message ?? String(err);
    console.error("[MermaidDiagram] render failed:", err);
  }

  window.addEventListener("keydown", onKeydown);
});

// When fullscreen toggles on, inject into the modal container after it mounts.
watch(isFullscreen, (open) => {
  if (open) {
    requestAnimationFrame(() => injectInto(fullscreenContainer.value));
  }
});

function open() {
  if (!isReady.value) return;
  isFullscreen.value = true;
  document.body.style.overflow = "hidden";
}

function close() {
  isFullscreen.value = false;
  document.body.style.overflow = "";
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && isFullscreen.value) close();
}

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
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
        type="button"
        class="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono uppercase tracking-wider text-ink-muted hover:text-claude hover:bg-white/5 transition-colors motion-safe:active:scale-95"
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
      :role="isReady ? 'button' : undefined"
      :tabindex="isReady ? 0 : -1"
      :title="isReady ? 'Cliquer pour agrandir' : undefined"
      @click="isReady && open()"
      @keydown.enter.prevent="isReady && open()"
      @keydown.space.prevent="isReady && open()"
    >
      <div
        ref="inlineContainer"
        class="px-4 py-6 overflow-x-auto min-h-[200px]"
      ></div>
    </div>

    <noscript>
      <pre
        class="px-4 py-4 overflow-x-auto text-xs leading-snug font-mono text-ink/80 whitespace-pre">{{ definition }}</pre>
    </noscript>

    <div
      v-if="!isReady && !error"
      class="px-4 py-3 text-xs font-mono text-ink-muted border-t border-white/5"
    >
      Loading diagram…
    </div>

    <div
      v-if="error"
      class="px-4 py-3 text-xs font-mono text-rose-400 border-t border-white/5"
    >
      Mermaid render failed: {{ error }}
    </div>

    <figcaption
      v-if="caption"
      class="px-4 py-2 border-t border-white/5 bg-white/[0.02] text-xs text-ink-muted"
    >
      {{ caption }}
    </figcaption>
  </figure>

  <Teleport to="body">
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
        class="fixed inset-0 z-50 bg-paper/95 backdrop-blur-md flex flex-col"
        role="dialog"
        aria-modal="true"
        :aria-label="caption ?? 'Diagramme architecture'"
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
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-claude hover:bg-white/5 transition-colors motion-safe:active:scale-95"
            :title="'Fermer (Esc)'"
            @click="close"
          >
            <X :size="14" />
            Fermer
          </button>
        </div>

        <div
          class="flex-1 overflow-auto p-4 sm:p-8"
          @click.self="close"
        >
          <div
            ref="fullscreenContainer"
            class="w-full max-w-[1600px] mx-auto"
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
