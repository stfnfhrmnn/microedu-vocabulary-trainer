'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db/db'
import {
  getDailyStudyStats,
  getWeeklyTrends,
  getDifficultyHeatmap,
  getStudyTimeDistribution,
  getOverallStats,
  checkMilestones,
  type DailyStudyStats,
  type WeeklyTrend,
  type DifficultyHeatmapEntry,
  type StudyTimeDistribution,
  type OverallStats,
  type LearningMilestone,
} from '@/lib/services/analytics'

// ============================================================================
// Daily Stats Hook
// ============================================================================

export function useDailyStudyStats(days = 30) {
  const [stats, setStats] = useState<DailyStudyStats[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        const data = await getDailyStudyStats(startDate, endDate)
        setStats(data)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [days])

  const summary = useMemo(() => {
    if (stats.length === 0) {
      return {
        totalSessions: 0,
        totalWordsReviewed: 0,
        averageAccuracy: 0,
        totalStudyTimeMinutes: 0,
        activeDays: 0,
      }
    }

    const totalSessions = stats.reduce((sum, s) => sum + s.sessionsCount, 0)
    const totalWordsReviewed = stats.reduce((sum, s) => sum + s.wordsReviewed, 0)
    const totalCorrect = stats.reduce((sum, s) => sum + s.wordsCorrect, 0)
    const totalStudyTime = stats.reduce((sum, s) => sum + s.studyTimeMinutes, 0)
    const activeDays = stats.filter(s => s.sessionsCount > 0).length

    return {
      totalSessions,
      totalWordsReviewed,
      averageAccuracy: totalWordsReviewed > 0 ? totalCorrect / totalWordsReviewed : 0,
      totalStudyTimeMinutes: Math.round(totalStudyTime),
      activeDays,
    }
  }, [stats])

  return {
    stats,
    summary,
    isLoading,
  }
}

// ============================================================================
// Weekly Trends Hook
// ============================================================================

export function useWeeklyTrends(weeks = 8) {
  const [trends, setTrends] = useState<WeeklyTrend[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const data = await getWeeklyTrends(weeks)
        setTrends(data)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [weeks])

  // Calculate trend direction
  const trendDirection = useMemo(() => {
    if (trends.length < 2) return 'stable' as const

    const recent = trends.slice(-2)
    const olderAccuracy = recent[0].averageAccuracy
    const newerAccuracy = recent[1].averageAccuracy

    if (newerAccuracy > olderAccuracy + 0.05) return 'improving' as const
    if (newerAccuracy < olderAccuracy - 0.05) return 'declining' as const
    return 'stable' as const
  }, [trends])

  return {
    trends,
    trendDirection,
    isLoading,
  }
}

// ============================================================================
// Difficulty Heatmap Hook
// ============================================================================

export function useDifficultyHeatmap(limit?: number) {
  const [entries, setEntries] = useState<DifficultyHeatmapEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const data = await getDifficultyHeatmap()
        setEntries(limit ? data.slice(0, limit) : data)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [limit])

  const summary = useMemo(() => {
    const counts = {
      easy: entries.filter(e => e.difficulty === 'easy').length,
      medium: entries.filter(e => e.difficulty === 'medium').length,
      hard: entries.filter(e => e.difficulty === 'hard').length,
      veryHard: entries.filter(e => e.difficulty === 'very_hard').length,
    }

    const improving = entries.filter(e => e.trend === 'improving').length
    const declining = entries.filter(e => e.trend === 'declining').length

    return { counts, improving, declining }
  }, [entries])

  return {
    entries,
    summary,
    isLoading,
  }
}

// ============================================================================
// Study Time Distribution Hook
// ============================================================================

export function useStudyTimeDistribution(days = 30) {
  const [distribution, setDistribution] = useState<StudyTimeDistribution[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const data = await getStudyTimeDistribution(days)
        setDistribution(data)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [days])

  const peakHour = useMemo(() => {
    if (distribution.length === 0) return null
    return distribution.reduce((max, d) =>
      d.minutesStudied > max.minutesStudied ? d : max
    )
  }, [distribution])

  const bestPerformanceHour = useMemo(() => {
    if (distribution.length === 0) return null
    const withActivity = distribution.filter(d => d.sessionsCount > 0)
    if (withActivity.length === 0) return null
    return withActivity.reduce((max, d) =>
      d.averageAccuracy > max.averageAccuracy ? d : max
    )
  }, [distribution])

  return {
    distribution,
    peakHour,
    bestPerformanceHour,
    isLoading,
  }
}

// ============================================================================
// Overall Stats Hook
// ============================================================================

export function useOverallStats() {
  const [stats, setStats] = useState<OverallStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Use live query to react to database changes
  const sessionCount = useLiveQuery(() => db.reviewSessions.count(), [], 0)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const data = await getOverallStats()
        setStats(data)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [sessionCount]) // Reload when session count changes

  return {
    stats,
    isLoading,
  }
}

// ============================================================================
// Milestones Hook
// ============================================================================

export function useMilestones() {
  const [milestones, setMilestones] = useState<LearningMilestone[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // React to vocabulary changes
  const vocabCount = useLiveQuery(() => db.vocabularyItems.count(), [], 0)

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const data = await checkMilestones()
        setMilestones(data)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [vocabCount])

  const latestMilestone = useMemo(() => {
    if (milestones.length === 0) return null
    return milestones.reduce((latest, m) =>
      m.achievedAt > latest.achievedAt ? m : latest
    )
  }, [milestones])

  return {
    milestones,
    latestMilestone,
    isLoading,
  }
}
