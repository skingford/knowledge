<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData, useRoute } from 'vitepress'

const STORAGE_KEY = 'knowledge:doc-sidebar-collapsed'
const ROOT_HAS_SIDEBAR_CLASS = 'has-doc-sidebar-toggle'
const ROOT_COLLAPSED_CLASS = 'doc-sidebar-collapsed'
const ROOT_ASIDE_OPEN_CLASS = 'doc-aside-open'
const DESKTOP_MEDIA_QUERY = '(min-width: 960px)'

const route = useRoute()
const { frontmatter, page } = useData()

const isDesktop = ref(false)
const hasSidebar = ref(false)
const hasAside = ref(false)
const isCollapsed = ref(false)
const isAsideOpen = ref(false)

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
  const canOpenAside = canToggle && isCollapsed.value && hasAside.value

  root.classList.toggle(ROOT_HAS_SIDEBAR_CLASS, canToggle)
  root.classList.toggle(ROOT_COLLAPSED_CLASS, canToggle && isCollapsed.value)
  root.classList.toggle(ROOT_ASIDE_OPEN_CLASS, canOpenAside && isAsideOpen.value)
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
    hasAside.value = false
    isAsideOpen.value = false
    applyRootClasses()
    return
  }

  await nextTick()
  hasSidebar.value = document.querySelector('.VPSidebar') !== null
  hasAside.value = document.querySelector('.VPDoc .aside') !== null

  if (!isCollapsed.value || !hasAside.value) {
    isAsideOpen.value = false
  }

  applyRootClasses()
}

function handleMediaChange() {
  void syncVisibility()
}

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value

  if (!isCollapsed.value) {
    isAsideOpen.value = false
  }

  persistCollapsedState()
  applyRootClasses()
}

function toggleAside() {
  isAsideOpen.value = !isAsideOpen.value
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

watch(() => route.path, () => {
  isAsideOpen.value = false
  void syncVisibility()
})

watch(() => frontmatter.value?.layout, () => {
  isAsideOpen.value = false
  void syncVisibility()
})

onBeforeUnmount(() => {
  if (mediaQueryList) {
    if (typeof mediaQueryList.removeEventListener === 'function') {
      mediaQueryList.removeEventListener('change', handleMediaChange)
    } else {
      mediaQueryList.removeListener(handleMediaChange)
    }
  }

  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove(
      ROOT_HAS_SIDEBAR_CLASS,
      ROOT_COLLAPSED_CLASS,
      ROOT_ASIDE_OPEN_CLASS,
    )
  }
})
</script>

<template>
  <template v-if="isDesktop && hasSidebar">
    <button
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

    <button
      v-if="isCollapsed && hasAside"
      class="doc-aside-toggle"
      type="button"
      :aria-pressed="isAsideOpen"
      :aria-label="isAsideOpen ? '收起页面导航' : '展开页面导航'"
      @click="toggleAside"
    >
      <span class="doc-sidebar-toggle__text">
        {{ isAsideOpen ? '收起导航' : '页面导航' }}
      </span>
      <span class="doc-sidebar-toggle__icon" aria-hidden="true">
        {{ isAsideOpen ? '›' : '‹' }}
      </span>
    </button>
  </template>
</template>
