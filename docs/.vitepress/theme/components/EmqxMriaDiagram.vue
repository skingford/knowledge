<script setup lang="ts">
import DiagramFrame from '@docs-components/DiagramFrame.vue'
</script>

<template>
  <DiagramFrame max-width="800px">
    <svg
      viewBox="0 0 760 300"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Mnesia 与 Mria 拓扑对比图"
      role="img"
    >
      <defs>
        <marker id="mria-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <path d="M0,0 L10,5 L0,10 Z" fill="var(--d-arrow)" />
        </marker>
      </defs>

      <!-- Left: Mnesia (Old) -->
      <text x="170" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">Mnesia（旧）</text>
      <text x="170" y="48" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">N² Full Mesh</text>

      <!-- Mnesia outer box -->
      <rect x="40" y="60" width="260" height="220" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />

      <!-- 4 nodes in a square -->
      <circle cx="120" cy="120" r="28" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="120" y="124" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">N1</text>

      <circle cx="220" cy="120" r="28" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="220" y="124" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">N2</text>

      <circle cx="120" cy="220" r="28" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="120" y="224" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">N3</text>

      <circle cx="220" cy="220" r="28" fill="var(--d-rv-c-bg)" stroke="var(--d-rv-c-border)" stroke-width="1.4" />
      <text x="220" y="224" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">N4</text>

      <!-- Full mesh connections (6 edges) -->
      <line x1="148" y1="120" x2="192" y2="120" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <line x1="120" y1="148" x2="120" y2="192" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <line x1="220" y1="148" x2="220" y2="192" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <line x1="148" y1="220" x2="192" y2="220" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <line x1="140" y1="140" x2="200" y2="200" stroke="var(--d-rv-c-border)" stroke-width="1.2" />
      <line x1="200" y1="140" x2="140" y2="200" stroke="var(--d-rv-c-border)" stroke-width="1.2" />

      <!-- Arrow in the middle -->
      <line x1="320" y1="170" x2="400" y2="170" stroke="var(--d-arrow)" stroke-width="2" marker-end="url(#mria-arrow)" />
      <text x="360" y="158" text-anchor="middle" font-size="11" font-weight="600" fill="var(--d-text)">演进</text>

      <!-- Right: Mria (New) -->
      <text x="570" y="28" text-anchor="middle" font-size="14" font-weight="700" fill="var(--d-text)">Mria（新）</text>
      <text x="570" y="48" text-anchor="middle" font-size="10" fill="var(--d-text-sub)">Mesh + Star Hybrid</text>

      <!-- Mria outer box -->
      <rect x="420" y="60" width="320" height="220" rx="16" fill="var(--vp-c-bg-elv)" stroke="var(--d-rv-a-border)" stroke-width="1.4" />

      <!-- Core nodes (top row, mesh) -->
      <circle cx="490" cy="116" r="26" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="490" y="112" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Core</text>
      <text x="490" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">1</text>

      <circle cx="580" cy="116" r="26" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="580" y="112" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Core</text>
      <text x="580" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">2</text>

      <circle cx="670" cy="116" r="26" fill="var(--d-blue-bg)" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <text x="670" y="112" text-anchor="middle" font-size="10" font-weight="600" fill="var(--d-text)">Core</text>
      <text x="670" y="126" text-anchor="middle" font-size="9" fill="var(--d-text-sub)">3</text>

      <!-- Core mesh lines -->
      <line x1="516" y1="116" x2="554" y2="116" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="606" y1="116" x2="644" y2="116" stroke="var(--d-blue-border)" stroke-width="1.4" />
      <line x1="508" y1="136" x2="652" y2="136" stroke="var(--d-blue-border)" stroke-width="1" stroke-dasharray="4,3" />

      <!-- Core label -->
      <text x="580" y="80" text-anchor="middle" font-size="9" fill="var(--d-blue-border)" font-weight="600">Full Mesh</text>

      <!-- Replicant nodes (bottom row, star) -->
      <rect x="450" y="206" width="54" height="28" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="477" y="224" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Rep 1</text>

      <rect x="520" y="206" width="54" height="28" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="547" y="224" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Rep 2</text>

      <rect x="590" y="206" width="54" height="28" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="617" y="224" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Rep 3</text>

      <rect x="660" y="206" width="54" height="28" rx="10" fill="var(--d-rv-a-bg)" stroke="var(--d-rv-a-border)" stroke-width="1.2" />
      <text x="687" y="224" text-anchor="middle" font-size="9" font-weight="600" fill="var(--d-text)">Rep N</text>

      <!-- Star connections (Core → Replicants) -->
      <line x1="490" y1="142" x2="477" y2="206" stroke="var(--d-rv-a-border)" stroke-width="1.2" stroke-dasharray="4,2" marker-end="url(#mria-arrow)" />
      <line x1="490" y1="142" x2="547" y2="206" stroke="var(--d-rv-a-border)" stroke-width="1.2" stroke-dasharray="4,2" marker-end="url(#mria-arrow)" />
      <line x1="580" y1="142" x2="617" y2="206" stroke="var(--d-rv-a-border)" stroke-width="1.2" stroke-dasharray="4,2" marker-end="url(#mria-arrow)" />
      <line x1="670" y1="142" x2="687" y2="206" stroke="var(--d-rv-a-border)" stroke-width="1.2" stroke-dasharray="4,2" marker-end="url(#mria-arrow)" />

      <!-- RLOG label -->
      <text x="580" y="186" text-anchor="middle" font-size="9" fill="var(--d-rv-a-border)" font-weight="600">async RLOG replication</text>

      <!-- Replicant label -->
      <text x="580" y="258" text-anchor="middle" font-size="9" fill="var(--d-rv-a-border)" font-weight="600">Star Topology</text>
    </svg>
  </DiagramFrame>
</template>
