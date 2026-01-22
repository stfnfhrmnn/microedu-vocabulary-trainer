'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getStudyRecommendations,
  getWeakWords,
  getProgressPrediction,
  getDailyGoalSuggestion,
  getOptimalStudyTimes,
  type StudyRecommendation,
  type WeakWord,
  type ProgressPrediction,
  type DailyGoalSuggestion,
  type OptimalStudyTime,
} from '@/lib/learning/study-recommendations'

// ============================================================================
// Main Recommendations Hook
// ============================================================================

export function useStudyRecommendations() {
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getStudyRecommendations()
      setRecommendations(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    recommendations,
    isLoading,
    error,
    refresh,
  }
}

// ============================================================================
// Weak Words Hook
// ============================================================================

export function useWeakWords(limit = 10) {
  const [weakWords, setWeakWords] = useState<WeakWord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const result = await getWeakWords(limit)
        if (mounted) {
          setWeakWords(result)
        }
      } catch (err) {
        console.error('Failed to load weak words:', err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [limit])

  return {
    weakWords,
    isLoading,
    strugglingCount: weakWords.filter(w => w.difficulty === 'struggling').length,
    veryHardCount: weakWords.filter(w => w.difficulty === 'very_hard').length,
    hardCount: weakWords.filter(w => w.difficulty === 'hard').length,
  }
}

// ============================================================================
// Progress Prediction Hook
// ============================================================================

export function useProgressPrediction() {
  const [prediction, setPrediction] = useState<ProgressPrediction | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const result = await getProgressPrediction()
        if (mounted) {
          setPrediction(result)
        }
      } catch (err) {
        console.error('Failed to load progress prediction:', err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  return {
    prediction,
    isLoading,
  }
}

// ============================================================================
// Daily Goal Suggestion Hook
// ============================================================================

export function useDailyGoalSuggestion() {
  const [suggestion, setSuggestion] = useState<DailyGoalSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getDailyGoalSuggestion()
      setSuggestion(result)
    } catch (err) {
      console.error('Failed to load goal suggestion:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    suggestion,
    isLoading,
    refresh,
  }
}

// ============================================================================
// Optimal Study Times Hook
// ============================================================================

export function useOptimalStudyTimes() {
  const [times, setTimes] = useState<OptimalStudyTime[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const result = await getOptimalStudyTimes()
        if (mounted) {
          setTimes(result)
        }
      } catch (err) {
        console.error('Failed to load optimal times:', err)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  // Check if now is a good time
  const now = new Date()
  const currentHour = now.getHours()
  const currentDay = now.getDay()

  const isNowOptimal = times.some(t =>
    t.hour === currentHour &&
    t.dayOfWeek === currentDay &&
    t.averageAccuracy > 0.7
  )

  const bestTime = times.length > 0 ? times[0] : null

  return {
    times,
    isLoading,
    isNowOptimal,
    bestTime,
  }
}
