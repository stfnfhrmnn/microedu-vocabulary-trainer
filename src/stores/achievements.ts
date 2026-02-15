'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ACHIEVEMENTS,
  checkAchievement,
  type AchievementStats,
} from '@/lib/gamification/achievements'

interface UnlockedAchievement {
  id: string
  unlockedAt: number // Unix timestamp
}

interface AchievementsState {
  // Unlocked achievements
  unlockedAchievements: UnlockedAchievement[]

  // Stats tracking for achievements
  stats: {
    totalSessions: number
    perfectSessions: number
    longestCorrectStreak: number
    currentCorrectStreak: number
    totalWordsLearned: number
    parentQuizSessions: number
  }

  // Recently unlocked (for showing popup)
  pendingUnlocks: string[]

  // Actions
  checkAndUnlockAchievements: (
    currentStreak: number,
    longestStreak: number
  ) => string[]
  recordSession: (correctCount: number, totalCount: number, isParentQuiz?: boolean) => void
  recordCorrectAnswer: () => void
  recordIncorrectAnswer: () => void
  recordWordsLearned: (count: number) => void
  clearPendingUnlocks: () => void
  isUnlocked: (id: string) => boolean
  getUnlockDate: (id: string) => Date | null
  resetAchievements: () => void
}

export const useAchievements = create<AchievementsState>()(
  persist(
    (set, get) => ({
      unlockedAchievements: [],
      stats: {
        totalSessions: 0,
        perfectSessions: 0,
        longestCorrectStreak: 0,
        currentCorrectStreak: 0,
        totalWordsLearned: 0,
        parentQuizSessions: 0,
      },
      pendingUnlocks: [],

      checkAndUnlockAchievements: (currentStreak, longestStreak) => {
        const state = get()
        const now = new Date()

        const achievementStats: AchievementStats = {
          currentStreak,
          longestStreak,
          totalWordsLearned: state.stats.totalWordsLearned,
          totalReviews: 0, // Not tracking this separately
          totalSessions: state.stats.totalSessions,
          currentCorrectStreak: state.stats.currentCorrectStreak,
          longestCorrectStreak: state.stats.longestCorrectStreak,
          perfectSessions: state.stats.perfectSessions,
          currentHour: now.getHours(),
          isWeekend: now.getDay() === 0 || now.getDay() === 6,
          parentQuizSessions: state.stats.parentQuizSessions,
        }

        const newlyUnlocked: string[] = []

        for (const achievement of ACHIEVEMENTS) {
          // Skip if already unlocked
          if (state.unlockedAchievements.some((u) => u.id === achievement.id)) {
            continue
          }

          // Check if achievement should be unlocked
          if (checkAchievement(achievement.id, achievementStats)) {
            newlyUnlocked.push(achievement.id)
          }
        }

        if (newlyUnlocked.length > 0) {
          set((s) => ({
            unlockedAchievements: [
              ...s.unlockedAchievements,
              ...newlyUnlocked.map((id) => ({ id, unlockedAt: Date.now() })),
            ],
            pendingUnlocks: [...s.pendingUnlocks, ...newlyUnlocked],
          }))
        }

        return newlyUnlocked
      },

      recordSession: (correctCount, totalCount, isParentQuiz = false) => {
        const isPerfect = correctCount === totalCount && totalCount > 0

        set((s) => ({
          stats: {
            ...s.stats,
            totalSessions: s.stats.totalSessions + 1,
            perfectSessions: s.stats.perfectSessions + (isPerfect ? 1 : 0),
            parentQuizSessions: s.stats.parentQuizSessions + (isParentQuiz ? 1 : 0),
          },
        }))
      },

      recordCorrectAnswer: () => {
        set((s) => {
          const newStreak = s.stats.currentCorrectStreak + 1
          return {
            stats: {
              ...s.stats,
              currentCorrectStreak: newStreak,
              longestCorrectStreak: Math.max(newStreak, s.stats.longestCorrectStreak),
            },
          }
        })
      },

      recordIncorrectAnswer: () => {
        set((s) => ({
          stats: {
            ...s.stats,
            currentCorrectStreak: 0,
          },
        }))
      },

      recordWordsLearned: (count) => {
        set((s) => ({
          stats: {
            ...s.stats,
            totalWordsLearned: s.stats.totalWordsLearned + count,
          },
        }))
      },

      clearPendingUnlocks: () => {
        set({ pendingUnlocks: [] })
      },

      isUnlocked: (id) => {
        return get().unlockedAchievements.some((u) => u.id === id)
      },

      getUnlockDate: (id) => {
        const unlocked = get().unlockedAchievements.find((u) => u.id === id)
        return unlocked ? new Date(unlocked.unlockedAt) : null
      },

      resetAchievements: () => {
        set({
          unlockedAchievements: [],
          stats: {
            totalSessions: 0,
            perfectSessions: 0,
            longestCorrectStreak: 0,
            currentCorrectStreak: 0,
            totalWordsLearned: 0,
            parentQuizSessions: 0,
          },
          pendingUnlocks: [],
        })
      },
    }),
    {
      name: 'vocabulary-trainer-achievements',
    }
  )
)

// Hook to get achievement progress
export function useAchievementProgress() {
  const unlockedAchievements = useAchievements((s) => s.unlockedAchievements)
  const total = ACHIEVEMENTS.length
  const unlocked = unlockedAchievements.length

  return {
    unlocked,
    total,
    percentage: total > 0 ? Math.round((unlocked / total) * 100) : 0,
  }
}
