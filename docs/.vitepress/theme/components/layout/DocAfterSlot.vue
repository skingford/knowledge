<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import VocabularyCard from '@docs-components/common/VocabularyCard.vue'
import { resolveVocabularyItems } from '@docs-vocabulary'

const { frontmatter } = useData()
const vocabularyItems = computed(() => resolveVocabularyItems(frontmatter.value?.vocabulary))
</script>

<template>
  <VocabularyCard
    v-if="vocabularyItems.length"
    :items="vocabularyItems"
  />
</template>
