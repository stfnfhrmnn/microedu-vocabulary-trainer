import { describe, expect, it } from 'vitest'
import { getDifficultyLevel, isDifficultProgress } from '@/lib/learning/difficulty'
import type { LearningProgress } from '@/lib/db/schema'

function makeProgress(overrides: Partial<LearningProgress> = {}): LearningProgress {
  return {
    id: 'p1',
    vocabularyId: 'v1',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReviewDate: new Date('2026-02-14T12:00:00.000Z'),
    totalReviews: 5,
    correctReviews: 4,
    lastReviewDate: new Date('2026-02-13T12:00:00.000Z'),
    createdAt: new Date('2026-02-01T12:00:00.000Z'),
    updatedAt: new Date('2026-02-13T12:00:00.000Z'),
    ...overrides,
  }
}

describe('Difficulty Helpers', () => {
  it('classifies struggling words when accuracy is very low', () => {
    const level = getDifficultyLevel(makeProgress({ totalReviews: 10, correctReviews: 2 }))
    expect(level).toBe('struggling')
  })

  it('classifies very hard words below 50% accuracy', () => {
    const level = getDifficultyLevel(makeProgress({ totalReviews: 8, correctReviews: 3 }))
    expect(level).toBe('very_hard')
  })

  it('classifies hard words below 70% accuracy with enough attempts', () => {
    const level = getDifficultyLevel(makeProgress({ totalReviews: 6, correctReviews: 4 }))
    expect(level).toBe('hard')
  })

  it('does not classify words with too few reviews', () => {
    const level = getDifficultyLevel(makeProgress({ totalReviews: 1, correctReviews: 0 }))
    expect(level).toBeNull()
  })

  it('flags difficult state consistently', () => {
    expect(isDifficultProgress(makeProgress({ totalReviews: 10, correctReviews: 1 }))).toBe(true)
    expect(isDifficultProgress(makeProgress({ totalReviews: 6, correctReviews: 5 }))).toBe(false)
    expect(isDifficultProgress(undefined)).toBe(false)
  })
})
