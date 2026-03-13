<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface VocabItem {
  word: string
  meaning: string
  phonetic?: string
}

const props = defineProps<{ items: VocabItem[] }>()

const phonetics = ref<Record<string, string>>({})
const speakingWord = ref('')

onMounted(() => {
  const missing = props.items.filter(
    (item) => !item.phonetic && !phonetics.value[item.word],
  )
  if (!missing.length) return

  const cacheKey = 'vocab-phonetics'
  const cached = JSON.parse(localStorage.getItem(cacheKey) || '{}')

  const toFetch: VocabItem[] = []
  for (const item of missing) {
    if (cached[item.word]) {
      phonetics.value[item.word] = cached[item.word]
    } else {
      toFetch.push(item)
    }
  }

  for (const item of toFetch) {
    fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(item.word)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        const p = data?.[0]?.phonetic || data?.[0]?.phonetics?.find((ph: any) => ph.text)?.text
        if (p) {
          phonetics.value[item.word] = p
          cached[item.word] = p
          localStorage.setItem(cacheKey, JSON.stringify(cached))
        }
      })
      .catch(() => {})
  }
})

function getPhonetic(item: VocabItem) {
  return item.phonetic || phonetics.value[item.word] || ''
}

function speak(word: string) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.85
  speakingWord.value = word
  utterance.onend = () => (speakingWord.value = '')
  utterance.onerror = () => (speakingWord.value = '')
  window.speechSynthesis.speak(utterance)
}
</script>

<template>
  <section v-if="items?.length" class="vocab-card">
    <h3 class="vocab-title">
      <span class="vocab-icon">📖</span> 词汇速记
    </h3>
    <div class="vocab-grid">
      <div v-for="item in items" :key="item.word" class="vocab-item">
        <div class="vocab-word-row">
          <span class="vocab-word">{{ item.word }}</span>
          <button
            class="vocab-speak"
            :class="{ speaking: speakingWord === item.word }"
            :title="`朗读 ${item.word}`"
            @click="speak(item.word)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        </div>
        <span v-if="getPhonetic(item)" class="vocab-phonetic">{{ getPhonetic(item) }}</span>
        <span class="vocab-meaning">{{ item.meaning }}</span>
      </div>
    </div>
  </section>
</template>
