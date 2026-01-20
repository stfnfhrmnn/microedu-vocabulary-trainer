'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ParentQuizCard } from '@/components/practice/ParentQuizCard'
import {
  ParentRatingButtons,
  mapParentRating,
  type ParentRating,
} from '@/components/practice/ParentRatingButtons'
import { ProgressBar } from '@/components/practice/ProgressBar'
import {
  usePracticeSession,
  useCurrentItem,
  useSessionProgress,
  useIsSessionComplete,
  getQuestionAnswer,
} from '@/stores/practice-session'
import { calculateNextReview } from '@/lib/learning/sm2'
import {
  getOrCreateProgress,
  updateProgress,
  createReviewSession,
  createReviewAttempt,
  completeReviewSession,
} from '@/lib/db/db'
import { getCorrectMessage, getIncorrectMessage, getStreakMessage } from '@/lib/utils/messages'

export default function ParentQuizSessionPage() {
  const router = useRouter()

  const direction = usePracticeSession((state) => state.direction)
  const items = usePracticeSession((state) => state.items)
  const currentIndex = usePracticeSession((state) => state.currentIndex)
  const isSessionActive = usePracticeSession((state) => state.isSessionActive)
  const currentStreak = usePracticeSession((state) => state.currentStreak)
  const sectionIds = usePracticeSession((state) => state.sectionIds)
  const quizMode = usePracticeSession((state) => state.quizMode)

  const currentItem = usePracticeSession(useCurrentItem)
  const progress = usePracticeSession(useSessionProgress)
  const isComplete = usePracticeSession(useIsSessionComplete)

  const recordAnswer = usePracticeSession((state) => state.recordAnswer)
  const nextItem = usePracticeSession((state) => state.nextItem)
  const endSession = usePracticeSession((state) => state.endSession)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [showStreakMessage, setShowStreakMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Redirect if no active session or wrong quiz mode
  useEffect(() => {
    if (!isSessionActive && items.length === 0) {
      router.replace('/practice/parent-quiz')
    } else if (quizMode !== 'parent' && items.length > 0) {
      router.replace('/practice/parent-quiz')
    }
  }, [isSessionActive, items.length, quizMode, router])

  // Create session record on mount
  useEffect(() => {
    async function initSession() {
      if (items.length > 0 && !sessionId) {
        const session = await createReviewSession({
          exerciseType: 'flashcard',
          direction,
          sectionIds,
          totalItems: items.length,
          correctCount: 0,
          startedAt: new Date(),
        })
        setSessionId(session.id)
      }
    }
    initSession()
  }, [items.length, direction, sectionIds, sessionId])

  // Navigate to summary when complete
  useEffect(() => {
    if (isComplete && sessionId) {
      const correctCount = items.filter((i) => i.correct).length
      completeReviewSession(sessionId, correctCount).then(() => {
        router.push('/practice/summary')
      })
    }
  }, [isComplete, sessionId, items, router])

  const handleRate = useCallback(
    async (rating: ParentRating) => {
      if (!currentItem || !sessionId || isProcessing) return

      setIsProcessing(true)

      const isCorrect = rating === 'correct'
      const qualityRating = mapParentRating(rating)

      // Update session state
      recordAnswer(isCorrect, qualityRating)

      // Show feedback message
      const message = isCorrect ? getCorrectMessage() : getIncorrectMessage()
      setFeedbackMessage(message)
      setTimeout(() => setFeedbackMessage(null), 1200)

      // Check for streak milestone
      if (isCorrect) {
        const newStreak = currentStreak + 1
        const streakMsg = getStreakMessage(newStreak)
        if (streakMsg) {
          setShowStreakMessage(streakMsg)
          setTimeout(() => setShowStreakMessage(null), 1800)
        }
      }

      // Update learning progress in database
      const vocabProgress = await getOrCreateProgress(currentItem.vocabulary.id)
      const sm2Result = calculateNextReview(
        {
          easeFactor: vocabProgress.easeFactor,
          interval: vocabProgress.interval,
          repetitions: vocabProgress.repetitions,
        },
        qualityRating
      )

      await updateProgress(vocabProgress.id, {
        ...sm2Result,
        totalReviews: vocabProgress.totalReviews + 1,
        correctReviews: vocabProgress.correctReviews + (isCorrect ? 1 : 0),
        lastReviewDate: new Date(),
      })

      // Record attempt
      await createReviewAttempt({
        sessionId,
        vocabularyId: currentItem.vocabulary.id,
        exerciseType: 'flashcard',
        direction,
        userAnswer: '',
        wasCorrect: isCorrect,
        qualityRating,
        responseTimeMs: 0,
      })

      // Move to next item after short delay
      setTimeout(() => {
        nextItem()
        setIsProcessing(false)
      }, 300)
    },
    [
      currentItem,
      sessionId,
      isProcessing,
      direction,
      currentStreak,
      recordAnswer,
      nextItem,
    ]
  )

  const handleQuit = () => {
    endSession()
    router.push('/practice/parent-quiz')
  }

  if (!currentItem) {
    return null
  }

  const { question, answer } = getQuestionAnswer(
    currentItem.vocabulary,
    direction,
    currentIndex
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleQuit}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Beenden
        </button>
        <div className="text-sm text-gray-600 font-medium">
          {progress.answered + 1} von {progress.total}
        </div>
        <div className="w-16" /> {/* Spacer for balance */}
      </div>

      {/* Progress bar */}
      <ProgressBar
        current={progress.answered}
        total={progress.total}
        className="mx-4 mt-3"
      />

      {/* Streak indicator */}
      {currentStreak >= 3 && (
        <div className="bg-warning-50 px-4 py-2 text-center mt-3 mx-4 rounded-xl">
          <span className="text-warning-700 font-medium">
            🔥 {currentStreak} in Folge!
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 px-4 py-6 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentItem.vocabulary.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ParentQuizCard
              question={question}
              answer={answer}
              notes={currentItem.vocabulary.notes}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rating buttons */}
      <div className="px-4 pb-8 pt-4 bg-white border-t border-gray-100">
        <ParentRatingButtons onRate={handleRate} disabled={isProcessing} />
      </div>

      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-36 left-4 right-4 z-50"
          >
            <div className="bg-gray-900 text-white rounded-xl py-3 px-4 text-center font-medium shadow-lg max-w-sm mx-auto">
              {feedbackMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak milestone message */}
      <AnimatePresence>
        {showStreakMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-warning-500 text-white rounded-3xl py-6 px-8 text-center shadow-xl">
              <p className="text-4xl mb-2">🔥</p>
              <p className="text-xl font-bold">{showStreakMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
