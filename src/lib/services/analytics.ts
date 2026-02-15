/**
 * Analytics Service
 *
 * Provides insights into learning patterns:
 * - Study time tracking
 * - Difficulty analysis
 * - Learning trends
 */

import { db } from '@/lib/db/db'
import { getMasteryLevel } from '@/lib/learning/sm2'
import type { ReviewAttempt, VocabularyItem } from '@/lib/db/schema'

// ============================================================================
// Types
// ============================================================================

export interface DailyStudyStats {
  date: Date
  dateString: string // YYYY-MM-DD
  sessionsCount: number
  wordsReviewed: number
  wordsCorrect: number
  accuracy: number
  studyTimeMinutes: number
  newWordsLearned: number
}

export interface WeeklyTrend {
  weekStart: Date
  weekEnd: Date
  totalSessions: number
  totalWordsReviewed: number
  averageAccuracy: number
  totalStudyTimeMinutes: number
  wordsProgressedToMastery: number
}

export interface DifficultyHeatmapEntry {
  vocabulary: VocabularyItem
  accuracy: number
  totalAttempts: number
  lastReviewed: Date | null
  difficulty: 'easy' | 'medium' | 'hard' | 'very_hard'
  trend: 'improving' | 'stable' | 'declining'
}

export interface StudyTimeDistribution {
  hour: number
  minutesStudied: number
  sessionsCount: number
  averageAccuracy: number
}

export interface LearningMilestone {
  type: 'first_word' | 'words_10' | 'words_50' | 'words_100' | 'words_500' | 'week_streak' | 'month_streak' | 'mastery_25' | 'mastery_50' | 'mastery_75' | 'mastery_100'
  achievedAt: Date
  value?: number
}

// ============================================================================
// Study Time Tracking
// ============================================================================

/**
 * Get daily study statistics for a date range
 */
export async function getDailyStudyStats(
  startDate: Date,
  endDate: Date
): Promise<DailyStudyStats[]> {
  const sessions = await db.reviewSessions
    .where('startedAt')
    .between(startDate, endDate, true, true)
    .toArray()

  // Group sessions by date
  const statsByDate = new Map<string, DailyStudyStats>()

  for (const session of sessions) {
    const dateKey = session.startedAt.toISOString().split('T')[0]

    let stats = statsByDate.get(dateKey)
    if (!stats) {
      stats = {
        date: new Date(dateKey),
        dateString: dateKey,
        sessionsCount: 0,
        wordsReviewed: 0,
        wordsCorrect: 0,
        accuracy: 0,
        studyTimeMinutes: 0,
        newWordsLearned: 0,
      }
      statsByDate.set(dateKey, stats)
    }

    stats.sessionsCount++
    stats.wordsReviewed += session.totalItems
    stats.wordsCorrect += session.correctCount

    // Calculate study time from session duration
    if (session.completedAt) {
      const duration = session.completedAt.getTime() - session.startedAt.getTime()
      stats.studyTimeMinutes += duration / 60000
    }
  }

  // Calculate accuracy for each day
  const results: DailyStudyStats[] = []
  statsByDate.forEach((stats) => {
    stats.accuracy = stats.wordsReviewed > 0
      ? stats.wordsCorrect / stats.wordsReviewed
      : 0
    results.push(stats)
  })

  // Sort by date
  results.sort((a, b) => a.date.getTime() - b.date.getTime())

  return results
}

/**
 * Get study time distribution by hour of day
 */
export async function getStudyTimeDistribution(days = 30): Promise<StudyTimeDistribution[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const sessions = await db.reviewSessions
    .where('startedAt')
    .above(startDate)
    .toArray()

  const hourStats = new Map<number, {
    minutes: number
    sessions: number
    correct: number
    total: number
  }>()

  // Initialize all hours
  for (let h = 0; h < 24; h++) {
    hourStats.set(h, { minutes: 0, sessions: 0, correct: 0, total: 0 })
  }

  for (const session of sessions) {
    const hour = session.startedAt.getHours()
    const stats = hourStats.get(hour)!

    stats.sessions++
    stats.correct += session.correctCount
    stats.total += session.totalItems

    if (session.completedAt) {
      const duration = session.completedAt.getTime() - session.startedAt.getTime()
      stats.minutes += duration / 60000
    }
  }

  const results: StudyTimeDistribution[] = []
  hourStats.forEach((stats, hour) => {
    results.push({
      hour,
      minutesStudied: Math.round(stats.minutes),
      sessionsCount: stats.sessions,
      averageAccuracy: stats.total > 0 ? stats.correct / stats.total : 0,
    })
  })

  return results.sort((a, b) => a.hour - b.hour)
}

// ============================================================================
// Learning Trends
// ============================================================================

/**
 * Get weekly learning trends
 */
export async function getWeeklyTrends(weeks = 8): Promise<WeeklyTrend[]> {
  const trends: WeeklyTrend[] = []

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date()
    weekEnd.setDate(weekEnd.getDate() - (i * 7))
    weekEnd.setHours(23, 59, 59, 999)

    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)

    const sessions = await db.reviewSessions
      .where('startedAt')
      .between(weekStart, weekEnd, true, true)
      .toArray()

    const totalSessions = sessions.length
    const totalWordsReviewed = sessions.reduce((sum, s) => sum + s.totalItems, 0)
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctCount, 0)

    let totalStudyTime = 0
    for (const session of sessions) {
      if (session.completedAt) {
        totalStudyTime += (session.completedAt.getTime() - session.startedAt.getTime()) / 60000
      }
    }

    trends.push({
      weekStart,
      weekEnd,
      totalSessions,
      totalWordsReviewed,
      averageAccuracy: totalWordsReviewed > 0 ? totalCorrect / totalWordsReviewed : 0,
      totalStudyTimeMinutes: Math.round(totalStudyTime),
      wordsProgressedToMastery: 0, // Would require more complex calculation
    })
  }

  return trends
}

// ============================================================================
// Difficulty Analysis
// ============================================================================

/**
 * Create a difficulty heatmap for vocabulary
 */
export async function getDifficultyHeatmap(): Promise<DifficultyHeatmapEntry[]> {
  const vocabulary = await db.vocabularyItems.toArray()
  const progress = await db.learningProgress.toArray()
  const progressMap = new Map(progress.map(p => [p.vocabularyId, p]))

  // Get recent attempts (last 30 days) for trend analysis
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentAttempts = await db.reviewAttempts
    .where('createdAt')
    .above(thirtyDaysAgo)
    .toArray()

  // Group attempts by vocabulary
  const attemptsByVocab = new Map<string, ReviewAttempt[]>()
  for (const attempt of recentAttempts) {
    const existing = attemptsByVocab.get(attempt.vocabularyId) || []
    existing.push(attempt)
    attemptsByVocab.set(attempt.vocabularyId, existing)
  }

  const entries: DifficultyHeatmapEntry[] = []

  for (const vocab of vocabulary) {
    const prog = progressMap.get(vocab.id)
    const attempts = attemptsByVocab.get(vocab.id) || []

    if (!prog || prog.totalReviews < 1) {
      continue
    }

    const accuracy = prog.totalReviews > 0
      ? prog.correctReviews / prog.totalReviews
      : 0

    // Calculate difficulty level
    let difficulty: DifficultyHeatmapEntry['difficulty']
    if (accuracy >= 0.9) {
      difficulty = 'easy'
    } else if (accuracy >= 0.7) {
      difficulty = 'medium'
    } else if (accuracy >= 0.5) {
      difficulty = 'hard'
    } else {
      difficulty = 'very_hard'
    }

    // Calculate trend from recent attempts
    let trend: DifficultyHeatmapEntry['trend'] = 'stable'
    if (attempts.length >= 4) {
      const midpoint = Math.floor(attempts.length / 2)
      const firstHalf = attempts.slice(0, midpoint)
      const secondHalf = attempts.slice(midpoint)

      const firstAccuracy = firstHalf.filter(a => a.wasCorrect).length / firstHalf.length
      const secondAccuracy = secondHalf.filter(a => a.wasCorrect).length / secondHalf.length

      if (secondAccuracy > firstAccuracy + 0.15) {
        trend = 'improving'
      } else if (secondAccuracy < firstAccuracy - 0.15) {
        trend = 'declining'
      }
    }

    entries.push({
      vocabulary: vocab,
      accuracy,
      totalAttempts: prog.totalReviews,
      lastReviewed: prog.lastReviewDate || null,
      difficulty,
      trend,
    })
  }

  // Sort by difficulty (hardest first)
  const difficultyOrder = { very_hard: 0, hard: 1, medium: 2, easy: 3 }
  entries.sort((a, b) => {
    const diff = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    if (diff !== 0) return diff
    return a.accuracy - b.accuracy
  })

  return entries
}

// ============================================================================
// Milestones
// ============================================================================

/**
 * Check for achieved milestones
 */
export async function checkMilestones(): Promise<LearningMilestone[]> {
  const milestones: LearningMilestone[] = []

  const vocabulary = await db.vocabularyItems.toArray()
  const progress = await db.learningProgress.toArray()

  const totalWords = vocabulary.length
  const masteredWords = progress.filter(p => getMasteryLevel(p.interval) === 'mastered').length
  const masteryPercentage = totalWords > 0 ? (masteredWords / totalWords) * 100 : 0

  // Word count milestones
  const wordMilestones = [
    { count: 1, type: 'first_word' as const },
    { count: 10, type: 'words_10' as const },
    { count: 50, type: 'words_50' as const },
    { count: 100, type: 'words_100' as const },
    { count: 500, type: 'words_500' as const },
  ]

  for (const milestone of wordMilestones) {
    if (totalWords >= milestone.count) {
      // Find when this milestone was reached
      const sortedVocab = [...vocabulary].sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      )
      if (sortedVocab[milestone.count - 1]) {
        milestones.push({
          type: milestone.type,
          achievedAt: sortedVocab[milestone.count - 1].createdAt,
          value: milestone.count,
        })
      }
    }
  }

  // Mastery milestones
  const masteryMilestones = [
    { percent: 25, type: 'mastery_25' as const },
    { percent: 50, type: 'mastery_50' as const },
    { percent: 75, type: 'mastery_75' as const },
    { percent: 100, type: 'mastery_100' as const },
  ]

  for (const milestone of masteryMilestones) {
    if (masteryPercentage >= milestone.percent) {
      milestones.push({
        type: milestone.type,
        achievedAt: new Date(), // Would need historical tracking for exact date
        value: milestone.percent,
      })
    }
  }

  return milestones
}

// ============================================================================
// Summary Statistics
// ============================================================================

export interface OverallStats {
  totalWords: number
  masteredWords: number
  learningWords: number
  newWords: number
  totalReviews: number
  totalSessions: number
  totalStudyTimeMinutes: number
  averageAccuracy: number
  currentStreak: number
  longestStreak: number
  firstSessionDate: Date | null
  lastSessionDate: Date | null
}

/**
 * Get overall learning statistics
 */
export async function getOverallStats(): Promise<OverallStats> {
  const vocabulary = await db.vocabularyItems.toArray()
  const progress = await db.learningProgress.toArray()
  const sessions = await db.reviewSessions.toArray()
  const progressMap = new Map(progress.map(p => [p.vocabularyId, p]))

  let masteredWords = 0
  let learningWords = 0
  let newWords = 0

  for (const vocab of vocabulary) {
    const prog = progressMap.get(vocab.id)
    const level = getMasteryLevel(prog?.interval || 0)

    if (level === 'mastered') masteredWords++
    else if (level === 'learning') learningWords++
    else newWords++
  }

  const totalReviews = progress.reduce((sum, p) => sum + p.totalReviews, 0)
  const totalCorrect = progress.reduce((sum, p) => sum + p.correctReviews, 0)

  let totalStudyTime = 0
  for (const session of sessions) {
    if (session.completedAt) {
      totalStudyTime += (session.completedAt.getTime() - session.startedAt.getTime()) / 60000
    }
  }

  // Calculate streak
  const sortedSessions = [...sessions].sort(
    (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
  )

  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  let lastDate: string | null = null

  for (const session of sortedSessions) {
    const dateStr = session.startedAt.toISOString().split('T')[0]

    if (lastDate === null) {
      tempStreak = 1
    } else if (lastDate !== dateStr) {
      const last = new Date(lastDate)
      const current = new Date(dateStr)
      const diffDays = Math.floor((last.getTime() - current.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }

    lastDate = dateStr
  }
  longestStreak = Math.max(longestStreak, tempStreak)
  currentStreak = tempStreak

  return {
    totalWords: vocabulary.length,
    masteredWords,
    learningWords,
    newWords,
    totalReviews,
    totalSessions: sessions.length,
    totalStudyTimeMinutes: Math.round(totalStudyTime),
    averageAccuracy: totalReviews > 0 ? totalCorrect / totalReviews : 0,
    currentStreak,
    longestStreak,
    firstSessionDate: sortedSessions[sortedSessions.length - 1]?.startedAt || null,
    lastSessionDate: sortedSessions[0]?.startedAt || null,
  }
}
