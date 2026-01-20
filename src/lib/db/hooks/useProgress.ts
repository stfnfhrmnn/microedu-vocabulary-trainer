'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db, getOrCreateProgress, updateProgress } from '../db'
import type { LearningProgress } from '../schema'

export function useProgress(vocabularyId: string | undefined) {
  const progress = useLiveQuery(
    () =>
      vocabularyId
        ? db.learningProgress.where('vocabularyId').equals(vocabularyId).first()
        : undefined,
    [vocabularyId]
  )

  return {
    progress,
    isLoading: vocabularyId ? progress === undefined : false,
    getOrCreateProgress: () =>
      vocabularyId ? getOrCreateProgress(vocabularyId) : Promise.reject('No vocabulary ID'),
    updateProgress: (data: Partial<LearningProgress>) =>
      progress ? updateProgress(progress.id, data) : Promise.resolve(),
  }
}

export function useReviewSessions(limit = 10) {
  const sessions = useLiveQuery(
    () =>
      db.reviewSessions
        .orderBy('startedAt')
        .reverse()
        .limit(limit)
        .toArray(),
    [limit]
  )

  return {
    sessions: sessions ?? [],
    isLoading: sessions === undefined,
  }
}

export function useTodayReviewCount() {
  const count = useLiveQuery(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sessions = await db.reviewSessions
      .where('startedAt')
      .above(today)
      .toArray()

    return sessions.reduce((sum, s) => sum + s.totalItems, 0)
  }, [])

  return count ?? 0
}
