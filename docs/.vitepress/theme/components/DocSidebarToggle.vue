<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const STORAGE_KEY = 'knowledge:doc-sidebar-collapsed'
const ROOT_HAS_SIDEBAR_CLASS = 'has-doc-sidebar-toggle'
const ROOT_COLLAPSED_CLASS = 'doc-sidebar-collapsed'
const DESKTOP_MEDIA_QUERY = '(min-width: 960px)'

const route = useRoute()
const { frontmatter, page } = useData()

const isDesktop = ref(false)
const hasSidebar = ref(false)
const isCollapsed = ref(false)

let mediaQueryList: MediaQueryList | null = null

function isDocPage() {
  const layout = frontmatter.value?.layout
  return !page.value.isNotFound && (!layout || layout === 'doc')
}

function applyRootClasses() {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const canToggle = isDesktop.value && hasSidebar.value

  root.classList.toggle(ROOT_HAS_SIDEBAR_CLASS, canToggle)
  root.classList.toggle(ROOT_COLLAPSED_CLASS, canToggle && isCollapsed.value)
}

function readCollapsedState() {
  if (typeof window === 'undefined') {
    return
  }

  isCollapsed.value = window.localStorage.getItem(STORAGE_KEY) === 'true'
}

function persistCollapsedState() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, String(isCollapsed.value))
}

async function syncVisibility() {
  if (typeof window === 'undefined') {
    return
  }

  isDesktop.value = window.matchMedia(DESKTOP_MEDIA_QUERY).matches

  if (!isDesktop.value || !isDocPage()) {
    hasSidebar.value = false
    applyRootClasses()
    return
  }

  await nextTick()
  hasSidebar.value = document.querySelector('.VPSidebar') !== null
  applyRootClasses()
}

function handleMediaChange() {
  void syncVisibility()
}

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
  persistCollapsedState()
  applyRootClasses()
}

onMounted(() => {
  readCollapsedState()
  mediaQueryList = window.matchMedia(DESKTOP_MEDIA_QUERY)

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', handleMediaChange)
  } else {
    mediaQueryList.addListener(handleMediaChange)
  }

  void syncVisibility()
})

watch(() => route.path, syncVisibility)
watch(() => frontmatter.value?.layout, syncVisibility)

onBeforeUnmount(() => {
  if (mediaQueryList) {
    if (typeof mediaQueryList.removeEventListener === 'function') {
      mediaQueryList.removeEventListener('change', handleMediaChange)
    } else {
      mediaQueryList.removeListener(handleMediaChange)
    }
  }

  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove(ROOT_HAS_SIDEBAR_CLASS, ROOT_COLLAPSED_CLASS)
  }
})
</script>

<template>
  <button
    v-if="isDesktop && hasSidebar"
    class="doc-sidebar-toggle"
    type="button"
    :aria-pressed="isCollapsed"
    :aria-label="isCollapsed ? '展开侧边栏' : '收起侧边栏'"
    @click="toggleSidebar"
  >
    <span class="doc-sidebar-toggle__icon" aria-hidden="true">
      {{ isCollapsed ? '›' : '‹' }}
    </span>
    <span class="doc-sidebar-toggle__text">
      {{ isCollapsed ? '展开目录' : '收起目录' }}
    </span>
  </button>
</template>
