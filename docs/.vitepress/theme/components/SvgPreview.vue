<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vitepress'

const MIN_ZOOM = 0.75
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.25
const MIN_PREVIEW_WIDTH = 180
const MIN_PREVIEW_HEIGHT = 96
const MIN_PREVIEW_AREA = 28000
const PAN_OVERFLOW_TOLERANCE = 12

const route = useRoute()

const isOpen = ref(false)
const title = ref('SVG 图例预览')
const zoom = ref(MIN_ZOOM)
const baseWidth = ref(640)
const baseHeight = ref(360)
const previewGraphicHost = ref<HTMLElement | null>(null)
const previewViewport = ref<HTMLElement | null>(null)
const closeButton = ref<HTMLButtonElement | null>(null)
const isDragging = ref(false)
const canPanX = ref(false)
const canPanY = ref(false)

let activeSource: SVGSVGElement | null = null
let activeClone: SVGSVGElement | null = null
let lastTrigger: SVGSVGElement | null = null
let refreshTimer: number | null = null
let domObserver: MutationObserver | null = null
let viewportResizeObserver: ResizeObserver | null = null
let previewSerial = 0
let pointerPan:
  | {
    id: number
    startX: number
    startY: number
    scrollLeft: number
    scrollTop: number
  }
  | null = null

const zoomPercent = computed(() => `${Math.round(zoom.value * 100)}%`)
const canZoomIn = computed(() => zoom.value < MAX_ZOOM)
const canZoomOut = computed(() => zoom.value > MIN_ZOOM)
const isPannable = computed(() => canPanX.value || canPanY.value)

function getFitZoom() {
  if (!previewViewport.value) {
    return 1
  }

  const availableWidth = Math.max(previewViewport.value.clientWidth - 48, 240)
  const availableHeight = Math.max(previewViewport.value.clientHeight - 48, 180)
  const widthZoom = availableWidth / baseWidth.value
  const heightZoom = availableHeight / baseHeight.value

  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(Math.min(widthZoom, heightZoom).toFixed(2))))
}

function getRecommendedOpenZoom() {
  return Math.min(MAX_ZOOM, Math.max(1, getFitZoom()))
}

function parseSvgMetrics(svg: SVGSVGElement) {
  const rect = svg.getBoundingClientRect()
  const viewBox = svg.viewBox?.baseVal
  const widthAttr = Number.parseFloat(svg.getAttribute('width') || '')
  const heightAttr = Number.parseFloat(svg.getAttribute('height') || '')

  const width = Math.max(
    Number.isFinite(viewBox?.width) ? viewBox.width : 0,
    Number.isFinite(widthAttr) ? widthAttr : 0,
    rect.width,
  )
  const height = Math.max(
    Number.isFinite(viewBox?.height) ? viewBox.height : 0,
    Number.isFinite(heightAttr) ? heightAttr : 0,
    rect.height,
  )

  return {
    width: Math.max(1, Math.round(width || 640)),
    height: Math.max(1, Math.round(height || 360)),
    renderedWidth: rect.width,
    renderedHeight: rect.height,
  }
}

function isPreviewableSvg(svg: SVGSVGElement) {
  if (svg.closest('[data-svg-preview-disabled="true"]')) {
    return false
  }

  const metrics = parseSvgMetrics(svg)
  const candidateWidth = Math.max(metrics.width, metrics.renderedWidth)
  const candidateHeight = Math.max(metrics.height, metrics.renderedHeight)
  const candidateArea = metrics.renderedWidth * metrics.renderedHeight

  return (
    (candidateWidth >= MIN_PREVIEW_WIDTH && candidateHeight >= MIN_PREVIEW_HEIGHT)
      || candidateArea >= MIN_PREVIEW_AREA
  )
}

function refreshPreviewableSvgs() {
  const svgs = document.querySelectorAll<SVGSVGElement>('.vp-doc svg')

  svgs.forEach((svg) => {
    if (isPreviewableSvg(svg)) {
      svg.dataset.svgPreviewable = 'true'
      svg.setAttribute('tabindex', svg.getAttribute('tabindex') || '0')
      svg.setAttribute('title', svg.getAttribute('title') || '点击放大预览')
      return
    }

    delete svg.dataset.svgPreviewable
    if (svg.getAttribute('title') === '点击放大预览') {
      svg.removeAttribute('title')
    }
  })
}

function scheduleRefreshPreviewableSvgs() {
  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer)
  }

  refreshTimer = window.setTimeout(() => {
    refreshPreviewableSvgs()
    refreshTimer = null
  }, 60)
}

function resolvePreviewTitle(svg: SVGSVGElement) {
  const ariaLabel = svg.getAttribute('aria-label')?.trim()
  if (ariaLabel) {
    return ariaLabel
  }

  const figureCaption = svg.closest('figure')?.querySelector('figcaption')?.textContent?.trim()
  if (figureCaption) {
    return figureCaption
  }

  const labeledHeading = svg.closest('section')?.querySelector('h2, h3, h4')?.textContent?.trim()
  if (labeledHeading) {
    return `${labeledHeading} 图例`
  }

  return 'SVG 图例预览'
}

function uniquifyCloneIds(svg: SVGSVGElement, prefix: string) {
  const idMap = new Map<string, string>()

  svg.querySelectorAll<HTMLElement>('[id]').forEach((element) => {
    const originalId = element.id
    const nextId = `${prefix}-${originalId}`
    idMap.set(originalId, nextId)
    element.id = nextId
  })

  if (!idMap.size) {
    return
  }

  const urlRefAttributes = [
    'fill',
    'stroke',
    'filter',
    'mask',
    'clip-path',
    'marker-start',
    'marker-mid',
    'marker-end',
  ]
  const hashRefAttributes = ['href', 'xlink:href']
  const idListAttributes = ['aria-labelledby', 'aria-describedby']

  svg.querySelectorAll<HTMLElement>('*').forEach((element) => {
    urlRefAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute)
      if (!value) {
        return
      }

      let nextValue = value
      idMap.forEach((nextId, originalId) => {
        nextValue = nextValue.replaceAll(`url(#${originalId})`, `url(#${nextId})`)
      })

      if (nextValue !== value) {
        element.setAttribute(attribute, nextValue)
      }
    })

    hashRefAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute)
      if (!value) {
        return
      }

      const nextId = idMap.get(value.replace(/^#/, ''))
      if (value.startsWith('#') && nextId) {
        element.setAttribute(attribute, `#${nextId}`)
      }
    })

    idListAttributes.forEach((attribute) => {
      const value = element.getAttribute(attribute)
      if (!value) {
        return
      }

      const nextValue = value
        .split(/\s+/)
        .map((id) => idMap.get(id) ?? id)
        .join(' ')

      if (nextValue !== value) {
        element.setAttribute(attribute, nextValue)
      }
    })
  })
}

function applyCloneScale() {
  if (!activeClone) {
    return
  }

  activeClone.style.width = `${Math.round(baseWidth.value * zoom.value)}px`
  activeClone.style.height = 'auto'
}

function updatePanCapability() {
  if (!previewViewport.value) {
    canPanX.value = false
    canPanY.value = false
    isDragging.value = false
    return
  }

  const horizontalOverflow = previewViewport.value.scrollWidth - previewViewport.value.clientWidth
  const verticalOverflow = previewViewport.value.scrollHeight - previewViewport.value.clientHeight

  canPanX.value = horizontalOverflow > PAN_OVERFLOW_TOLERANCE
  canPanY.value = verticalOverflow > PAN_OVERFLOW_TOLERANCE

  if (!canPanX.value && !canPanY.value) {
    isDragging.value = false
  }
}

function schedulePanCapabilityUpdate() {
  window.requestAnimationFrame(() => {
    updatePanCapability()
  })
}

function centerPreview() {
  if (!previewViewport.value) {
    return
  }

  window.requestAnimationFrame(() => {
    if (!previewViewport.value) {
      return
    }

    const left = Math.max(
      (previewViewport.value.scrollWidth - previewViewport.value.clientWidth) / 2,
      0,
    )
    const top = Math.max(
      (previewViewport.value.scrollHeight - previewViewport.value.clientHeight) / 2,
      0,
    )
    previewViewport.value.scrollTo({ left, top })
  })
}

function captureViewportAnchor() {
  if (!previewViewport.value) {
    return null
  }

  return {
    ratioX: previewViewport.value.scrollWidth <= 0
      ? 0.5
      : (previewViewport.value.scrollLeft + (previewViewport.value.clientWidth / 2)) / previewViewport.value.scrollWidth,
    ratioY: previewViewport.value.scrollHeight <= 0
      ? 0.5
      : (previewViewport.value.scrollTop + (previewViewport.value.clientHeight / 2)) / previewViewport.value.scrollHeight,
  }
}

function restoreViewportAnchor(anchor: { ratioX: number, ratioY: number }) {
  if (!previewViewport.value) {
    return
  }

  window.requestAnimationFrame(() => {
    if (!previewViewport.value) {
      return
    }

    const left = (previewViewport.value.scrollWidth * anchor.ratioX) - (previewViewport.value.clientWidth / 2)
    const top = (previewViewport.value.scrollHeight * anchor.ratioY) - (previewViewport.value.clientHeight / 2)

    previewViewport.value.scrollTo({
      left: Math.max(Math.min(left, previewViewport.value.scrollWidth - previewViewport.value.clientWidth), 0),
      top: Math.max(Math.min(top, previewViewport.value.scrollHeight - previewViewport.value.clientHeight), 0),
    })

    updatePanCapability()
  })
}

function applyZoom(nextZoom: number, options?: { center?: boolean }) {
  const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))))
  if (Math.abs(clampedZoom - zoom.value) < 0.001) {
    if (options?.center) {
      centerPreview()
    }
    return
  }

  const anchor = options?.center ? null : captureViewportAnchor()
  zoom.value = clampedZoom

  if (anchor) {
    restoreViewportAnchor(anchor)
    return
  }

  centerPreview()
}

function renderPreviewClone() {
  if (!previewGraphicHost.value || !activeSource) {
    return
  }

  previewGraphicHost.value.innerHTML = ''
  const clone = activeSource.cloneNode(true) as SVGSVGElement
  previewSerial += 1
  uniquifyCloneIds(clone, `svg-preview-${previewSerial}`)

  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }

  clone.classList.add('svg-preview__graphic')
  clone.removeAttribute('width')
  clone.removeAttribute('height')
  clone.setAttribute('focusable', 'false')

  activeClone = clone
  previewGraphicHost.value.append(clone)
  applyCloneScale()
  schedulePanCapabilityUpdate()
}

async function openPreview(svg: SVGSVGElement) {
  const metrics = parseSvgMetrics(svg)

  activeSource = svg
  lastTrigger = svg
  title.value = resolvePreviewTitle(svg)
  baseWidth.value = Math.max(metrics.width, Math.round(metrics.renderedWidth))
  baseHeight.value = Math.max(metrics.height, Math.round(metrics.renderedHeight))
  isOpen.value = true

  await nextTick()
  renderPreviewClone()
  zoom.value = getRecommendedOpenZoom()
  applyCloneScale()
  centerPreview()
  closeButton.value?.focus()
}

function clearPreview() {
  activeClone = null
  activeSource = null
  pointerPan = null
  isDragging.value = false
  canPanX.value = false
  canPanY.value = false

  if (previewGraphicHost.value) {
    previewGraphicHost.value.innerHTML = ''
  }
}

function closePreview() {
  if (!isOpen.value) {
    return
  }

  isOpen.value = false
  clearPreview()
  lastTrigger?.focus()
}

function setZoom(nextZoom: number) {
  applyZoom(nextZoom)
}

function stepZoom(direction: 1 | -1) {
  applyZoom(zoom.value + direction * ZOOM_STEP)
}

function resetZoom() {
  applyZoom(getFitZoom(), { center: true })
}

function toggleZoomPreset() {
  const fitZoom = getFitZoom()

  if (Math.abs(zoom.value - fitZoom) < 0.08) {
    applyZoom(Math.min(MAX_ZOOM, Math.max(1.9, fitZoom + 0.5)))
  } else {
    applyZoom(fitZoom, { center: true })
  }
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Element)) {
    return
  }

  if (target.closest('[data-svg-preview-ignore="true"]')) {
    return
  }

  const svg = target.closest<SVGSVGElement>('svg[data-svg-previewable="true"]')
  if (!svg || !target.closest('.vp-doc')) {
    return
  }

  event.preventDefault()
  openPreview(svg)
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (isOpen.value) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closePreview()
      return
    }

    if ((event.key === '+' || event.key === '=') && !event.metaKey && !event.ctrlKey) {
      event.preventDefault()
      stepZoom(1)
      return
    }

    if (event.key === '-' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault()
      stepZoom(-1)
      return
    }

    if (event.key === '0' && !event.metaKey && !event.ctrlKey) {
      event.preventDefault()
      resetZoom()
    }

    return
  }

  const target = event.target
  if (!(target instanceof Element)) {
    return
  }

  const svg = target.closest<SVGSVGElement>('svg[data-svg-previewable="true"]')
  if (!svg) {
    return
  }

  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    openPreview(svg)
  }
}

function handlePointerDown(event: PointerEvent) {
  if (!previewViewport.value) {
    return
  }

  if (!isPannable.value) {
    return
  }

  if (event.pointerType === 'mouse' && event.button !== 0) {
    return
  }

  pointerPan = {
    id: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: previewViewport.value.scrollLeft,
    scrollTop: previewViewport.value.scrollTop,
  }

  isDragging.value = true
  previewViewport.value.setPointerCapture(event.pointerId)
  event.preventDefault()
}

function handlePointerMove(event: PointerEvent) {
  if (!pointerPan || !previewViewport.value || pointerPan.id !== event.pointerId) {
    return
  }

  if (canPanX.value) {
    previewViewport.value.scrollLeft = pointerPan.scrollLeft - (event.clientX - pointerPan.startX)
  }

  if (canPanY.value) {
    previewViewport.value.scrollTop = pointerPan.scrollTop - (event.clientY - pointerPan.startY)
  }
}

function handlePointerEnd(event: PointerEvent) {
  if (!pointerPan || !previewViewport.value || pointerPan.id !== event.pointerId) {
    return
  }

  previewViewport.value.releasePointerCapture(event.pointerId)
  pointerPan = null
  isDragging.value = false
}

function handleViewportWheel(event: WheelEvent) {
  if (!event.ctrlKey && !event.metaKey) {
    return
  }

  event.preventDefault()
  stepZoom(event.deltaY < 0 ? 1 : -1)
}

function handleDragStart(event: DragEvent) {
  event.preventDefault()
}

watch(zoom, () => {
  applyCloneScale()
  schedulePanCapabilityUpdate()
})

watch(
  () => previewViewport.value,
  (viewport, previousViewport) => {
    if (previousViewport) {
      viewportResizeObserver?.unobserve(previousViewport)
    }

    if (viewport) {
      viewportResizeObserver?.observe(viewport)
      schedulePanCapabilityUpdate()
    }
  },
)

watch(
  () => route.path,
  () => {
    closePreview()
    nextTick(() => {
      scheduleRefreshPreviewableSvgs()
    })
  },
)

watch(isOpen, (open) => {
  document.documentElement.classList.toggle('svg-preview-open', open)
  document.body.classList.toggle('svg-preview-open', open)
})

onMounted(() => {
  refreshPreviewableSvgs()
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleDocumentKeydown)

  domObserver = new MutationObserver(() => {
    scheduleRefreshPreviewableSvgs()
  })
  domObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })

  viewportResizeObserver = new ResizeObserver(() => {
    schedulePanCapabilityUpdate()
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleDocumentKeydown)
  domObserver?.disconnect()
  viewportResizeObserver?.disconnect()

  if (refreshTimer !== null) {
    window.clearTimeout(refreshTimer)
  }

  document.documentElement.classList.remove('svg-preview-open')
  document.body.classList.remove('svg-preview-open')
  clearPreview()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="svg-preview-fade">
      <div
        v-if="isOpen"
        class="svg-preview"
        data-svg-preview-ignore="true"
      >
        <button
          class="svg-preview__scrim"
          type="button"
          aria-label="关闭 SVG 预览"
          @click="closePreview"
        />

        <section class="svg-preview__panel" aria-modal="true" role="dialog">
          <div class="svg-preview__meta">
            <p class="svg-preview__eyebrow">SVG 预览</p>
            <h2 class="svg-preview__title">{{ title }}</h2>
            <p class="svg-preview__meta-tip">双击切换缩放，桌面端支持 Ctrl / Command + 滚轮缩放</p>
          </div>

          <div class="svg-preview__actions">
            <div class="svg-preview__actions-group">
              <button
                class="svg-preview__action"
                type="button"
                :disabled="!canZoomOut"
                aria-label="缩小"
                @click="stepZoom(-1)"
              >
                −
              </button>
              <button
                class="svg-preview__action svg-preview__action--ghost"
                type="button"
                @click="resetZoom"
              >
                适应
              </button>
              <span class="svg-preview__zoom-chip">{{ zoomPercent }}</span>
              <button
                class="svg-preview__action"
                type="button"
                :disabled="!canZoomIn"
                aria-label="放大"
                @click="stepZoom(1)"
              >
                +
              </button>
            </div>
            <div class="svg-preview__actions-group">
              <button
                ref="closeButton"
                class="svg-preview__action svg-preview__action--close"
                type="button"
                aria-label="关闭预览"
                @click="closePreview"
              >
                ×
              </button>
            </div>
          </div>

          <div
            ref="previewViewport"
            class="svg-preview__viewport"
            :class="{
              'svg-preview__viewport--dragging': isDragging,
              'svg-preview__viewport--pannable': isPannable,
            }"
            @dblclick="toggleZoomPreset"
            @dragstart="handleDragStart"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerEnd"
            @pointercancel="handlePointerEnd"
            @wheel="handleViewportWheel"
          >
            <div
              class="svg-preview__canvas"
            >
              <div
                class="svg-preview__stage"
              >
                <div
                  ref="previewGraphicHost"
                  class="svg-preview__graphic-host"
                />
              </div>
            </div>
          </div>

          <p class="svg-preview__hint">
            移动端可滑动查看细节。
          </p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
:global(html.svg-preview-open),
:global(body.svg-preview-open) {
  overflow: hidden;
  overscroll-behavior: none;
}

:global(.vp-doc svg[data-svg-previewable="true"]) {
  cursor: zoom-in;
  transition:
    transform 0.18s ease,
    filter 0.18s ease,
    box-shadow 0.18s ease;
}

:global(.vp-doc svg[data-svg-previewable="true"]:hover),
:global(.vp-doc svg[data-svg-previewable="true"]:focus-visible) {
  filter: drop-shadow(0 10px 20px rgba(28, 24, 21, 0.12));
  transform: translateY(-2px);
  outline: none;
}

.svg-preview {
  position: fixed;
  inset: 0;
  z-index: 160;
  display: grid;
  place-items: center;
  padding: 24px;
}

.svg-preview__scrim {
  position: absolute;
  inset: 0;
  border: 0;
  background:
    radial-gradient(circle at center, rgba(29, 52, 81, 0.16), transparent 24%),
    radial-gradient(circle at center, rgba(8, 11, 18, 0.42), rgba(5, 7, 12, 0.92) 72%, rgba(3, 5, 10, 0.97));
  backdrop-filter: blur(22px) saturate(0.58);
}

.svg-preview__panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(1280px, calc(100vw - 48px));
  height: min(860px, calc(100vh - 48px));
  max-height: min(920px, calc(100vh - 48px));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  background:
    radial-gradient(circle at top center, rgba(90, 138, 205, 0.12), transparent 34%),
    linear-gradient(180deg, rgba(15, 19, 28, 0.96), rgba(8, 11, 18, 0.98));
  box-shadow:
    0 52px 140px rgba(0, 0, 0, 0.52),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  overflow: hidden;
  isolation: isolate;
}

.svg-preview__meta,
.svg-preview__actions {
  position: absolute;
  z-index: 2;
  backdrop-filter: blur(22px) saturate(1.05);
}

.svg-preview__meta {
  top: 18px;
  left: 18px;
  max-width: min(520px, calc(100% - 190px));
  padding: 14px 16px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 22px;
  background: rgba(9, 13, 21, 0.74);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.svg-preview__eyebrow {
  margin: 0 0 2px;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(158, 191, 233, 0.88);
}

.svg-preview__title {
  margin: 0;
  font-size: 16px;
  line-height: 1.35;
  color: rgba(248, 250, 252, 0.96);
}

.svg-preview__meta-tip {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: rgba(203, 213, 225, 0.72);
}

.svg-preview__actions {
  top: 18px;
  right: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.svg-preview__actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 999px;
  background: rgba(9, 13, 21, 0.74);
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.svg-preview__action {
  min-width: 42px;
  height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(248, 250, 252, 0.94);
  font-size: 14px;
  font-weight: 600;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.svg-preview__action:hover:not(:disabled),
.svg-preview__action:focus-visible {
  border-color: rgba(158, 191, 233, 0.32);
  background: rgba(93, 138, 201, 0.18);
  transform: translateY(-1px);
  outline: none;
}

.svg-preview__action:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.svg-preview__action--ghost {
  min-width: 64px;
}

.svg-preview__action--close {
  min-width: 42px;
  font-size: 22px;
  line-height: 1;
}

.svg-preview__zoom-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  height: 40px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(226, 232, 240, 0.86);
  font-size: 13px;
  font-weight: 600;
}

.svg-preview__viewport {
  flex: 1;
  position: relative;
  overflow: auto;
  padding: 92px 24px 24px;
  cursor: default;
  overscroll-behavior: contain;
  touch-action: none;
  background:
    radial-gradient(circle at center, rgba(126, 169, 230, 0.12), transparent 28%),
    radial-gradient(circle at center, rgba(255, 255, 255, 0.05), transparent 46%),
    linear-gradient(180deg, rgba(8, 11, 18, 0.98), rgba(4, 7, 12, 1));
}

.svg-preview__viewport--pannable {
  cursor: grab;
}

.svg-preview__viewport--pannable:active,
.svg-preview__viewport--dragging {
  cursor: grabbing;
}

.svg-preview__viewport::before {
  content: '';
  position: absolute;
  inset: 20px 20px 18px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.015), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.svg-preview__canvas {
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 100%;
  min-height: 100%;
  padding: clamp(12px, 1.5vw, 24px);
}

.svg-preview__stage {
  position: relative;
  flex: none;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: clamp(18px, 2vw, 30px);
  border: 1px solid rgba(255, 255, 255, 0.68);
  border-radius: 30px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 252, 0.98));
  box-shadow:
    0 40px 120px rgba(0, 0, 0, 0.34),
    0 10px 28px rgba(16, 24, 40, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.svg-preview__stage::before {
  content: '';
  position: absolute;
  inset: -28px;
  z-index: -1;
  background: radial-gradient(circle at center, rgba(123, 165, 224, 0.18), transparent 68%);
  filter: blur(18px);
  pointer-events: none;
}

.svg-preview__graphic-host {
  flex: none;
  position: relative;
  z-index: 1;
  user-select: none;
}

.svg-preview__canvas :deep(.svg-preview__graphic) {
  display: block;
  max-width: none !important;
  height: auto !important;
  background: transparent;
  filter: drop-shadow(0 12px 28px rgba(15, 23, 42, 0.08));
  user-select: none;
  -webkit-user-drag: none;
}

.svg-preview__hint {
  display: none;
}

.svg-preview-fade-enter-active,
.svg-preview-fade-leave-active {
  transition: opacity 0.2s ease;
}

.svg-preview-fade-enter-from,
.svg-preview-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .svg-preview {
    padding: 0;
  }

  .svg-preview__panel {
    width: 100vw;
    max-height: 100dvh;
    height: 100dvh;
    border-radius: 0;
    border: 0;
  }

  .svg-preview__meta {
    top: 12px;
    left: 12px;
    right: 12px;
    max-width: none;
    padding: 12px;
    border-radius: 18px;
  }

  .svg-preview__actions {
    left: 12px;
    right: 12px;
    top: auto;
    bottom: calc(env(safe-area-inset-bottom) + 12px);
    justify-content: center;
  }

  .svg-preview__actions-group {
    width: 100%;
    justify-content: center;
    padding: 8px;
  }

  .svg-preview__meta-tip {
    display: none;
  }

  .svg-preview__action {
    min-width: 44px;
    flex: 0 1 auto;
  }

  .svg-preview__zoom-chip {
    min-width: 0;
  }

  .svg-preview__viewport {
    padding: 88px 16px 88px;
  }

  .svg-preview__viewport::before {
    inset: 16px 12px 12px;
    border-radius: 24px;
  }

  .svg-preview__stage {
    padding: 14px;
    border-radius: 22px;
  }

  .svg-preview__hint {
    display: block;
    margin: 0;
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: calc(env(safe-area-inset-bottom) + 70px);
    z-index: 2;
    padding: 0;
    font-size: 12px;
    color: rgba(226, 232, 240, 0.72);
    text-align: center;
    text-shadow: 0 2px 16px rgba(3, 6, 10, 0.72);
  }
}
</style>
