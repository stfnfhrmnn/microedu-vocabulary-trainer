'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import {
  db,
  createVocabularyItem,
  createVocabularyItems,
  updateVocabularyItem,
  deleteVocabularyItem,
} from '../db'
import type { CreateVocabularyItem, VocabularyWithProgress } from '../schema'

export function useVocabulary(sectionId: string | undefined) {
  const vocabulary = useLiveQuery(
    () =>
      sectionId
        ? db.vocabularyItems.where('sectionId').equals(sectionId).toArray()
        : [],
    [sectionId]
  )

  return {
    vocabulary: vocabulary ?? [],
    isLoading: sectionId ? vocabulary === undefined : false,
    createVocabularyItem,
    createVocabularyItems,
    updateVocabularyItem,
    deleteVocabularyItem,
  }
}

export function useVocabularyByChapter(chapterId: string | undefined) {
  const vocabulary = useLiveQuery(
    () =>
      chapterId
        ? db.vocabularyItems.where('chapterId').equals(chapterId).toArray()
        : [],
    [chapterId]
  )

  return {
    vocabulary: vocabulary ?? [],
    isLoading: chapterId ? vocabulary === undefined : false,
  }
}

export function useVocabularyByBook(bookId: string | undefined) {
  const vocabulary = useLiveQuery(
    () =>
      bookId
        ? db.vocabularyItems.where('bookId').equals(bookId).toArray()
        : [],
    [bookId]
  )

  return {
    vocabulary: vocabulary ?? [],
    isLoading: bookId ? vocabulary === undefined : false,
  }
}

export function useVocabularyWithProgress(
  sectionIds: string[]
): { vocabulary: VocabularyWithProgress[]; isLoading: boolean } {
  const result = useLiveQuery(async () => {
    if (sectionIds.length === 0) return []

    const vocab = await db.vocabularyItems
      .where('sectionId')
      .anyOf(sectionIds)
      .toArray()

    const vocabIds = vocab.map((v) => v.id)
    const progressItems = await db.learningProgress
      .where('vocabularyId')
      .anyOf(vocabIds)
      .toArray()

    const progressMap = new Map(progressItems.map((p) => [p.vocabularyId, p]))

    return vocab.map((v) => ({
      ...v,
      progress: progressMap.get(v.id),
    }))
  }, [sectionIds.join(',')])

  return {
    vocabulary: result ?? [],
    isLoading: result === undefined,
  }
}

export function useVocabularyCount() {
  const count = useLiveQuery(() => db.vocabularyItems.count(), [])
  return count ?? 0
}

export function useSectionVocabularyCount(sectionId: string | undefined) {
  const count = useLiveQuery(
    () =>
      sectionId
        ? db.vocabularyItems.where('sectionId').equals(sectionId).count()
        : 0,
    [sectionId]
  )
  return count ?? 0
}
