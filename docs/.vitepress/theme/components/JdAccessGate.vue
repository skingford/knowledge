<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, withBase } from 'vitepress'

const JD_ROUTE_PREFIX = '/jd/'
const ACCESS_STORAGE_KEY = 'knowledge:jd:access-hash'
const EXPECTED_PASSWORD_HASH = 'dca8f7608b41a08936c583ebd96d4084ac44872de5090aa34fc3b7fc8236e84b'

const route = useRoute()

const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)
const isUnlocked = ref(false)

const isProtectedRoute = computed(() => route.path.startsWith(JD_ROUTE_PREFIX))
const homeHref = computed(() => withBase('/'))

function readStoredAccess() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(ACCESS_STORAGE_KEY) === EXPECTED_PASSWORD_HASH
}

function syncAccess() {
  if (!isProtectedRoute.value) {
    isUnlocked.value = true
    return
  }

  isUnlocked.value = readStoredAccess()
}

async function sha256Hex(value: string) {
  const encoded = new TextEncoder().encode(value)
  const digest = await window.crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function normalizePasswordInput(value: string) {
  return value.trim().normalize('NFKC')
}

async function unlock() {
  if (!isProtectedRoute.value || typeof window === 'undefined') {
    return
  }

  errorMessage.value = ''
  const normalizedPassword = normalizePasswordInput(password.value)

  if (!normalizedPassword) {
    errorMessage.value = '请输入访问密码'
    return
  }

  if (!window.crypto?.subtle) {
    errorMessage.value = '当前浏览器不支持密码校验'
    return
  }

  isSubmitting.value = true

  try {
    const actualHash = await sha256Hex(normalizedPassword)

    if (actualHash !== EXPECTED_PASSWORD_HASH) {
      errorMessage.value = '密码错误'
      return
    }

    window.localStorage.setItem(ACCESS_STORAGE_KEY, EXPECTED_PASSWORD_HASH)
    isUnlocked.value = true
    password.value = ''
  } finally {
    isSubmitting.value = false
  }
}

function lock() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ACCESS_STORAGE_KEY)
  isUnlocked.value = false
  password.value = ''
  errorMessage.value = ''
}

watch(() => route.path, syncAccess, { immediate: true })
</script>

<template>
  <div v-if="!isProtectedRoute">
    <slot />
  </div>

  <div v-else-if="isUnlocked" class="jd-access-gate__unlocked">
    <div class="jd-access-gate__toolbar">
      <span class="jd-access-gate__badge">JD 模块</span>
      <button
        type="button"
        class="jd-access-gate__lock-button"
        @click="lock"
      >
        退出访问
      </button>
    </div>
    <slot />
  </div>

  <div v-else class="jd-access-gate">
    <div class="jd-access-gate__panel">
      <span class="jd-access-gate__eyebrow">Restricted</span>
      <h1 class="jd-access-gate__title">JD 模块已加锁</h1>
      <form class="jd-access-gate__form" @submit.prevent="unlock">
        <label class="jd-access-gate__label" for="jd-password">访问密码</label>
        <input
          id="jd-password"
          v-model="password"
          class="jd-access-gate__input"
          type="password"
          autocomplete="current-password"
          placeholder="请输入密码"
        >

        <p
          v-if="errorMessage"
          class="jd-access-gate__error"
          role="alert"
        >
          {{ errorMessage }}
        </p>

        <div class="jd-access-gate__actions">
          <button
            type="submit"
            class="jd-access-gate__submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? '校验中...' : '进入模块' }}
          </button>
          <a
            class="jd-access-gate__back"
            :href="homeHref"
          >
            返回首页
          </a>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.jd-access-gate {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 32px 20px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--vp-c-brand-1) 18%, transparent), transparent 38%),
    radial-gradient(circle at bottom right, color-mix(in srgb, var(--vp-c-warning-1) 14%, transparent), transparent 34%),
    linear-gradient(180deg, color-mix(in srgb, var(--vp-c-bg-soft) 80%, var(--vp-c-bg)), var(--vp-c-bg));
}

.jd-access-gate__panel {
  width: min(100%, 520px);
  border: 1px solid var(--vp-c-divider);
  border-radius: 24px;
  padding: 28px;
  background: color-mix(in srgb, var(--vp-c-bg) 94%, transparent);
  box-shadow: 0 26px 80px rgba(15, 23, 42, 0.18);
}

.jd-access-gate__eyebrow {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
  background: color-mix(in srgb, var(--vp-c-brand-1) 12%, transparent);
}

.jd-access-gate__title {
  margin: 18px 0 12px;
  font-size: clamp(28px, 4vw, 36px);
  line-height: 1.1;
}

.jd-access-gate__lead,
.jd-access-gate__hint {
  margin: 0;
  color: var(--vp-c-text-2);
  line-height: 1.7;
}

.jd-access-gate__form {
  margin-top: 24px;
}

.jd-access-gate__label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
}

.jd-access-gate__input {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 15px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.jd-access-gate__input:focus {
  outline: 2px solid color-mix(in srgb, var(--vp-c-brand-1) 28%, transparent);
  outline-offset: 2px;
}

.jd-access-gate__error {
  margin: 12px 0 0;
  color: #b42318;
  font-size: 14px;
}

.jd-access-gate__actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
  flex-wrap: wrap;
}

.jd-access-gate__submit,
.jd-access-gate__back,
.jd-access-gate__lock-button {
  appearance: none;
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}

.jd-access-gate__submit {
  background: var(--vp-c-brand-1);
  color: white;
}

.jd-access-gate__submit:disabled {
  opacity: 0.7;
  cursor: progress;
}

.jd-access-gate__back {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}

.jd-access-gate__hint {
  margin-top: 18px;
  font-size: 13px;
}

.jd-access-gate__unlocked {
  min-height: 100vh;
}

.jd-access-gate__toolbar {
  position: sticky;
  top: 76px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: min(100%, 1180px);
  margin: 0 auto;
  padding: 12px 20px 0;
  pointer-events: none;
}

.jd-access-gate__badge,
.jd-access-gate__lock-button {
  pointer-events: auto;
}

.jd-access-gate__badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  background: color-mix(in srgb, var(--vp-c-bg) 82%, transparent);
  border: 1px solid var(--vp-c-divider);
  backdrop-filter: blur(10px);
}

.jd-access-gate__lock-button {
  color: var(--vp-c-text-1);
  background: color-mix(in srgb, var(--vp-c-bg) 82%, transparent);
  border: 1px solid var(--vp-c-divider);
  backdrop-filter: blur(10px);
}

@media (max-width: 640px) {
  .jd-access-gate__panel {
    padding: 22px;
    border-radius: 20px;
  }

  .jd-access-gate__toolbar {
    top: 64px;
    padding: 10px 16px 0;
  }
}
</style>
