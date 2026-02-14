import type { LearningProgress } from '@/lib/db/schema'

export type DifficultyLevel = 'hard' | 'very_hard' | 'struggling'

/**
 * Keep "difficult words" logic centralized so setup and recommendations stay aligned.
 */
export function getDifficultyLevel(progress?: LearningProgress): DifficultyLevel | null {
  if (!progress) return null
  if (progress.totalReviews < 2) return null

  const accuracy =
    progress.totalReviews > 0 ? progress.correctReviews / progress.totalReviews : 0

  if (accuracy < 0.3) return 'struggling'
  if (accuracy < 0.5) return 'very_hard'
  if (accuracy < 0.7 && progress.totalReviews >= 3) return 'hard'

  return null
}

export function isDifficultProgress(progress?: LearningProgress): boolean {
  return getDifficultyLevel(progress) !== null
}
