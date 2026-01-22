import { describe, it, expect } from 'vitest'
import {
  calculateAnswerXP,
  calculateSessionBonusXP,
  calculateLevel,
  getLevelProgress,
  getLevelTitle,
  checkLevelUp,
} from '@/lib/gamification/xp'

describe('XP Calculations', () => {
  describe('calculateAnswerXP', () => {
    describe('base XP by exercise type', () => {
      it('should award 5 XP for flashcard correct answer', () => {
        const result = calculateAnswerXP('flashcard', 0)

        expect(result.base).toBe(5)
        expect(result.total).toBe(5)
        expect(result.streakBonus).toBe(0)
      })

      it('should award 8 XP for multiple choice correct answer', () => {
        const result = calculateAnswerXP('multipleChoice', 0)

        expect(result.base).toBe(8)
        expect(result.total).toBe(8)
      })

      it('should award 12 XP for typed input correct answer', () => {
        const result = calculateAnswerXP('typed', 0)

        expect(result.base).toBe(12)
        expect(result.total).toBe(12)
      })
    })

    describe('streak bonus', () => {
      it('should add no streak bonus for 0 days streak', () => {
        const result = calculateAnswerXP('flashcard', 0)

        expect(result.streakBonus).toBe(0)
        expect(result.total).toBe(5)
      })

      it('should add no streak bonus for 4 days streak', () => {
        const result = calculateAnswerXP('flashcard', 4)

        expect(result.streakBonus).toBe(0)
        expect(result.total).toBe(5)
      })

      it('should add 1 XP bonus for 5 days streak', () => {
        const result = calculateAnswerXP('flashcard', 5)

        expect(result.streakBonus).toBe(1)
        expect(result.total).toBe(6)
      })

      it('should add 2 XP bonus for 10 days streak', () => {
        const result = calculateAnswerXP('multipleChoice', 10)

        expect(result.streakBonus).toBe(2)
        expect(result.total).toBe(10) // 8 base + 2 bonus
      })

      it('should add 6 XP bonus for 30 days streak', () => {
        const result = calculateAnswerXP('typed', 30)

        expect(result.streakBonus).toBe(6)
        expect(result.total).toBe(18) // 12 base + 6 bonus
      })
    })

    it('should include reason in German', () => {
      const result = calculateAnswerXP('flashcard', 0)

      expect(result.reason).toBe('Richtige Antwort')
    })
  })

  describe('calculateSessionBonusXP', () => {
    describe('perfect session bonus', () => {
      it('should award 20 XP for perfect session', () => {
        const bonuses = calculateSessionBonusXP(10, 10, false, false)

        expect(bonuses).toHaveLength(1)
        expect(bonuses[0].total).toBe(20)
        expect(bonuses[0].reason).toBe('Perfekte Runde!')
      })

      it('should not award bonus for imperfect session', () => {
        const bonuses = calculateSessionBonusXP(9, 10, false, false)

        expect(bonuses).toHaveLength(0)
      })

      it('should not award bonus for empty session', () => {
        const bonuses = calculateSessionBonusXP(0, 0, false, false)

        expect(bonuses).toHaveLength(0)
      })
    })

    describe('first practice of day bonus', () => {
      it('should award 10 XP for first practice of day', () => {
        const bonuses = calculateSessionBonusXP(5, 10, true, false)

        const firstPracticeBonus = bonuses.find(b => b.reason === 'Erste Übung heute')
        expect(firstPracticeBonus).toBeDefined()
        expect(firstPracticeBonus?.total).toBe(10)
      })

      it('should not award bonus if not first practice', () => {
        const bonuses = calculateSessionBonusXP(5, 10, false, false)

        const firstPracticeBonus = bonuses.find(b => b.reason === 'Erste Übung heute')
        expect(firstPracticeBonus).toBeUndefined()
      })
    })

    describe('daily goal bonus', () => {
      it('should award 25 XP for reaching daily goal', () => {
        const bonuses = calculateSessionBonusXP(5, 10, false, true)

        const dailyGoalBonus = bonuses.find(b => b.reason === 'Tagesziel erreicht!')
        expect(dailyGoalBonus).toBeDefined()
        expect(dailyGoalBonus?.total).toBe(25)
      })

      it('should not award bonus if daily goal not reached', () => {
        const bonuses = calculateSessionBonusXP(5, 10, false, false)

        const dailyGoalBonus = bonuses.find(b => b.reason === 'Tagesziel erreicht!')
        expect(dailyGoalBonus).toBeUndefined()
      })
    })

    describe('multiple bonuses', () => {
      it('should award all applicable bonuses', () => {
        const bonuses = calculateSessionBonusXP(10, 10, true, true)

        expect(bonuses).toHaveLength(3)

        const totalBonus = bonuses.reduce((sum, b) => sum + b.total, 0)
        expect(totalBonus).toBe(55) // 20 + 10 + 25
      })
    })
  })

  describe('calculateLevel', () => {
    it('should return level 1 for 0 XP', () => {
      expect(calculateLevel(0)).toBe(1)
    })

    it('should return level 1 for 99 XP', () => {
      expect(calculateLevel(99)).toBe(1)
    })

    it('should return level 2 for 100 XP', () => {
      expect(calculateLevel(100)).toBe(2)
    })

    it('should return level 2 for 249 XP', () => {
      expect(calculateLevel(249)).toBe(2)
    })

    it('should return level 3 for 250 XP', () => {
      expect(calculateLevel(250)).toBe(3)
    })

    it('should return level 5 (Bronze) for 1000 XP', () => {
      expect(calculateLevel(1000)).toBe(5)
    })

    it('should return level 10 (Silver) for 10000 XP', () => {
      expect(calculateLevel(10000)).toBe(10)
    })

    it('should return level 15 (Gold) for 30000 XP', () => {
      expect(calculateLevel(30000)).toBe(15)
    })

    it('should return level 20 (Platinum) for 75000 XP', () => {
      expect(calculateLevel(75000)).toBe(20)
    })

    it('should return level 25 (Diamond) for 200000 XP', () => {
      expect(calculateLevel(200000)).toBe(25)
    })

    it('should cap at level 25 for very high XP', () => {
      expect(calculateLevel(1000000)).toBe(25)
    })
  })

  describe('getLevelProgress', () => {
    it('should return correct progress for level 1', () => {
      const progress = getLevelProgress(50)

      expect(progress.level).toBe(1)
      expect(progress.currentLevelXP).toBe(50)
      expect(progress.nextLevelXP).toBe(100)
      expect(progress.progress).toBe(0.5)
    })

    it('should return correct progress at level boundary', () => {
      const progress = getLevelProgress(100)

      expect(progress.level).toBe(2)
      expect(progress.currentLevelXP).toBe(0)
      expect(progress.nextLevelXP).toBe(150) // 250 - 100
      expect(progress.progress).toBe(0)
    })

    it('should return correct progress mid-level', () => {
      const progress = getLevelProgress(175)

      expect(progress.level).toBe(2)
      expect(progress.currentLevelXP).toBe(75)
      expect(progress.nextLevelXP).toBe(150)
      expect(progress.progress).toBe(0.5)
    })

    it('should handle max level progress', () => {
      const progress = getLevelProgress(300000)

      expect(progress.level).toBe(25)
      expect(progress.progress).toBe(1) // Capped at 1
    })
  })

  describe('getLevelTitle', () => {
    it('should return null for level 1', () => {
      expect(getLevelTitle(1)).toBe('Beginner')
    })

    it('should return Beginner for levels 1-4', () => {
      expect(getLevelTitle(2)).toBe('Beginner')
      expect(getLevelTitle(3)).toBe('Beginner')
      expect(getLevelTitle(4)).toBe('Beginner')
    })

    it('should return Bronze for level 5', () => {
      expect(getLevelTitle(5)).toBe('Bronze')
    })

    it('should return Bronze for levels 5-9', () => {
      expect(getLevelTitle(6)).toBe('Bronze')
      expect(getLevelTitle(9)).toBe('Bronze')
    })

    it('should return Silver for level 10', () => {
      expect(getLevelTitle(10)).toBe('Silver')
    })

    it('should return Gold for level 15', () => {
      expect(getLevelTitle(15)).toBe('Gold')
    })

    it('should return Platinum for level 20', () => {
      expect(getLevelTitle(20)).toBe('Platinum')
    })

    it('should return Diamond for level 25', () => {
      expect(getLevelTitle(25)).toBe('Diamond')
    })
  })

  describe('checkLevelUp', () => {
    it('should return null when no level up occurred', () => {
      expect(checkLevelUp(50, 75)).toBeNull()
    })

    it('should return new level when level up occurred', () => {
      expect(checkLevelUp(90, 110)).toBe(2)
    })

    it('should return new level for multi-level jump', () => {
      // Jump from level 1 to level 3
      expect(checkLevelUp(50, 300)).toBe(3)
    })

    it('should return null when XP decreases', () => {
      expect(checkLevelUp(150, 100)).toBeNull()
    })

    it('should return null when XP is same', () => {
      expect(checkLevelUp(100, 100)).toBeNull()
    })

    it('should detect milestone level ups', () => {
      // Level 4 -> Level 5 (Bronze)
      expect(checkLevelUp(900, 1100)).toBe(5)

      // Level 9 -> Level 10 (Silver)
      expect(checkLevelUp(9000, 10500)).toBe(10)
    })
  })
})
