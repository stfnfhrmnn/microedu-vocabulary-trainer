/**
 * Smart Study Recommendations Service
 *
 * Provides intelligent suggestions for:
 * - Optimal review timing
 * - Weakness detection (frequently-missed words)
 * - Progress predictions (mastery timeline)
 * - Daily goal suggestions
 */

import { db } from '@/lib/db/db'
import type { VocabularyItem, LearningProgress } from '@/lib/db/schema'
import { getMasteryLevel } from './sm2'

// ============================================================================
// Types
// ============================================================================

export interface StudyRecommendation {
  type: 'optimal_time' | 'weakness' | 'streak_risk' | 'milestone'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  action?: {
    label: string
    sectionIds?: string[]
    vocabularyIds?: string[]
  }
}

export interface WeakWord {
  vocabulary: VocabularyItem
  progress: LearningProgress
  accuracy: number           // 0-1
  totalAttempts: number
  recentMistakes: number     // mistakes in last 7 days
  difficulty: 'hard' | 'very_hard' | 'struggling'
}

export interface ProgressPrediction {
  currentMastered: number
  totalWords: number
  masteryPercentage: number
  estimatedDaysToMastery: number | null  // null if not enough data
  weeklyProgress: number     // words mastered per week average
  projectedMasteryDate: Date | null
}

export interface DailyGoalSuggestion {
  suggestedGoal: number
  reasoning: string
  minGoal: number
  maxGoal: number
  factors: {
    dueToday: number
    averageDaily: number
    recentPerformance: number  // 0-1
    daysUntilExam?: number
  }
}

export interface OptimalStudyTime {
  hour: number               // 0-23
  dayOfWeek: number          // 0-6 (Sunday-Saturday)
  confidence: number         // 0-1
  averageAccuracy: number    // accuracy at this time
  sampleSize: number
}

// ============================================================================
// Weakness Detection
// ============================================================================

/**
 * Identify vocabulary items the user struggles with
 */
export async function getWeakWords(limit = 10): Promise<WeakWord[]> {
  const allProgress = await db.learningProgress.toArray()
  const vocabIds = allProgress.map(p => p.vocabularyId)

  // Get vocabulary items
  const vocabulary = await db.vocabularyItems
    .where('id')
    .anyOf(vocabIds)
    .toArray()

  const vocabMap = new Map(vocabulary.map(v => [v.id, v]))

  // Get recent attempts (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentAttempts = await db.reviewAttempts
    .where('createdAt')
    .above(thirtyDaysAgo)
    .toArray()

  // Calculate recent mistakes per vocabulary
  const recentMistakesMap = new Map<string, number>()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  recentAttempts.forEach(attempt => {
    if (!attempt.wasCorrect && attempt.createdAt >= sevenDaysAgo) {
      const current = recentMistakesMap.get(attempt.vocabularyId) || 0
      recentMistakesMap.set(attempt.vocabularyId, current + 1)
    }
  })

  // Build weak words list
  const weakWords: WeakWord[] = []

  for (const progress of allProgress) {
    const vocab = vocabMap.get(progress.vocabularyId)
    if (!vocab) continue

    // Skip items with very few reviews
    if (progress.totalReviews < 2) continue

    const accuracy = progress.totalReviews > 0
      ? progress.correctReviews / progress.totalReviews
      : 0

    const recentMistakes = recentMistakesMap.get(progress.vocabularyId) || 0

    // Determine difficulty level
    let difficulty: WeakWord['difficulty'] | null = null

    if (accuracy < 0.3 || recentMistakes >= 3) {
      difficulty = 'struggling'
    } else if (accuracy < 0.5 || recentMistakes >= 2) {
      difficulty = 'very_hard'
    } else if (accuracy < 0.7 && progress.totalReviews >= 3) {
      difficulty = 'hard'
    }

    if (difficulty) {
      weakWords.push({
        vocabulary: vocab,
        progress,
        accuracy,
        totalAttempts: progress.totalReviews,
        recentMistakes,
        difficulty,
      })
    }
  }

  // Sort by difficulty (struggling first) then by accuracy (lowest first)
  weakWords.sort((a, b) => {
    const difficultyOrder = { struggling: 0, very_hard: 1, hard: 2 }
    const diffCompare = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
    if (diffCompare !== 0) return diffCompare
    return a.accuracy - b.accuracy
  })

  return weakWords.slice(0, limit)
}

// ============================================================================
// Progress Predictions
// ============================================================================

/**
 * Predict when mastery will be achieved based on current progress
 */
export async function getProgressPrediction(): Promise<ProgressPrediction> {
  const allVocab = await db.vocabularyItems.toArray()
  const allProgress = await db.learningProgress.toArray()

  const progressMap = new Map(allProgress.map(p => [p.vocabularyId, p]))

  let mastered = 0
  for (const vocab of allVocab) {
    const progress = progressMap.get(vocab.id)
    const level = getMasteryLevel(progress?.interval || 0)

    if (level === 'mastered') mastered++
  }

  const totalWords = allVocab.length
  const masteryPercentage = totalWords > 0 ? (mastered / totalWords) * 100 : 0

  // Calculate weekly progress based on recent sessions
  const fourWeeksAgo = new Date()
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const recentSessions = await db.reviewSessions
    .where('startedAt')
    .above(fourWeeksAgo)
    .toArray()

  // Estimate words mastered per week based on sessions and success rate
  let weeklyProgress = 0
  let estimatedDaysToMastery: number | null = null
  let projectedMasteryDate: Date | null = null

  if (recentSessions.length >= 3) {
    const totalCorrect = recentSessions.reduce((sum, s) => sum + s.correctCount, 0)
    const totalItems = recentSessions.reduce((sum, s) => sum + s.totalItems, 0)
    const avgAccuracy = totalItems > 0 ? totalCorrect / totalItems : 0

    // Estimate effective learning rate (words that stick per session)
    const sessionsPerWeek = recentSessions.length / 4
    const avgWordsPerSession = totalItems / recentSessions.length

    // Words that effectively move toward mastery each week
    // (accounting for accuracy and the SM-2 progression)
    weeklyProgress = Math.round(sessionsPerWeek * avgWordsPerSession * avgAccuracy * 0.15)

    if (weeklyProgress > 0) {
      const remainingWords = totalWords - mastered
      const weeksNeeded = Math.ceil(remainingWords / weeklyProgress)
      estimatedDaysToMastery = weeksNeeded * 7

      projectedMasteryDate = new Date()
      projectedMasteryDate.setDate(projectedMasteryDate.getDate() + estimatedDaysToMastery)
    }
  }

  return {
    currentMastered: mastered,
    totalWords,
    masteryPercentage,
    estimatedDaysToMastery,
    weeklyProgress,
    projectedMasteryDate,
  }
}

// ============================================================================
// Daily Goal Suggestions
// ============================================================================

/**
 * Suggest an optimal daily goal based on user patterns
 */
export async function getDailyGoalSuggestion(): Promise<DailyGoalSuggestion> {
  // Get due words count
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const allVocab = await db.vocabularyItems.toArray()
  const allProgress = await db.learningProgress.toArray()
  const progressMap = new Map(allProgress.map(p => [p.vocabularyId, p]))

  let dueToday = 0
  for (const vocab of allVocab) {
    const progress = progressMap.get(vocab.id)
    if (!progress || progress.nextReviewDate <= today) {
      dueToday++
    }
  }

  // Calculate average daily activity over past 2 weeks
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const recentSessions = await db.reviewSessions
    .where('startedAt')
    .above(twoWeeksAgo)
    .toArray()

  const totalReviewed = recentSessions.reduce((sum, s) => sum + s.totalItems, 0)
  const totalCorrect = recentSessions.reduce((sum, s) => sum + s.correctCount, 0)
  const averageDaily = Math.round(totalReviewed / 14)
  const recentPerformance = totalReviewed > 0 ? totalCorrect / totalReviewed : 0.7

  // Calculate suggested goal
  let suggestedGoal: number
  let reasoning: string

  if (dueToday === 0) {
    // No due words - suggest reviewing ahead or learning new
    suggestedGoal = Math.max(10, averageDaily)
    reasoning = 'Keine Vokabeln fällig - perfekt zum Vorlernen!'
  } else if (dueToday <= 10) {
    // Light day
    suggestedGoal = dueToday
    reasoning = `Nur ${dueToday} Vokabeln fällig - schnell erledigt!`
  } else if (dueToday <= 30) {
    // Normal day
    suggestedGoal = Math.min(dueToday, Math.max(20, averageDaily))
    reasoning = `${dueToday} Vokabeln warten auf dich`
  } else {
    // Heavy backlog
    // Suggest a manageable portion based on recent performance
    const manageable = Math.max(20, Math.round(averageDaily * 1.2))
    suggestedGoal = Math.min(dueToday, manageable)
    reasoning = `${dueToday} Vokabeln fällig - wir empfehlen ${suggestedGoal} für heute`
  }

  // Adjust based on recent performance
  if (recentPerformance < 0.6) {
    // Struggling - reduce goal slightly
    suggestedGoal = Math.max(10, Math.round(suggestedGoal * 0.8))
    reasoning += ' (angepasst für fokussiertes Lernen)'
  } else if (recentPerformance > 0.9 && averageDaily > 0) {
    // Doing great - can handle more
    suggestedGoal = Math.round(suggestedGoal * 1.1)
    reasoning += ' (du machst das super!)'
  }

  return {
    suggestedGoal,
    reasoning,
    minGoal: Math.max(5, Math.round(suggestedGoal * 0.5)),
    maxGoal: Math.min(100, Math.round(suggestedGoal * 2)),
    factors: {
      dueToday,
      averageDaily,
      recentPerformance,
    },
  }
}

// ============================================================================
// Optimal Study Time Analysis
// ============================================================================

/**
 * Analyze when the user performs best
 */
export async function getOptimalStudyTimes(): Promise<OptimalStudyTime[]> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentAttempts = await db.reviewAttempts
    .where('createdAt')
    .above(thirtyDaysAgo)
    .toArray()

  if (recentAttempts.length < 20) {
    // Not enough data
    return []
  }

  // Group by hour and day of week
  const timeSlots = new Map<string, { correct: number; total: number }>()

  recentAttempts.forEach(attempt => {
    const date = new Date(attempt.createdAt)
    const hour = date.getHours()
    const dayOfWeek = date.getDay()
    const key = `${dayOfWeek}-${hour}`

    const current = timeSlots.get(key) || { correct: 0, total: 0 }
    current.total++
    if (attempt.wasCorrect) current.correct++
    timeSlots.set(key, current)
  })

  // Convert to optimal times (only include slots with enough data)
  const optimalTimes: OptimalStudyTime[] = []

  timeSlots.forEach((stats, key) => {
    if (stats.total >= 5) { // Minimum sample size
      const [dayStr, hourStr] = key.split('-')
      const dayOfWeek = parseInt(dayStr)
      const hour = parseInt(hourStr)
      const accuracy = stats.correct / stats.total

      optimalTimes.push({
        hour,
        dayOfWeek,
        confidence: Math.min(1, stats.total / 20), // More data = more confidence
        averageAccuracy: accuracy,
        sampleSize: stats.total,
      })
    }
  })

  // Sort by accuracy (best times first)
  optimalTimes.sort((a, b) => b.averageAccuracy - a.averageAccuracy)

  return optimalTimes.slice(0, 5) // Top 5 time slots
}

// ============================================================================
// Comprehensive Recommendations
// ============================================================================

/**
 * Get all study recommendations for the dashboard
 */
export async function getStudyRecommendations(): Promise<StudyRecommendation[]> {
  const recommendations: StudyRecommendation[] = []

  // 1. Check for weak words
  const weakWords = await getWeakWords(5)
  if (weakWords.length > 0) {
    const strugglingCount = weakWords.filter(w => w.difficulty === 'struggling').length

    if (strugglingCount > 0) {
      recommendations.push({
        type: 'weakness',
        priority: 'high',
        title: `${strugglingCount} schwierige Vokabeln`,
        description: 'Diese Wörter brauchen besondere Aufmerksamkeit',
        action: {
          label: 'Gezielt üben',
          vocabularyIds: weakWords
            .filter(w => w.difficulty === 'struggling')
            .map(w => w.vocabulary.id),
        },
      })
    } else {
      recommendations.push({
        type: 'weakness',
        priority: 'medium',
        title: `${weakWords.length} Wörter zum Wiederholen`,
        description: 'Diese Vokabeln könnten mehr Übung vertragen',
        action: {
          label: 'Wiederholen',
          vocabularyIds: weakWords.map(w => w.vocabulary.id),
        },
      })
    }
  }

  // 2. Check for optimal study time
  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.getDay()

  const optimalTimes = await getOptimalStudyTimes()
  const currentIsOptimal = optimalTimes.some(t =>
    t.hour === currentHour &&
    t.dayOfWeek === currentDay &&
    t.averageAccuracy > 0.7
  )

  if (currentIsOptimal) {
    recommendations.push({
      type: 'optimal_time',
      priority: 'medium',
      title: 'Jetzt ist eine gute Zeit!',
      description: 'Deine Leistung ist um diese Zeit besonders gut',
      action: {
        label: 'Jetzt lernen',
      },
    })
  }

  // 3. Check progress milestones
  const prediction = await getProgressPrediction()

  if (prediction.masteryPercentage >= 90 && prediction.masteryPercentage < 100) {
    recommendations.push({
      type: 'milestone',
      priority: 'high',
      title: 'Fast geschafft!',
      description: `Noch ${prediction.totalWords - prediction.currentMastered} Vokabeln bis zur Meisterschaft`,
      action: {
        label: 'Endspurt',
      },
    })
  } else if (prediction.masteryPercentage >= 50 && prediction.masteryPercentage < 51) {
    recommendations.push({
      type: 'milestone',
      priority: 'medium',
      title: 'Halbzeit erreicht!',
      description: '50% der Vokabeln gemeistert',
    })
  }

  // 4. Check for streak risk (no activity in 2+ days)
  const twoDaysAgo = new Date()
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

  const veryRecentSessions = await db.reviewSessions
    .where('startedAt')
    .above(twoDaysAgo)
    .count()

  if (veryRecentSessions === 0) {
    const goalSuggestion = await getDailyGoalSuggestion()

    recommendations.push({
      type: 'streak_risk',
      priority: 'high',
      title: 'Komm zurück!',
      description: `${goalSuggestion.factors.dueToday} Vokabeln warten auf dich`,
      action: {
        label: 'Weiter lernen',
      },
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return recommendations
}

// ============================================================================
// Utility: Format time descriptions
// ============================================================================

export function formatOptimalTime(time: OptimalStudyTime): string {
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
  const dayName = days[time.dayOfWeek]
  const hourStr = `${time.hour}:00`

  return `${dayName} um ${hourStr}`
}

export function formatPrediction(prediction: ProgressPrediction): string {
  if (!prediction.projectedMasteryDate) {
    return 'Noch nicht genug Daten für eine Vorhersage'
  }

  const days = prediction.estimatedDaysToMastery!

  if (days <= 7) {
    return `In etwa ${days} Tagen`
  } else if (days <= 30) {
    return `In etwa ${Math.round(days / 7)} Wochen`
  } else {
    return `In etwa ${Math.round(days / 30)} Monaten`
  }
}
