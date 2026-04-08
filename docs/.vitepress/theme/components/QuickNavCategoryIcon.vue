<script setup lang="ts">
type CategoryIconName =
  | "talk"
  | "code"
  | "research"
  | "skill"
  | "workflow"
  | "guide"
  | "design"
  | "audio"
  | "tools"
  | "ranking";

defineProps<{
  name: CategoryIconName;
}>();
</script>

<template>
  <svg v-if="name === 'talk'" class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.5 5.5h11A2.5 2.5 0 0 1 20 8v6a2.5 2.5 0 0 1-2.5 2.5H11l-4 3v-3H6.5A2.5 2.5 0 0 1 4 14V8a2.5 2.5 0 0 1 2.5-2.5Z" />
    <path d="M8.75 10.25h6.5" />
    <path d="M8.75 13h4.25" />
  </svg>

  <svg v-else-if="name === 'code'" class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.5 8 5 12l3.5 4" />
    <path d="M15.5 8 19 12l-3.5 4" />
    <path d="M13 6 11 18" />
    <path d="M4.5 19.5h15" />
  </svg>

  <svg v-else-if="name === 'research'" class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="5" />
    <path d="m15 15 4 4" />
    <path d="M18 6V3" />
    <path d="M16.5 4.5h3" />
  </svg>

  <svg v-else-if="name === 'skill'" class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 3.5 16.5 6 12 8.5 7.5 6 12 3.5Z" />
    <path d="M7.5 6v8" />
    <path d="M16.5 6v8" />
    <path d="M12 8.5v8" />
    <path d="M7.5 10 12 12.5 16.5 10" />
    <path d="M7.5 14 12 16.5 16.5 14" />
  </svg>

  <svg v-else-if="name === 'workflow'" class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="8" cy="6" r="2" />
    <circle cx="16" cy="12" r="2" />
    <circle cx="8" cy="18" r="2" />
    <path d="M8 8v8" />
    <path d="M10 12h4" />
  </svg>

  <svg v-else-if="name === 'guide'" class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.5 5h9a2.5 2.5 0 0 1 2.5 2.5v11h-8.5A3.5 3.5 0 0 0 6 20.2V7.5A2.5 2.5 0 0 1 8.5 5Z" />
    <path d="M6 18.5c.55-.82 1.5-1.5 3.5-1.5H18" />
    <path d="M9 9h5.5" />
    <path d="M9 12h4" />
  </svg>

  <svg v-else-if="name === 'design'" class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="4" y="5" width="16" height="14" rx="2.5" />
    <path d="M4 10.5h16" />
    <path d="M10 10.5V19" />
    <path d="m14 8 3 3" />
  </svg>

  <svg v-else-if="name === 'audio'" class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 13v-2" />
    <path d="M8 16V8" />
    <path d="M11 19V5" />
    <path d="M14 15V9" />
    <path d="M17 18V6" />
    <path d="M20 13v-2" />
  </svg>

  <svg v-else-if="name === 'tools'" class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 7V5.75A1.75 1.75 0 0 1 10.75 4h2.5A1.75 1.75 0 0 1 15 5.75V7" />
    <path d="M4.5 9.5h15V17a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V9.5Z" />
    <path d="M4.5 12h15" />
    <path d="M10 12v2h4v-2" />
  </svg>

  <svg v-else class="quick-nav-category-icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 18.5h14" />
    <path d="M7.5 16v-3.5" />
    <path d="M12 16V9.5" />
    <path d="M16.5 16v-7" />
    <path d="M7.5 8.5 11 5.5 13.75 8 18 4.5" />
    <path d="M18 7.5v-3h-3" />
  </svg>
</template>

<style scoped>
.quick-nav-category-icon {
  width: 100%;
  height: 100%;
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.quick-nav-category-icon * {
  vector-effect: non-scaling-stroke;
}
</style>
