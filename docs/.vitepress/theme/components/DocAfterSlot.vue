<script setup lang="ts">
import { useData } from 'vitepress'
import VocabularyCard from './VocabularyCard.vue'

const { frontmatter } = useData()
</script>

<template>
  <VocabularyCard
    v-if="frontmatter?.vocabulary?.length"
    :items="frontmatter.vocabulary"
  />
</template>
