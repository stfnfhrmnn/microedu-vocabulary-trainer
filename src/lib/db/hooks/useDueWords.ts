'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db, getVocabularyStats } from '../db'
import type { VocabularyWithProgress, VocabularyStats } from '../schema'

export function useDueWords(sectionIds?: string[]): {
  dueWords: VocabularyWithProgress[]
  isLoading: boolean
} {
  const result = useLiveQuery(async () => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // Get all vocabulary items (optionally filtered by sections)
    let vocab
    if (sectionIds && sectionIds.length > 0) {
      vocab = await db.vocabularyItems
        .where('sectionId')
        .anyOf(sectionIds)
        .toArray()
    } else {
      vocab = await db.vocabularyItems.toArray()
    }

    // Get learning progress for all vocabulary
    const vocabIds = vocab.map((v) => v.id)
    const progressItems = await db.learningProgress
      .where('vocabularyId')
      .anyOf(vocabIds)
      .toArray()

    const progressMap = new Map(progressItems.map((p) => [p.vocabularyId, p]))

    // Filter to due items (no progress = new = due, or nextReviewDate <= today)
    const dueWords: VocabularyWithProgress[] = vocab
      .map((v) => ({
        ...v,
        progress: progressMap.get(v.id),
      }))
      .filter((v) => {
        if (!v.progress) return true // New words are due
        return v.progress.nextReviewDate <= today
      })

    // Sort: new words first, then by nextReviewDate
    dueWords.sort((a, b) => {
      if (!a.progress && !b.progress) return 0
      if (!a.progress) return -1
      if (!b.progress) return 1
      return a.progress.nextReviewDate.getTime() - b.progress.nextReviewDate.getTime()
    })

    return dueWords
  }, [sectionIds?.join(',')])

  return {
    dueWords: result ?? [],
    isLoading: result === undefined,
  }
}

export function useDueWordsCount(): number {
  const count = useLiveQuery(async () => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)

    const allVocab = await db.vocabularyItems.toArray()
    const vocabIds = allVocab.map((v) => v.id)
    const progressItems = await db.learningProgress
      .where('vocabularyId')
      .anyOf(vocabIds)
      .toArray()

    const progressMap = new Map(progressItems.map((p) => [p.vocabularyId, p]))

    let dueCount = 0
    for (const vocab of allVocab) {
      const progress = progressMap.get(vocab.id)
      if (!progress || progress.nextReviewDate <= today) {
        dueCount++
      }
    }

    return dueCount
  }, [])

  return count ?? 0
}

export function useVocabularyStats(): {
  stats: VocabularyStats | null
  isLoading: boolean
} {
  const stats = useLiveQuery(() => getVocabularyStats(), [])

  return {
    stats: stats ?? null,
    isLoading: stats === undefined,
  }
}
