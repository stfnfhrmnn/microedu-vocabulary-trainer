import { describe, it, expect } from 'vitest'
import {
  ACHIEVEMENTS,
  checkAchievement,
  getAchievementById,
  getAchievementsByCategory,
  type AchievementStats,
} from '@/lib/gamification/achievements'

// Helper to create default stats
function createStats(overrides: Partial<AchievementStats> = {}): AchievementStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalWordsLearned: 0,
    totalReviews: 0,
    totalSessions: 0,
    currentCorrectStreak: 0,
    longestCorrectStreak: 0,
    perfectSessions: 0,
    currentHour: 12, // Noon by default
    isWeekend: false,
    parentQuizSessions: 0,
    ...overrides,
  }
}

describe('Achievements', () => {
  describe('ACHIEVEMENTS constant', () => {
    it('should have 18 achievements defined', () => {
      expect(ACHIEVEMENTS).toHaveLength(18)
    })

    it('should have unique IDs for all achievements', () => {
      const ids = ACHIEVEMENTS.map(a => a.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should have all required fields for each achievement', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.id).toBeDefined()
        expect(achievement.name).toBeDefined()
        expect(achievement.description).toBeDefined()
        expect(achievement.icon).toBeDefined()
        expect(achievement.category).toBeDefined()
      }
    })

    it('should have valid categories', () => {
      const validCategories = ['consistency', 'volume', 'accuracy', 'special']

      for (const achievement of ACHIEVEMENTS) {
        expect(validCategories).toContain(achievement.category)
      }
    })
  })

  describe('checkAchievement - Consistency', () => {
    describe('first_steps', () => {
      it('should unlock after 1 session', () => {
        expect(checkAchievement('first_steps', createStats({ totalSessions: 1 }))).toBe(true)
      })

      it('should not unlock with 0 sessions', () => {
        expect(checkAchievement('first_steps', createStats({ totalSessions: 0 }))).toBe(false)
      })
    })

    describe('getting_started', () => {
      it('should unlock after 3 days streak', () => {
        expect(checkAchievement('getting_started', createStats({ longestStreak: 3 }))).toBe(true)
      })

      it('should not unlock with 2 days streak', () => {
        expect(checkAchievement('getting_started', createStats({ longestStreak: 2 }))).toBe(false)
      })
    })

    describe('on_a_roll', () => {
      it('should unlock after 7 days streak', () => {
        expect(checkAchievement('on_a_roll', createStats({ longestStreak: 7 }))).toBe(true)
      })

      it('should not unlock with 6 days streak', () => {
        expect(checkAchievement('on_a_roll', createStats({ longestStreak: 6 }))).toBe(false)
      })
    })

    describe('two_weeks_strong', () => {
      it('should unlock after 14 days streak', () => {
        expect(checkAchievement('two_weeks_strong', createStats({ longestStreak: 14 }))).toBe(true)
      })

      it('should not unlock with 13 days streak', () => {
        expect(checkAchievement('two_weeks_strong', createStats({ longestStreak: 13 }))).toBe(false)
      })
    })

    describe('monthly_master', () => {
      it('should unlock after 30 days streak', () => {
        expect(checkAchievement('monthly_master', createStats({ longestStreak: 30 }))).toBe(true)
      })

      it('should not unlock with 29 days streak', () => {
        expect(checkAchievement('monthly_master', createStats({ longestStreak: 29 }))).toBe(false)
      })
    })

    describe('unstoppable', () => {
      it('should unlock after 100 days streak', () => {
        expect(checkAchievement('unstoppable', createStats({ longestStreak: 100 }))).toBe(true)
      })

      it('should not unlock with 99 days streak', () => {
        expect(checkAchievement('unstoppable', createStats({ longestStreak: 99 }))).toBe(false)
      })
    })
  })

  describe('checkAchievement - Volume', () => {
    describe('word_collector', () => {
      it('should unlock after learning 50 words', () => {
        expect(checkAchievement('word_collector', createStats({ totalWordsLearned: 50 }))).toBe(true)
      })

      it('should not unlock with 49 words', () => {
        expect(checkAchievement('word_collector', createStats({ totalWordsLearned: 49 }))).toBe(false)
      })
    })

    describe('vocabulary_builder', () => {
      it('should unlock after learning 100 words', () => {
        expect(checkAchievement('vocabulary_builder', createStats({ totalWordsLearned: 100 }))).toBe(true)
      })

      it('should not unlock with 99 words', () => {
        expect(checkAchievement('vocabulary_builder', createStats({ totalWordsLearned: 99 }))).toBe(false)
      })
    })

    describe('word_wizard', () => {
      it('should unlock after learning 500 words', () => {
        expect(checkAchievement('word_wizard', createStats({ totalWordsLearned: 500 }))).toBe(true)
      })

      it('should not unlock with 499 words', () => {
        expect(checkAchievement('word_wizard', createStats({ totalWordsLearned: 499 }))).toBe(false)
      })
    })

    describe('dictionary_master', () => {
      it('should unlock after learning 1000 words', () => {
        expect(checkAchievement('dictionary_master', createStats({ totalWordsLearned: 1000 }))).toBe(true)
      })

      it('should not unlock with 999 words', () => {
        expect(checkAchievement('dictionary_master', createStats({ totalWordsLearned: 999 }))).toBe(false)
      })
    })
  })

  describe('checkAchievement - Accuracy', () => {
    describe('sharp_mind', () => {
      it('should unlock after 10 correct answers in a row', () => {
        expect(checkAchievement('sharp_mind', createStats({ longestCorrectStreak: 10 }))).toBe(true)
      })

      it('should not unlock with 9 correct in a row', () => {
        expect(checkAchievement('sharp_mind', createStats({ longestCorrectStreak: 9 }))).toBe(false)
      })
    })

    describe('perfect_memory', () => {
      it('should unlock after 25 correct answers in a row', () => {
        expect(checkAchievement('perfect_memory', createStats({ longestCorrectStreak: 25 }))).toBe(true)
      })

      it('should not unlock with 24 correct in a row', () => {
        expect(checkAchievement('perfect_memory', createStats({ longestCorrectStreak: 24 }))).toBe(false)
      })
    })

    describe('genius_mode', () => {
      it('should unlock after 50 correct answers in a row', () => {
        expect(checkAchievement('genius_mode', createStats({ longestCorrectStreak: 50 }))).toBe(true)
      })

      it('should not unlock with 49 correct in a row', () => {
        expect(checkAchievement('genius_mode', createStats({ longestCorrectStreak: 49 }))).toBe(false)
      })
    })

    describe('flawless', () => {
      it('should unlock after 5 perfect sessions', () => {
        expect(checkAchievement('flawless', createStats({ perfectSessions: 5 }))).toBe(true)
      })

      it('should not unlock with 4 perfect sessions', () => {
        expect(checkAchievement('flawless', createStats({ perfectSessions: 4 }))).toBe(false)
      })
    })
  })

  describe('checkAchievement - Special', () => {
    describe('night_owl', () => {
      it('should unlock when practicing at 22:00', () => {
        expect(checkAchievement('night_owl', createStats({ currentHour: 22 }))).toBe(true)
      })

      it('should unlock when practicing at 23:00', () => {
        expect(checkAchievement('night_owl', createStats({ currentHour: 23 }))).toBe(true)
      })

      it('should unlock when practicing at 00:00', () => {
        expect(checkAchievement('night_owl', createStats({ currentHour: 0 }))).toBe(true)
      })

      it('should unlock when practicing at 04:00', () => {
        expect(checkAchievement('night_owl', createStats({ currentHour: 4 }))).toBe(true)
      })

      it('should not unlock when practicing at 05:00', () => {
        expect(checkAchievement('night_owl', createStats({ currentHour: 5 }))).toBe(false)
      })

      it('should not unlock when practicing at 21:00', () => {
        expect(checkAchievement('night_owl', createStats({ currentHour: 21 }))).toBe(false)
      })
    })

    describe('early_bird', () => {
      it('should unlock when practicing at 05:00', () => {
        expect(checkAchievement('early_bird', createStats({ currentHour: 5 }))).toBe(true)
      })

      it('should unlock when practicing at 06:00', () => {
        expect(checkAchievement('early_bird', createStats({ currentHour: 6 }))).toBe(true)
      })

      it('should not unlock when practicing at 04:00', () => {
        expect(checkAchievement('early_bird', createStats({ currentHour: 4 }))).toBe(false)
      })

      it('should not unlock when practicing at 07:00', () => {
        expect(checkAchievement('early_bird', createStats({ currentHour: 7 }))).toBe(false)
      })
    })

    describe('weekend_warrior', () => {
      it('should unlock when practicing on weekend', () => {
        expect(checkAchievement('weekend_warrior', createStats({ isWeekend: true }))).toBe(true)
      })

      it('should not unlock when practicing on weekday', () => {
        expect(checkAchievement('weekend_warrior', createStats({ isWeekend: false }))).toBe(false)
      })
    })

    describe('family_time', () => {
      it('should unlock after 10 parent quiz sessions', () => {
        expect(checkAchievement('family_time', createStats({ parentQuizSessions: 10 }))).toBe(true)
      })

      it('should not unlock with 9 parent quiz sessions', () => {
        expect(checkAchievement('family_time', createStats({ parentQuizSessions: 9 }))).toBe(false)
      })
    })
  })

  describe('checkAchievement - Unknown ID', () => {
    it('should return false for unknown achievement ID', () => {
      expect(checkAchievement('nonexistent_achievement', createStats())).toBe(false)
    })
  })

  describe('getAchievementById', () => {
    it('should return achievement for valid ID', () => {
      const achievement = getAchievementById('first_steps')

      expect(achievement).toBeDefined()
      expect(achievement?.name).toBe('Erste Schritte')
    })

    it('should return undefined for invalid ID', () => {
      const achievement = getAchievementById('nonexistent')

      expect(achievement).toBeUndefined()
    })
  })

  describe('getAchievementsByCategory', () => {
    it('should return consistency achievements', () => {
      const achievements = getAchievementsByCategory('consistency')

      expect(achievements).toHaveLength(6)
      expect(achievements.every(a => a.category === 'consistency')).toBe(true)
    })

    it('should return volume achievements', () => {
      const achievements = getAchievementsByCategory('volume')

      expect(achievements).toHaveLength(4)
      expect(achievements.every(a => a.category === 'volume')).toBe(true)
    })

    it('should return accuracy achievements', () => {
      const achievements = getAchievementsByCategory('accuracy')

      expect(achievements).toHaveLength(4)
      expect(achievements.every(a => a.category === 'accuracy')).toBe(true)
    })

    it('should return special achievements', () => {
      const achievements = getAchievementsByCategory('special')

      expect(achievements).toHaveLength(4)
      expect(achievements.every(a => a.category === 'special')).toBe(true)
    })
  })
})
