import type { LearningProgress, QualityRating } from '@/lib/db/schema'
import { addDays } from '@/lib/utils/date'

/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Quality ratings:
 * - 5: Perfect response, no hesitation
 * - 4: Correct response after hesitation
 * - 3: Correct response recalled with serious difficulty
 * - 2: Incorrect response; where the correct one seemed easy to recall
 * - 1: Incorrect response; the correct one remembered
 * - 0: Complete blackout
 *
 * For simplicity, we map user responses to:
 * - "Knew it!" → 5
 * - "Almost" → 3
 * - "Didn't know" → 1
 */

const MIN_EASE_FACTOR = 1.3
const DEFAULT_EASE_FACTOR = 2.5
const MAX_EASE_FACTOR = 3.0

export interface SM2Result {
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
}

/**
 * Calculate the next review date using the SM-2 algorithm
 */
export function calculateNextReview(
  progress: Pick<LearningProgress, 'easeFactor' | 'interval' | 'repetitions'>,
  quality: QualityRating
): SM2Result {
  const { easeFactor, interval, repetitions } = progress

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    Math.min(
      MAX_EASE_FACTOR,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    )
  )

  // If quality < 3, reset repetitions and start again
  if (quality < 3) {
    return {
      easeFactor: newEaseFactor,
      interval: 1, // Start with 1 day
      repetitions: 0,
      nextReviewDate: addDays(new Date(), 1),
    }
  }

  // Calculate new interval
  let newInterval: number
  if (repetitions === 0) {
    newInterval = 1 // First review: 1 day
  } else if (repetitions === 1) {
    newInterval = 6 // Second review: 6 days
  } else {
    // Subsequent reviews: interval * ease factor
    newInterval = Math.round(interval * newEaseFactor)
  }

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: repetitions + 1,
    nextReviewDate: addDays(new Date(), newInterval),
  }
}

/**
 * Map user-friendly rating to SM-2 quality
 */
export function mapUserRating(
  rating: 'didnt_know' | 'almost' | 'knew_it'
): QualityRating {
  switch (rating) {
    case 'didnt_know':
      return 1
    case 'almost':
      return 3
    case 'knew_it':
      return 5
  }
}

/**
 * Get default progress for a new vocabulary item
 */
export function getDefaultProgress(): Pick<
  LearningProgress,
  'easeFactor' | 'interval' | 'repetitions'
> {
  return {
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
  }
}

/**
 * Determine mastery level based on interval
 */
export function getMasteryLevel(
  interval: number
): 'new' | 'learning' | 'mastered' {
  if (interval === 0) return 'new'
  if (interval >= 21) return 'mastered'
  return 'learning'
}

/**
 * Get human-readable interval description
 */
export function getIntervalDescription(days: number): string {
  if (days === 0) return 'Neu'
  if (days === 1) return 'Morgen'
  if (days < 7) return `In ${days} Tagen`
  if (days < 30) return `In ${Math.round(days / 7)} Wochen`
  if (days < 365) return `In ${Math.round(days / 30)} Monaten`
  return `In ${Math.round(days / 365)} Jahren`
}
