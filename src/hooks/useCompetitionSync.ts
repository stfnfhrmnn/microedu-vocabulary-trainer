'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useGamification } from '@/stores/gamification'
import { useCompetitionStore } from '@/stores/competition'

/**
 * Hook to sync practice session results with competition stats
 * Call submitToNetwork after each practice session to update leaderboards
 */
export function useCompetitionSync() {
  const { currentStreak } = useGamification()
  const { addSessionStats, pendingSessionStats, clearPendingStats, setSyncing } = useCompetitionStore()
  const lastSubmittedRef = useRef<number>(0)

  /**
   * Record a practice session for later submission
   */
  const recordPracticeSession = useCallback((
    wordsReviewed: number,
    wordsMastered: number,
    correctCount: number,
    totalCount: number,
    xpEarned: number
  ) => {
    addSessionStats({
      wordsReviewed,
      wordsMastered,
      correctCount,
      totalCount,
      xpEarned,
    })
  }, [addSessionStats])

  /**
   * Submit pending stats to the server
   */
  const submitToServer = useCallback(async () => {
    // Avoid duplicate submissions within 5 seconds
    const now = Date.now()
    if (now - lastSubmittedRef.current < 5000) {
      return
    }

    // Only submit if there are pending stats
    if (pendingSessionStats.wordsReviewed === 0) {
      return
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('sync-auth-token') : null
    if (!token) {
      console.warn('No auth token, skipping stats submission')
      return
    }

    setSyncing(true)
    try {
      const response = await fetch('/api/stats/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...pendingSessionStats,
          streakDays: currentStreak,
        }),
      })

      if (response.ok) {
        lastSubmittedRef.current = now
        clearPendingStats()
      } else {
        console.warn('Failed to submit stats:', await response.text())
      }
    } catch (error) {
      console.error('Error submitting stats:', error)
    } finally {
      setSyncing(false)
    }
  }, [pendingSessionStats, currentStreak, clearPendingStats, setSyncing])

  /**
   * Combined method to record and immediately submit
   */
  const recordAndSubmit = useCallback(async (
    wordsReviewed: number,
    wordsMastered: number,
    correctCount: number,
    totalCount: number,
    xpEarned: number
  ) => {
    recordPracticeSession(wordsReviewed, wordsMastered, correctCount, totalCount, xpEarned)
    // Small delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 100))
    await submitToServer()
  }, [recordPracticeSession, submitToServer])

  // Auto-submit pending stats when there are changes and user goes offline
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSessionStats.wordsReviewed > 0) {
        // Use sendBeacon for reliable submission on page close
        const token = localStorage.getItem('sync-auth-token')
        if (token) {
          const data = JSON.stringify({
            ...pendingSessionStats,
            streakDays: currentStreak,
          })
          navigator.sendBeacon('/api/stats/submit', new Blob([data], { type: 'application/json' }))
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pendingSessionStats, currentStreak])

  return {
    recordPracticeSession,
    submitToServer,
    recordAndSubmit,
    pendingStats: pendingSessionStats,
    hasPendingStats: pendingSessionStats.wordsReviewed > 0,
  }
}

/**
 * Helper to calculate mastered words from a practice session
 */
export function calculateMasteredWords(
  items: Array<{ vocabularyId: string; wasCorrect: boolean; progress?: { interval: number } }>
): number {
  // A word is considered "mastered" if it was answered correctly and has interval >= 21 days
  return items.filter(
    (item) => item.wasCorrect && item.progress && item.progress.interval >= 21
  ).length
}
