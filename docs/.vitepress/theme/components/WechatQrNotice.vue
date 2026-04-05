<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

const storageKey = 'knowledge:wechat-qr-notice:dismiss-until'
const isVisible = ref(false)

const qrImage = computed(() => withBase('/wechat-official-account-qr.jpg'))

function getEndOfDayTimestamp() {
  const now = new Date()
  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)
  return endOfDay.getTime()
}

function persistDismissUntilEndOfDay() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(storageKey, String(getEndOfDayTimestamp()))
}

function closeNotice() {
  isVisible.value = false
  persistDismissUntilEndOfDay()
}

function continueBrowsing() {
  closeNotice()
}

function shouldShowNotice() {
  if (typeof window === 'undefined') {
    return false
  }

  const dismissedUntil = Number(window.localStorage.getItem(storageKey) || '0')

  if (!dismissedUntil || Number.isNaN(dismissedUntil)) {
    return true
  }

  if (Date.now() > dismissedUntil) {
    window.localStorage.removeItem(storageKey)
    return true
  }

  return false
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  isVisible.value = shouldShowNotice()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="wechat-qr-notice">
      <div v-if="isVisible" class="wechat-qr-notice" aria-live="polite">
        <div class="wechat-qr-notice__scrim" @click="closeNotice" />
        <aside
          class="wechat-qr-notice__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wechat-qr-notice-title"
        >
          <header class="wechat-qr-notice__header">
            <div class="wechat-qr-notice__header-copy">
              <span class="wechat-qr-notice__badge">公告</span>
              <h2 id="wechat-qr-notice-title" class="wechat-qr-notice__title">关注公众号</h2>
            </div>
            <button
              type="button"
              class="wechat-qr-notice__close"
              aria-label="关闭公众号二维码提示"
              @click="closeNotice"
            >
              ×
            </button>
          </header>

          <div class="wechat-qr-notice__body">
            <p class="wechat-qr-notice__lead">扫码关注公众号，后续更新和专题整理会优先同步。</p>

            <figure class="wechat-qr-notice__figure">
              <img
                class="wechat-qr-notice__image"
                :src="qrImage"
                alt="公众号二维码"
                width="320"
                height="320"
              >
            </figure>

        

            <div class="wechat-qr-notice__actions">
              <button
                type="button"
                class="wechat-qr-notice__action wechat-qr-notice__action--primary"
                @click="continueBrowsing"
              >
                继续浏览
              </button>
            </div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>
