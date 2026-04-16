<script setup lang="ts">
import { onMounted, ref, useTemplateRef, watch } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  src: string
  alt?: string
}>()

const container = useTemplateRef<HTMLDivElement>('container')
const loaded = ref(false)

function sanitizeSvg(raw: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(raw, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg) return ''

  // Remove potentially dangerous elements
  const dangerous = svg.querySelectorAll('script, foreignObject, set, animate[attributeName="href"]')
  dangerous.forEach(el => el.remove())

  // Remove event handler attributes from all elements
  svg.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name)
      }
    })
  })

  const serializer = new XMLSerializer()
  return serializer.serializeToString(svg)
}

async function loadSvg() {
  if (!container.value) return
  try {
    const response = await fetch(withBase(props.src))
    if (!response.ok) return
    const raw = await response.text()
    const safe = sanitizeSvg(raw)
    if (!safe) return

    // Use safe DOM insertion via DOMParser
    const parser = new DOMParser()
    const doc = parser.parseFromString(safe, 'image/svg+xml')
    const svg = doc.querySelector('svg')
    if (!svg) return

    svg.style.maxWidth = '100%'
    svg.style.height = 'auto'
    if (props.alt) {
      svg.setAttribute('aria-label', props.alt)
    }

    container.value.replaceChildren(container.value.ownerDocument.importNode(svg, true))
    loaded.value = true
  } catch {
    const p = document.createElement('p')
    p.style.color = 'var(--vp-c-danger-1)'
    p.textContent = 'SVG 加载失败'
    container.value.replaceChildren(p)
  }
}

onMounted(loadSvg)
watch(() => props.src, loadSvg)
</script>

<template>
  <div ref="container" class="inline-svg-container" :class="{ loaded }" />
</template>

<style scoped>
.inline-svg-container {
  width: 100%;
  overflow-x: auto;
}

.inline-svg-container :deep(svg) {
  display: block;
  margin: 0 auto;
}
</style>
