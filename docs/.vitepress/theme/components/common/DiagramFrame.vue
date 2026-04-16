<script setup lang="ts">
withDefaults(defineProps<{
  maxWidth: string
  fontFamily?: string
}>(), {
  fontFamily: 'system-ui, sans-serif',
})
</script>

<template>
  <div class="diagram-wrap">
    <div class="diagram-inner" :style="{ maxWidth, fontFamily }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.diagram-wrap {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.diagram-inner {
  width: 100%;
}

:slotted(svg) {
  display: block;
  width: 100%;
  height: auto;
}
</style>
