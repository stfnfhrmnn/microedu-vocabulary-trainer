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

export function useWeeklyActivity() {
  const data = useLiveQuery(async () => {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)

    const sessions = await db.reviewSessions
      .where('startedAt')
      .above(weekAgo)
      .toArray()

    // Group by date
    const byDate: Record<string, number> = {}

    sessions.forEach((session) => {
      const date = new Date(session.startedAt).toISOString().split('T')[0]
      byDate[date] = (byDate[date] || 0) + session.totalItems
    })

    // Convert to array format
    return Object.entries(byDate).map(([date, count]) => ({
      date,
      count,
    }))
  }, [])

  return data ?? []
}
