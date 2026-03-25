<template>
  <div
    v-html="svg"
    :class="props.class"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useData } from 'vitepress'
import type { MermaidConfig } from 'mermaid'

const defaultConfig: MermaidConfig = {
  securityLevel: 'loose',
  startOnLoad: false,
}

const props = withDefaults(defineProps<{
  graph: string
  id: string
  class?: string
}>(), {
  class: 'mermaid',
})

const { frontmatter } = useData()
const svg = ref<string | null>(null)

let observer: MutationObserver | null = null
let mermaidModulePromise: Promise<typeof import('mermaid')> | null = null

function loadMermaid() {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import('mermaid')
  }

  return mermaidModulePromise
}

async function renderChart() {
  const mermaidModule = await loadMermaid()
  const mermaid = mermaidModule.default
  const mermaidConfig: MermaidConfig = {
    ...defaultConfig,
  }

  if (frontmatter.value?.mermaidTheme) {
    mermaidConfig.theme = frontmatter.value.mermaidTheme
  }

  if (document.documentElement.classList.contains('dark')) {
    mermaidConfig.theme = 'dark'
  }

  mermaid.initialize(mermaidConfig)
  const { svg: svgCode } = await mermaid.render(props.id, decodeURIComponent(props.graph))
  const salt = Math.random().toString(36).slice(2, 9)
  svg.value = `${svgCode} <span style="display: none">${salt}</span>`
}

onMounted(async () => {
  observer = new MutationObserver(async () => {
    await renderChart()
  })
  observer.observe(document.documentElement, { attributes: true })

  await renderChart()

  const hasImages = /<img([\w\W]+?)>/.test(decodeURIComponent(props.graph))
  if (!hasImages) {
    return
  }

  setTimeout(() => {
    const imageElements = Array.from(document.getElementsByTagName('img'))

    if (!imageElements.length) {
      return
    }

    Promise.all(
      imageElements
        .filter((image) => !image.complete)
        .map((image) => new Promise((resolve) => {
          image.onload = image.onerror = resolve
        })),
    ).then(async () => {
      await renderChart()
    })
  }, 100)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>
