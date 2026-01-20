import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  calculateNextReview,
  mapUserRating,
  getDefaultProgress,
  getMasteryLevel,
  getIntervalDescription,
} from '@/lib/learning/sm2'

describe('SM-2 Algorithm', () => {
  beforeEach(() => {
    // Mock Date to have consistent test results
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:00:00.000Z'))
  })

  describe('calculateNextReview', () => {
    describe('initial review (repetitions = 0)', () => {
      it('should set interval to 1 day on first successful review', () => {
        const progress = { easeFactor: 2.5, interval: 0, repetitions: 0 }
        const result = calculateNextReview(progress, 5)

        expect(result.interval).toBe(1)
        expect(result.repetitions).toBe(1)
      })

      it('should set next review date to tomorrow', () => {
        const progress = { easeFactor: 2.5, interval: 0, repetitions: 0 }
        const result = calculateNextReview(progress, 5)

        const expectedDate = new Date('2024-01-16T10:00:00.000Z')
        expect(result.nextReviewDate.toDateString()).toBe(expectedDate.toDateString())
      })
    })

    describe('second review (repetitions = 1)', () => {
      it('should set interval to 6 days on second successful review', () => {
        const progress = { easeFactor: 2.5, interval: 1, repetitions: 1 }
        const result = calculateNextReview(progress, 5)

        expect(result.interval).toBe(6)
        expect(result.repetitions).toBe(2)
      })
    })

    describe('third+ reviews (repetitions >= 2)', () => {
      it('should multiply interval by ease factor for subsequent reviews', () => {
        const progress = { easeFactor: 2.5, interval: 6, repetitions: 2 }
        const result = calculateNextReview(progress, 5)

        // EF increases to 2.6 on perfect answer, 6 * 2.6 = 15.6 -> 16
        expect(result.interval).toBe(16)
        expect(result.repetitions).toBe(3)
      })

      it('should continue multiplying for further reviews', () => {
        const progress = { easeFactor: 2.5, interval: 15, repetitions: 3 }
        const result = calculateNextReview(progress, 5)

        // EF increases to 2.6 on perfect answer, 15 * 2.6 = 39
        expect(result.interval).toBe(39)
        expect(result.repetitions).toBe(4)
      })
    })

    describe('quality ratings effect on ease factor', () => {
      it('should increase ease factor for quality 5 (perfect)', () => {
        const progress = { easeFactor: 2.5, interval: 6, repetitions: 2 }
        const result = calculateNextReview(progress, 5)

        expect(result.easeFactor).toBeGreaterThan(2.5)
        expect(result.easeFactor).toBe(2.6) // 2.5 + (0.1 - 0 * (0.08 + 0 * 0.02)) = 2.6
      })

      it('should maintain ease factor for quality 4', () => {
        const progress = { easeFactor: 2.5, interval: 6, repetitions: 2 }
        const result = calculateNextReview(progress, 4)

        // EF' = 2.5 + (0.1 - 1 * (0.08 + 1 * 0.02)) = 2.5
        expect(result.easeFactor).toBe(2.5)
      })

      it('should decrease ease factor for quality 3 (hard)', () => {
        const progress = { easeFactor: 2.5, interval: 6, repetitions: 2 }
        const result = calculateNextReview(progress, 3)

        // EF' = 2.5 + (0.1 - 2 * (0.08 + 2 * 0.02)) = 2.5 - 0.14 = 2.36
        expect(result.easeFactor).toBeLessThan(2.5)
        expect(result.easeFactor).toBeCloseTo(2.36, 2)
      })

      it('should significantly decrease ease factor for quality 2', () => {
        const progress = { easeFactor: 2.5, interval: 6, repetitions: 2 }
        const result = calculateNextReview(progress, 2)

        expect(result.easeFactor).toBeLessThan(2.36)
      })
    })

    describe('failed review (quality < 3)', () => {
      it('should reset interval to 1 day for quality 1 (didnt know)', () => {
        const progress = { easeFactor: 2.5, interval: 15, repetitions: 3 }
        const result = calculateNextReview(progress, 1)

        expect(result.interval).toBe(1)
        expect(result.repetitions).toBe(0)
      })

      it('should reset interval to 1 day for quality 2', () => {
        const progress = { easeFactor: 2.5, interval: 30, repetitions: 5 }
        const result = calculateNextReview(progress, 2)

        expect(result.interval).toBe(1)
        expect(result.repetitions).toBe(0)
      })

      it('should adjust ease factor on failure but keep it above minimum', () => {
        const progress = { easeFactor: 1.4, interval: 15, repetitions: 3 }
        const result = calculateNextReview(progress, 1)

        expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
      })
    })

    describe('ease factor bounds', () => {
      it('should not go below minimum ease factor (1.3)', () => {
        const progress = { easeFactor: 1.3, interval: 6, repetitions: 2 }
        const result = calculateNextReview(progress, 1) // Very bad answer

        expect(result.easeFactor).toBe(1.3)
      })

      it('should not exceed maximum ease factor (3.0)', () => {
        const progress = { easeFactor: 3.0, interval: 6, repetitions: 2 }
        const result = calculateNextReview(progress, 5) // Perfect answer

        expect(result.easeFactor).toBe(3.0)
      })
    })
  })

  describe('mapUserRating', () => {
    it('should map "knew_it" to quality 5', () => {
      expect(mapUserRating('knew_it')).toBe(5)
    })

    it('should map "almost" to quality 3', () => {
      expect(mapUserRating('almost')).toBe(3)
    })

    it('should map "didnt_know" to quality 1', () => {
      expect(mapUserRating('didnt_know')).toBe(1)
    })
  })

  describe('getDefaultProgress', () => {
    it('should return initial progress values', () => {
      const progress = getDefaultProgress()

      expect(progress.easeFactor).toBe(2.5)
      expect(progress.interval).toBe(0)
      expect(progress.repetitions).toBe(0)
    })
  })

  describe('getMasteryLevel', () => {
    it('should return "new" for interval 0', () => {
      expect(getMasteryLevel(0)).toBe('new')
    })

    it('should return "learning" for interval between 1 and 20', () => {
      expect(getMasteryLevel(1)).toBe('learning')
      expect(getMasteryLevel(10)).toBe('learning')
      expect(getMasteryLevel(20)).toBe('learning')
    })

    it('should return "mastered" for interval 21 or more', () => {
      expect(getMasteryLevel(21)).toBe('mastered')
      expect(getMasteryLevel(30)).toBe('mastered')
      expect(getMasteryLevel(100)).toBe('mastered')
    })
  })

  describe('getIntervalDescription', () => {
    it('should return "Neu" for interval 0', () => {
      expect(getIntervalDescription(0)).toBe('Neu')
    })

    it('should return "Morgen" for interval 1', () => {
      expect(getIntervalDescription(1)).toBe('Morgen')
    })

    it('should return days for intervals 2-6', () => {
      expect(getIntervalDescription(2)).toBe('In 2 Tagen')
      expect(getIntervalDescription(6)).toBe('In 6 Tagen')
    })

    it('should return weeks for intervals 7-29', () => {
      expect(getIntervalDescription(7)).toBe('In 1 Wochen')
      expect(getIntervalDescription(14)).toBe('In 2 Wochen')
      expect(getIntervalDescription(21)).toBe('In 3 Wochen')
    })

    it('should return months for intervals 30-364', () => {
      expect(getIntervalDescription(30)).toBe('In 1 Monaten')
      expect(getIntervalDescription(60)).toBe('In 2 Monaten')
      expect(getIntervalDescription(180)).toBe('In 6 Monaten')
    })

    it('should return years for intervals 365+', () => {
      expect(getIntervalDescription(365)).toBe('In 1 Jahren')
      expect(getIntervalDescription(730)).toBe('In 2 Jahren')
    })
  })
})
