<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface VocabItem {
  word: string
  meaning: string
  phonetic?: string
  phoneticUs?: string
  phoneticUk?: string
  phoneticSource?: string
  phoneticSourceUrl?: string
}

type VoiceGender = 'male' | 'female' | 'unknown'

interface VoiceEntry {
  voice: SpeechSynthesisVoice
  gender: VoiceGender
}

interface SpeechSettings {
  voiceName: string
  rate: number
  pitch: number
  genderFilter: 'all' | 'male' | 'female'
  phoneticVariant: 'us' | 'uk'
}

const SETTINGS_KEY = 'vocab-speech-settings'
const DEFAULT_VOICE = 'Nicky'
const DEFAULT_SETTINGS: SpeechSettings = {
  voiceName: DEFAULT_VOICE,
  rate: 0.85,
  pitch: 1.0,
  genderFilter: 'all',
  phoneticVariant: 'us',
}

const FEMALE_PATTERNS = /\b(samantha|victoria|karen|moira|fiona|tessa|veena|ting-ting|mei-jia|sin-ji|kate|zira|hazel|susan|linda|catherine|allison|ava|nicky|siri.*female|google.*female|female|woman|girl)\b/i
const MALE_PATTERNS = /\b(daniel|alex|tom|fred|ralph|albert|junior|aaron|rishi|jorge|thomas|james|david|mark|siri.*male|google.*male|male|man|boy)\b/i

const props = defineProps<{ items: VocabItem[] }>()

const speakingWord = ref('')
const showSettings = ref(false)
const voiceEntries = ref<VoiceEntry[]>([])
const speechSettings = ref<SpeechSettings>({ ...DEFAULT_SETTINGS })

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) Object.assign(speechSettings.value, JSON.parse(saved))
  } catch {}
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(speechSettings.value))
}

function guessGender(voice: SpeechSynthesisVoice): VoiceGender {
  const name = voice.name
  if (FEMALE_PATTERNS.test(name)) return 'female'
  if (MALE_PATTERNS.test(name)) return 'male'
  return 'unknown'
}

function loadVoices() {
  const voices = window.speechSynthesis?.getVoices() || []
  voiceEntries.value = voices
    .filter((v) => v.lang.startsWith('en'))
    .map((v) => ({ voice: v, gender: guessGender(v) }))
}

function filteredVoices(): VoiceEntry[] {
  const filter = speechSettings.value.genderFilter
  if (filter === 'all') return voiceEntries.value
  return voiceEntries.value.filter((e) => e.gender === filter)
}

function genderLabel(g: VoiceGender): string {
  if (g === 'female') return '♀'
  if (g === 'male') return '♂'
  return ''
}

function onSettingChange() {
  saveSettings()
}

function previewVoice() {
  speak('Hello, this is a test', true)
}

onMounted(() => {
  loadSettings()

  if (window.speechSynthesis) {
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
})

function getPhonetic(item: VocabItem) {
  if (speechSettings.value.phoneticVariant === 'uk') {
    return (
      item.phoneticUk ||
      item.phoneticUs ||
      item.phonetic ||
      ''
    )
  }
  return (
    item.phoneticUs ||
    item.phoneticUk ||
    item.phonetic ||
    ''
  )
}

function findVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  if (speechSettings.value.voiceName) {
    const match = voices.find((v) => v.name === speechSettings.value.voiceName)
    if (match) return match
  }
  return (
    voices.find((v) => v.lang === 'en-US' && v.default) ||
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => v.lang.startsWith('en'))
  )
}

function speak(word: string, isPreview = false) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  const voice = findVoice()
  if (voice) utterance.voice = voice
  utterance.rate = speechSettings.value.rate
  utterance.pitch = speechSettings.value.pitch
  if (!isPreview) {
    speakingWord.value = word
    utterance.onend = () => (speakingWord.value = '')
    utterance.onerror = () => (speakingWord.value = '')
  }
  window.speechSynthesis.speak(utterance)
}
</script>

<template>
  <section v-if="items?.length" class="vocab-card">
    <h3 class="vocab-title">
      <span class="vocab-icon">📖</span> 词汇速记
      <button class="vocab-settings-btn" :class="{ active: showSettings }" title="发音设置" @click="showSettings = !showSettings">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </h3>
    <div v-if="showSettings" class="vocab-settings-panel">
      <div class="vocab-setting-row">
        <label class="vocab-setting-label">音标偏好</label>
        <div class="vocab-gender-filter">
          <button
            class="vocab-gender-btn"
            :class="{ active: speechSettings.phoneticVariant === 'us' }"
            @click="speechSettings.phoneticVariant = 'us'; onSettingChange()"
          >美式</button>
          <button
            class="vocab-gender-btn"
            :class="{ active: speechSettings.phoneticVariant === 'uk' }"
            @click="speechSettings.phoneticVariant = 'uk'; onSettingChange()"
          >英式</button>
        </div>
      </div>
      <div class="vocab-setting-row">
        <label class="vocab-setting-label">发音人声</label>
        <div class="vocab-gender-filter">
          <button
            v-for="opt in ([['all', '全部'], ['male', '♂ 男声'], ['female', '♀ 女声']] as const)"
            :key="opt[0]"
            class="vocab-gender-btn"
            :class="{ active: speechSettings.genderFilter === opt[0] }"
            @click="speechSettings.genderFilter = opt[0]; onSettingChange()"
          >{{ opt[1] }}</button>
        </div>
        <select v-model="speechSettings.voiceName" class="vocab-setting-select" @change="onSettingChange">
          <option value="">默认</option>
          <option v-for="e in filteredVoices()" :key="e.voice.name" :value="e.voice.name">
            {{ genderLabel(e.gender) }} {{ e.voice.name }} ({{ e.voice.lang }})
          </option>
        </select>
      </div>
      <div class="vocab-setting-row">
        <label class="vocab-setting-label">语速 <span class="vocab-setting-value">{{ speechSettings.rate.toFixed(2) }}</span></label>
        <input type="range" v-model.number="speechSettings.rate" min="0.5" max="1.5" step="0.05" class="vocab-setting-range" @input="onSettingChange" />
      </div>
      <div class="vocab-setting-row">
        <label class="vocab-setting-label">音调 <span class="vocab-setting-value">{{ speechSettings.pitch.toFixed(2) }}</span></label>
        <input type="range" v-model.number="speechSettings.pitch" min="0.5" max="2.0" step="0.1" class="vocab-setting-range" @input="onSettingChange" />
      </div>
      <button class="vocab-preview-btn" @click="previewVoice">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        试听
      </button>
    </div>
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
