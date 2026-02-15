'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { FlashCard } from '@/components/practice/FlashCard'
import { AnswerButtons } from '@/components/practice/AnswerButtons'
import { MultipleChoice, generateOptions } from '@/components/practice/MultipleChoice'
import { TypedAnswer } from '@/components/practice/TypedAnswer'
import { ProgressBar } from '@/components/practice/ProgressBar'
import {
  usePracticeSession,
  useCurrentItem,
  selectProgressAnswered,
  selectProgressTotal,
  useIsSessionComplete,
  getQuestionAnswer,
} from '@/stores/practice-session'
import { useSettings } from '@/stores/settings'
import { calculateNextReview, mapUserRating } from '@/lib/learning/sm2'
import { getOrCreateProgress, updateProgress, createReviewSession, createReviewAttempt, completeReviewSession } from '@/lib/db/db'
import { getCorrectMessage, getIncorrectMessage, getStreakMessage } from '@/lib/utils/messages'
import { useSound } from '@/hooks/useSound'
import { useHaptics } from '@/hooks/useHaptics'
import { useGamification } from '@/stores/gamification'
import { useAchievements } from '@/stores/achievements'

export default function PracticeSessionPage() {
  const router = useRouter()
  const typingStrictness = useSettings((s) => s.typingStrictness)
  const { play } = useSound()
  const { trigger } = useHaptics()
  const recordCorrectAnswer = useGamification((s) => s.recordCorrectAnswer)
  const recordCorrectForAchievement = useAchievements((s) => s.recordCorrectAnswer)
  const recordIncorrectForAchievement = useAchievements((s) => s.recordIncorrectAnswer)

  const exerciseType = usePracticeSession((state) => state.exerciseType)
  const direction = usePracticeSession((state) => state.direction)
  const items = usePracticeSession((state) => state.items)
  const currentIndex = usePracticeSession((state) => state.currentIndex)
  const isSessionActive = usePracticeSession((state) => state.isSessionActive)
  const isCardFlipped = usePracticeSession((state) => state.isCardFlipped)
  const currentStreak = usePracticeSession((state) => state.currentStreak)
  const sectionIds = usePracticeSession((state) => state.sectionIds)
  const targetLanguage = usePracticeSession((state) => state.targetLanguage)
  const quizMode = usePracticeSession((state) => state.quizMode)
  const learnerProfileId = usePracticeSession((state) => state.learnerProfileId)
  const learnerProfileName = usePracticeSession((state) => state.learnerProfileName)

  const currentItem = usePracticeSession(useCurrentItem)
  const progressAnswered = usePracticeSession(selectProgressAnswered)
  const progressTotal = usePracticeSession(selectProgressTotal)
  const isComplete = usePracticeSession(useIsSessionComplete)

  const recordAnswer = usePracticeSession((state) => state.recordAnswer)
  const nextItem = usePracticeSession((state) => state.nextItem)
  const flipCard = usePracticeSession((state) => state.flipCard)
  const endSession = usePracticeSession((state) => state.endSession)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [showStreakMessage, setShowStreakMessage] = useState<string | null>(null)
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState<string>('')
  const [itemStartTime, setItemStartTime] = useState<number>(Date.now())

  // Redirect if no active session
  useEffect(() => {
    if (!isSessionActive && items.length === 0) {
      router.replace('/practice')
    }
  }, [isSessionActive, items.length, router])

  // Reset item start time when moving to a new item
  useEffect(() => {
    setItemStartTime(Date.now())
  }, [currentIndex])

  // Create session record on mount
  useEffect(() => {
    async function initSession() {
      if (items.length > 0 && !sessionId) {
        const session = await createReviewSession({
          exerciseType,
          direction,
          sectionIds,
          quizMode,
          learnerProfileId,
          learnerProfileName,
          totalItems: items.length,
          correctCount: 0,
          startedAt: new Date(),
        })
        setSessionId(session.id)
      }
    }
    initSession()
  }, [
    items.length,
    exerciseType,
    direction,
    sectionIds,
    quizMode,
    learnerProfileId,
    learnerProfileName,
    sessionId,
  ])

  // Navigate to summary when complete
  useEffect(() => {
    if (isComplete && sessionId) {
      const correctCount = items.filter((i) => i.correct).length
      completeReviewSession(sessionId, correctCount).then(() => {
        router.push('/practice/summary')
      })
    }
  }, [isComplete, sessionId, items, router])

  const handleAnswer = useCallback(
    async (
      rating: 'didnt_know' | 'almost' | 'knew_it',
      userAnswer?: string
    ) => {
      if (!currentItem || !sessionId) return

      const isCorrect = rating === 'knew_it'
      const qualityRating = mapUserRating(rating)

      // Update session state
      recordAnswer(isCorrect, qualityRating, userAnswer)

      // Play sound and haptic feedback
      if (isCorrect) {
        play('correct')
        trigger('success')
        // Award XP for correct answer
        recordCorrectAnswer(exerciseType)
        // Track for achievements
        recordCorrectForAchievement()
      } else {
        play('incorrect')
        trigger('error')
        // Track for achievements (resets streak)
        recordIncorrectForAchievement()
      }

      // Show feedback message
      const message = isCorrect ? getCorrectMessage() : getIncorrectMessage()
      setFeedbackMessage(message)
      // Announce to screen readers
      setScreenReaderAnnouncement(
        isCorrect
          ? `Richtig! ${message}. Frage ${progressAnswered + 1} von ${progressTotal}.`
          : `Falsch. Die richtige Antwort war: ${currentItem.vocabulary.targetText}. ${message}`
      )
      setTimeout(() => setFeedbackMessage(null), 1500)

      // Check for streak milestone
      if (isCorrect) {
        const newStreak = currentStreak + 1
        const streakMsg = getStreakMessage(newStreak)
        if (streakMsg) {
          play('streak')
          trigger('heavy')
          setShowStreakMessage(streakMsg)
          setTimeout(() => setShowStreakMessage(null), 2000)
        }
      }

      // Parent quiz runs against a selected learner profile context.
      // Until per-learner progress storage is available, avoid mutating local SM-2 progress
      // to prevent parent sessions from affecting the active account's schedule.
      if (quizMode !== 'parent') {
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
      }

      // Record attempt
      await createReviewAttempt({
        sessionId,
        vocabularyId: currentItem.vocabulary.id,
        exerciseType,
        direction,
        quizMode,
        learnerProfileId,
        learnerProfileName,
        userAnswer: userAnswer || '',
        wasCorrect: isCorrect,
        qualityRating,
        responseTimeMs: Date.now() - itemStartTime,
      })

      // Move to next item after delay
      setTimeout(() => {
        nextItem()
      }, 500)
    },
    [
      currentItem,
      sessionId,
      exerciseType,
      direction,
      quizMode,
      learnerProfileId,
      learnerProfileName,
      currentStreak,
      progressAnswered,
      progressTotal,
      recordAnswer,
      nextItem,
      play,
      trigger,
      recordCorrectAnswer,
      recordCorrectForAchievement,
      recordIncorrectForAchievement,
      itemStartTime,
    ]
  )

  const handleFlashcardAnswer = (rating: 'didnt_know' | 'almost' | 'knew_it') => {
    handleAnswer(rating)
  }

  const handleMultipleChoiceAnswer = (userAnswer: string, isCorrect: boolean) => {
    const rating = isCorrect ? 'knew_it' : 'didnt_know'
    handleAnswer(rating, userAnswer)
  }

  const handleTypedAnswer = (userAnswer: string, isCorrect: boolean) => {
    const rating = isCorrect ? 'knew_it' : 'didnt_know'
    handleAnswer(rating, userAnswer)
  }

  const handleFlip = () => {
    play('flip')
    trigger('light')
    flipCard()
  }

  const handleQuit = () => {
    endSession()
    router.push('/practice')
  }

  if (!currentItem) {
    return null
  }

  const { question, answer, isReversed, questionLanguage, answerLanguage } = getQuestionAnswer(
    currentItem.vocabulary,
    direction,
    currentIndex,
    targetLanguage
  )

  // Get all answers for multiple choice distractors
  const allAnswers = items.map((item) =>
    isReversed ? item.vocabulary.sourceText : item.vocabulary.targetText
  )

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button
          onClick={handleQuit}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <ProgressBar
          current={progressAnswered}
          total={progressTotal}
          className="flex-1 mx-4"
        />
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Streak indicator */}
      {currentStreak >= 3 && (
        <div className="bg-warning-50 px-4 py-2 text-center">
          <span className="text-warning-700 font-medium">
            🔥 {currentStreak} in Folge!
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        {exerciseType === 'flashcard' && (
          <div className="space-y-6">
            <FlashCard
              question={question}
              answer={answer}
              isFlipped={isCardFlipped}
              onFlip={handleFlip}
              notes={currentItem.vocabulary.notes}
              questionLanguage={questionLanguage}
              answerLanguage={answerLanguage}
            />

            <AnimatePresence>
              {isCardFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <AnswerButtons onAnswer={handleFlashcardAnswer} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {exerciseType === 'multipleChoice' && (
          <MultipleChoice
            question={question}
            correctAnswer={answer}
            options={generateOptions(answer, allAnswers)}
            onAnswer={handleMultipleChoiceAnswer}
          />
        )}

        {exerciseType === 'typed' && (
          <TypedAnswer
            question={question}
            correctAnswer={answer}
            strictness={typingStrictness}
            onAnswer={handleTypedAnswer}
            questionLanguage={questionLanguage}
            answerLanguage={answerLanguage}
          />
        )}
      </div>

      {/* Feedback message */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 z-50"
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

      {/* Screen reader live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {screenReaderAnnouncement}
      </div>
    </div>
  )
}
