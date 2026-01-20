'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { calculateLevel, checkLevelUp, calculateAnswerXP, calculateSessionBonusXP } from '@/lib/gamification/xp'
import type { ExerciseType } from '@/lib/db/schema'

interface DailyActivity {
  date: string // YYYY-MM-DD
  wordsReviewed: number
  correctCount: number
  sessionCount: number
  xpEarned: number
}

interface GamificationState {
  // Streak tracking
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null // YYYY-MM-DD

  // XP & Levels
  totalXP: number
  level: number

  // Daily activity
  dailyActivity: Record<string, DailyActivity>

  // Computed
  todayActivity: () => DailyActivity | null
  isFirstPracticeToday: () => boolean

  // Actions
  recordActivity: (wordsReviewed: number, correctCount: number) => void
  addXP: (amount: number) => { newTotal: number; leveledUp: number | null }
  recordCorrectAnswer: (exerciseType: ExerciseType) => number
  recordSessionComplete: (
    correctCount: number,
    totalCount: number,
    dailyGoal: number
  ) => { xpGained: number; bonuses: string[] }
  checkAndUpdateStreak: () => void
  resetGamification: () => void
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getYesterdayDate(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

export const useGamification = create<GamificationState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      totalXP: 0,
      level: 1,
      dailyActivity: {},

      todayActivity: () => {
        const today = getTodayDate()
        return get().dailyActivity[today] || null
      },

      isFirstPracticeToday: () => {
        const activity = get().todayActivity()
        return !activity || activity.sessionCount === 0
      },

      recordActivity: (wordsReviewed, correctCount) => {
        const today = getTodayDate()
        const state = get()

        const existing = state.dailyActivity[today] || {
          date: today,
          wordsReviewed: 0,
          correctCount: 0,
          sessionCount: 0,
          xpEarned: 0,
        }

        set({
          dailyActivity: {
            ...state.dailyActivity,
            [today]: {
              ...existing,
              wordsReviewed: existing.wordsReviewed + wordsReviewed,
              correctCount: existing.correctCount + correctCount,
              sessionCount: existing.sessionCount + 1,
            },
          },
        })

        // Update streak after recording activity
        get().checkAndUpdateStreak()
      },

      addXP: (amount) => {
        const state = get()
        const newTotal = state.totalXP + amount
        const leveledUp = checkLevelUp(state.totalXP, newTotal)
        const newLevel = calculateLevel(newTotal)

        // Update today's XP
        const today = getTodayDate()
        const todayData = state.dailyActivity[today] || {
          date: today,
          wordsReviewed: 0,
          correctCount: 0,
          sessionCount: 0,
          xpEarned: 0,
        }

        set({
          totalXP: newTotal,
          level: newLevel,
          dailyActivity: {
            ...state.dailyActivity,
            [today]: {
              ...todayData,
              xpEarned: todayData.xpEarned + amount,
            },
          },
        })

        return { newTotal, leveledUp }
      },

      recordCorrectAnswer: (exerciseType) => {
        const state = get()
        const { total } = calculateAnswerXP(exerciseType, state.currentStreak)
        get().addXP(total)
        return total
      },

      recordSessionComplete: (correctCount, totalCount, dailyGoal) => {
        const state = get()
        const isFirstToday = state.isFirstPracticeToday()
        const todayData = state.todayActivity()
        const totalToday = (todayData?.wordsReviewed || 0) + totalCount
        const goalReached = totalToday >= dailyGoal

        const bonuses = calculateSessionBonusXP(
          correctCount,
          totalCount,
          isFirstToday,
          goalReached
        )

        const xpGained = bonuses.reduce((sum, b) => sum + b.total, 0)
        if (xpGained > 0) {
          get().addXP(xpGained)
        }

        // Record the activity
        get().recordActivity(totalCount, correctCount)

        return {
          xpGained,
          bonuses: bonuses.map((b) => b.reason),
        }
      },

      checkAndUpdateStreak: () => {
        const state = get()
        const today = getTodayDate()
        const yesterday = getYesterdayDate()

        // No activity recorded
        if (!state.dailyActivity[today]) return

        // Already counted today
        if (state.lastActiveDate === today) return

        let newStreak: number

        if (state.lastActiveDate === yesterday) {
          // Continuing streak from yesterday
          newStreak = state.currentStreak + 1
        } else if (state.lastActiveDate === today) {
          // Already active today
          newStreak = state.currentStreak
        } else {
          // Streak broken, starting new
          newStreak = 1
        }

        const newLongest = Math.max(newStreak, state.longestStreak)

        set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastActiveDate: today,
        })
      },

      resetGamification: () => {
        set({
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: null,
          totalXP: 0,
          level: 1,
          dailyActivity: {},
        })
      },
    }),
    {
      name: 'vocabulary-trainer-gamification',
    }
  )
)

// Hook to get today's progress
export function useTodayProgress(dailyGoal: number) {
  const todayActivity = useGamification((s) => s.todayActivity)
  const activity = todayActivity()

  return {
    wordsReviewed: activity?.wordsReviewed || 0,
    correctCount: activity?.correctCount || 0,
    sessionCount: activity?.sessionCount || 0,
    xpEarned: activity?.xpEarned || 0,
    progress: Math.min((activity?.wordsReviewed || 0) / dailyGoal, 1),
    goalReached: (activity?.wordsReviewed || 0) >= dailyGoal,
  }
}
