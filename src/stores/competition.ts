/**
 * Competition Store
 *
 * Manages competition stats and leaderboard state.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LeaderboardEntry, PeriodType, CompetitionStats } from '@/lib/db/schema'

interface LeaderboardCache {
  entries: LeaderboardEntry[]
  fetchedAt: Date
  periodType: PeriodType
}

interface CompetitionState {
  // User's competition stats (aggregated, privacy-preserving)
  myStats: CompetitionStats | null

  // Leaderboard cache per network
  leaderboards: Map<string, LeaderboardCache> // networkId -> cache

  // Current period filter
  currentPeriod: PeriodType

  // Session stats (accumulated until sync)
  pendingSessionStats: {
    wordsReviewed: number
    wordsMastered: number
    correctCount: number
    totalCount: number
    xpEarned: number
  }

  // Loading states
  isLoading: boolean
  isSyncing: boolean
  error: string | null

  // Actions
  setMyStats: (stats: CompetitionStats | null) => void

  setLeaderboard: (networkId: string, entries: LeaderboardEntry[], periodType: PeriodType) => void
  getLeaderboard: (networkId: string) => LeaderboardCache | undefined
  clearLeaderboardCache: (networkId?: string) => void

  setCurrentPeriod: (period: PeriodType) => void

  // Session tracking
  addSessionStats: (stats: {
    wordsReviewed: number
    wordsMastered: number
    correctCount: number
    totalCount: number
    xpEarned: number
  }) => void
  clearPendingStats: () => void

  setLoading: (loading: boolean) => void
  setSyncing: (syncing: boolean) => void
  setError: (error: string | null) => void

  reset: () => void
}

const initialState = {
  myStats: null,
  leaderboards: new Map(),
  currentPeriod: 'weekly' as PeriodType,
  pendingSessionStats: {
    wordsReviewed: 0,
    wordsMastered: 0,
    correctCount: 0,
    totalCount: 0,
    xpEarned: 0,
  },
  isLoading: false,
  isSyncing: false,
  error: null,
}

export const useCompetitionStore = create<CompetitionState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setMyStats: (stats) => set({ myStats: stats }),

      setLeaderboard: (networkId, entries, periodType) => set((state) => {
        const newLeaderboards = new Map(state.leaderboards)
        newLeaderboards.set(networkId, {
          entries,
          fetchedAt: new Date(),
          periodType,
        })
        return { leaderboards: newLeaderboards }
      }),

      getLeaderboard: (networkId) => get().leaderboards.get(networkId),

      clearLeaderboardCache: (networkId) => set((state) => {
        if (networkId) {
          const newLeaderboards = new Map(state.leaderboards)
          newLeaderboards.delete(networkId)
          return { leaderboards: newLeaderboards }
        }
        return { leaderboards: new Map() }
      }),

      setCurrentPeriod: (period) => set({ currentPeriod: period }),

      addSessionStats: (stats) => set((state) => ({
        pendingSessionStats: {
          wordsReviewed: state.pendingSessionStats.wordsReviewed + stats.wordsReviewed,
          wordsMastered: state.pendingSessionStats.wordsMastered + stats.wordsMastered,
          correctCount: state.pendingSessionStats.correctCount + stats.correctCount,
          totalCount: state.pendingSessionStats.totalCount + stats.totalCount,
          xpEarned: state.pendingSessionStats.xpEarned + stats.xpEarned,
        },
      })),

      clearPendingStats: () => set({
        pendingSessionStats: {
          wordsReviewed: 0,
          wordsMastered: 0,
          correctCount: 0,
          totalCount: 0,
          xpEarned: 0,
        },
      }),

      setLoading: (isLoading) => set({ isLoading }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'competition-storage',
      partialize: (state) => ({
        currentPeriod: state.currentPeriod,
        pendingSessionStats: state.pendingSessionStats,
        // Don't persist leaderboards - fetch fresh
      }),
    }
  )
)

// Selectors
export const selectMyRank = (state: CompetitionState, networkId: string): number | null => {
  const cache = state.leaderboards.get(networkId)
  if (!cache) return null

  // Find current user in leaderboard (would need userId passed in real impl)
  return null
}

export const selectLeaderboardIsStale = (state: CompetitionState, networkId: string): boolean => {
  const cache = state.leaderboards.get(networkId)
  if (!cache) return true

  // Consider stale after 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  return cache.fetchedAt < fiveMinutesAgo
}

export const selectTopThree = (state: CompetitionState, networkId: string): LeaderboardEntry[] => {
  const cache = state.leaderboards.get(networkId)
  if (!cache) return []

  return cache.entries
    .filter((e) => e.role === 'child')
    .slice(0, 3)
}
