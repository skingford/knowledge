import dictionaryData from './vocabulary-dictionary.json'

export interface VocabularyItem {
  word: string
  meaning: string
  phoneticUs: string
  phoneticUk?: string
  phoneticSource: string
  phoneticSourceUrl?: string
}

export type VocabularyDictionary = Record<string, VocabularyItem>

export const vocabularyDictionary = dictionaryData as VocabularyDictionary

type VocabularyRef = string | { ref: string } | (Partial<VocabularyItem> & { ref?: string })

export function resolveVocabularyItems(items: VocabularyRef[] | undefined): VocabularyItem[] {
  if (!Array.isArray(items)) return []

  return items.flatMap((item) => {
    if (typeof item === 'string') {
      const resolved = vocabularyDictionary[item]
      return resolved ? [resolved] : []
    }

    if (item && typeof item === 'object' && typeof item.ref === 'string') {
      const base = vocabularyDictionary[item.ref]
      if (!base) return []
      return [{ ...base, ...item }]
    }

    if (item && typeof item === 'object' && typeof item.word === 'string') {
      return [item as VocabularyItem]
    }

    return []
  })
}
