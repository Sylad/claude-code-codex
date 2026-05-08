<script setup lang="ts">
import { ref, onMounted } from "vue";

const props = defineProps<{
  definition: string;
  caption?: string;
}>();

const container = ref<HTMLDivElement | null>(null);
const error = ref<string>("");
const isReady = ref(false);

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
        // Backgrounds
        background: "transparent",
        primaryColor: "rgba(217, 119, 87, 0.12)",
        secondaryColor: "rgba(255,255,255,0.04)",
        tertiaryColor: "rgba(255,255,255,0.02)",
        // Borders
        primaryBorderColor: "rgba(217, 119, 87, 0.45)",
        secondaryBorderColor: "rgba(255,255,255,0.10)",
        tertiaryBorderColor: "rgba(255,255,255,0.08)",
        // Text
        primaryTextColor: "#e8e6e3",
        secondaryTextColor: "#a8a29e",
        tertiaryTextColor: "#a8a29e",
        textColor: "#e8e6e3",
        nodeTextColor: "#e8e6e3",
        // Lines
        lineColor: "rgba(217, 119, 87, 0.55)",
        edgeLabelBackground: "rgba(20,20,20,0.85)",
        // Cluster (subgraph)
        clusterBkg: "rgba(255,255,255,0.02)",
        clusterBorder: "rgba(217, 119, 87, 0.25)",
      },
      flowchart: {
        curve: "basis",
        padding: 16,
        nodeSpacing: 36,
        rankSpacing: 60,
        useMaxWidth: true,
        htmlLabels: true,
      },
    });
    const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
    const { svg } = await mermaid.render(id, props.definition);
    if (container.value) {
      container.value.innerHTML = svg;
    }
    isReady.value = true;
  } catch (err) {
    error.value = (err as Error).message ?? String(err);
    console.error("[MermaidDiagram] render failed:", err);
  }
});
</script>

<template>
  <figure class="my-6 rounded-lg border border-white/10 bg-paper overflow-hidden">
    <div
      class="px-4 py-2 border-b border-white/5 bg-white/[0.02] flex items-center gap-2"
    >
      <span class="inline-block w-2 h-2 rounded-full bg-claude/70"></span>
      <span
        class="font-mono text-[10px] uppercase tracking-wider text-ink-muted"
      >
        Architecture
      </span>
    </div>

    <div
      ref="container"
      class="px-4 py-6 overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto"
      :class="{ 'opacity-0': !isReady && !error }"
    ></div>

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
</template>
