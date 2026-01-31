'use client'

import { useMemo } from 'react'
import {
  usePracticeSession,
  useCurrentItem,
  selectProgressCurrent,
  selectProgressTotal,
  selectProgressAnswered,
  selectProgressCorrect,
  useIsSessionComplete,
  getQuestionAnswer,
} from '@/stores/practice-session'

/**
 * Convenience hook that provides commonly-used practice session values
 * Combines multiple store selectors into a single hook for simpler usage
 */
export function usePractice() {
  // Store values
  const exerciseType = usePracticeSession((s) => s.exerciseType)
  const direction = usePracticeSession((s) => s.direction)
  const targetLanguage = usePracticeSession((s) => s.targetLanguage)
  const isSessionActive = usePracticeSession((s) => s.isSessionActive)
  const isCardFlipped = usePracticeSession((s) => s.isCardFlipped)
  const currentStreak = usePracticeSession((s) => s.currentStreak)
  const maxStreak = usePracticeSession((s) => s.maxStreak)
  const quizMode = usePracticeSession((s) => s.quizMode)
  const currentIndex = usePracticeSession((s) => s.currentIndex)

  // Current item
  const currentItem = usePracticeSession(useCurrentItem)

  // Progress values
  const current = usePracticeSession(selectProgressCurrent)
  const total = usePracticeSession(selectProgressTotal)
  const answered = usePracticeSession(selectProgressAnswered)
  const correct = usePracticeSession(selectProgressCorrect)
  const isComplete = usePracticeSession(useIsSessionComplete)

  // Actions
  const flipCard = usePracticeSession((s) => s.flipCard)
  const nextItem = usePracticeSession((s) => s.nextItem)
  const recordAnswer = usePracticeSession((s) => s.recordAnswer)
  const endSession = usePracticeSession((s) => s.endSession)
  const reset = usePracticeSession((s) => s.reset)

  // Derived: question and answer for current item
  const questionAnswer = useMemo(() => {
    if (!currentItem?.vocabulary) return null
    return getQuestionAnswer(
      currentItem.vocabulary,
      direction,
      currentIndex,
      targetLanguage
    )
  }, [currentItem?.vocabulary, direction, currentIndex, targetLanguage])

  // Accuracy percentage
  const accuracy = useMemo(() => {
    if (answered === 0) return 0
    return Math.round((correct / answered) * 100)
  }, [answered, correct])

  return {
    // Session config
    exerciseType,
    direction,
    targetLanguage,
    quizMode,

    // Session state
    isSessionActive,
    isCardFlipped,
    currentStreak,
    maxStreak,
    currentIndex,

    // Current item
    currentItem,
    questionAnswer,

    // Progress
    progress: {
      current,
      total,
      answered,
      correct,
      accuracy,
    },
    isComplete,

    // Actions
    flipCard,
    nextItem,
    recordAnswer,
    endSession,
    reset,
  }
}

/**
 * Hook for progress bar display
 */
export function usePracticeProgress() {
  const current = usePracticeSession(selectProgressCurrent)
  const total = usePracticeSession(selectProgressTotal)
  const correct = usePracticeSession(selectProgressCorrect)
  const answered = usePracticeSession(selectProgressAnswered)

  const percentage = total > 0 ? (answered / total) * 100 : 0
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0

  return { current, total, correct, answered, percentage, accuracy }
}
