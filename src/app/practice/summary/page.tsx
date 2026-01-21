'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { usePracticeSession, selectProgressTotal } from '@/stores/practice-session'
import { getCompletionMessage, getScoreEmoji } from '@/lib/utils/messages'
import { useSound } from '@/hooks/useSound'
import { useHaptics } from '@/hooks/useHaptics'
import { useGamification } from '@/stores/gamification'
import { useOnboarding } from '@/stores/onboarding'
import { useAchievements } from '@/stores/achievements'

export default function PracticeSummaryPage() {
  const router = useRouter()
  const items = usePracticeSession((state) => state.items)
  const maxStreak = usePracticeSession((state) => state.maxStreak)
  const quizMode = usePracticeSession((state) => state.quizMode)
  const reset = usePracticeSession((state) => state.reset)
  const progressTotal = usePracticeSession(selectProgressTotal)

  const { play } = useSound()
  const { trigger } = useHaptics()
  const recordSessionComplete = useGamification((s) => s.recordSessionComplete)
  const currentStreak = useGamification((s) => s.currentStreak)
  const longestStreak = useGamification((s) => s.longestStreak)
  const dailyGoal = useOnboarding((s) => s.dailyGoal)
  const recordSession = useAchievements((s) => s.recordSession)
  const recordWordsLearned = useAchievements((s) => s.recordWordsLearned)
  const checkAndUnlockAchievements = useAchievements((s) => s.checkAndUnlockAchievements)

  const correctCount = items.filter((i) => i.correct).length
  const incorrectItems = items.filter((i) => !i.correct)
  const percentage = progressTotal > 0 ? (correctCount / progressTotal) * 100 : 0
  const isPerfect = percentage === 100

  // Track XP bonuses from session completion
  const [sessionBonuses, setSessionBonuses] = useState<{ xpGained: number; bonuses: string[] } | null>(null)
  const hasRecordedSession = useRef(false)

  // Record session completion for gamification bonuses (only once)
  useEffect(() => {
    if (items.length > 0 && !hasRecordedSession.current) {
      hasRecordedSession.current = true
      const result = recordSessionComplete(correctCount, progressTotal, dailyGoal)
      if (result.xpGained > 0) {
        setSessionBonuses(result)
      }

      // Record session for achievements
      const isParentQuiz = quizMode === 'parent'
      recordSession(correctCount, progressTotal, isParentQuiz)
      recordWordsLearned(progressTotal)

      // Check and unlock achievements
      checkAndUnlockAchievements(currentStreak, longestStreak, isParentQuiz)
    }
  }, [
    items.length,
    correctCount,
    progressTotal,
    dailyGoal,
    quizMode,
    currentStreak,
    longestStreak,
    recordSessionComplete,
    recordSession,
    recordWordsLearned,
    checkAndUnlockAchievements,
  ])

  // Tiered celebration effects based on score
  useEffect(() => {
    // Play success sound and haptic
    if (percentage >= 70) {
      play('success')
      trigger('success')
    }

    // Perfect score (100%) - Gold explosion with star burst
    if (isPerfect) {
      // Initial big burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
      })

      // Star burst effect
      setTimeout(() => {
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

        const interval = setInterval(() => {
          confetti({
            ...defaults,
            particleCount: 30,
            origin: { x: randomInRange(0.2, 0.8), y: randomInRange(0.2, 0.6) },
            colors: ['#fbbf24', '#ffffff'],
          })
        }, 250)

        setTimeout(() => clearInterval(interval), 2000)
      }, 500)

      return
    }

    // Excellent score (90-99%) - Silver confetti with sparkles
    if (percentage >= 90) {
      const duration = 2500
      const end = Date.now() + duration
      const colors = ['#94a3b8', '#cbd5e1', '#e2e8f0', '#ffffff']

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
      return
    }

    // Good score (80-89%) - Bronze confetti
    if (percentage >= 80) {
      const duration = 2000
      const end = Date.now() + duration
      const colors = ['#22c55e', '#3b82f6', '#f59e0b']

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
      return
    }

    // Okay score (70-79%) - Subtle particle burst
    if (percentage >= 70) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#60a5fa', '#34d399'],
      })
    }
  }, [percentage, isPerfect, play, trigger])

  const practiceBasePath = quizMode === 'parent' ? '/practice/parent-quiz' : '/practice'

  // Redirect if no session data
  useEffect(() => {
    if (items.length === 0) {
      router.replace(practiceBasePath)
    }
  }, [items.length, router, practiceBasePath])

  const handlePracticeAgain = () => {
    reset()
    router.push(practiceBasePath)
  }

  const handleGoHome = () => {
    reset()
    router.push('/')
  }

  if (items.length === 0) {
    return null
  }

  return (
    <PageContainer>
      <div className="flex flex-col items-center pt-8">
        {/* Perfect Banner */}
        {isPerfect && (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
            className="mb-4"
          >
            <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 text-white font-bold text-2xl px-8 py-2 rounded-full shadow-lg">
              PERFEKT!
            </div>
          </motion.div>
        )}

        {/* Score */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">{getScoreEmoji(correctCount, progressTotal)}</div>
          <motion.div
            className="text-5xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {correctCount}/{progressTotal}
          </motion.div>
          <motion.div
            className={`text-lg ${isPerfect ? 'text-yellow-600 font-semibold' : 'text-gray-500'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {Math.round(percentage)}% richtig
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-700 text-center mb-8 px-4"
        >
          {getCompletionMessage(correctCount, progressTotal)}
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full mb-6"
        >
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-success-500">{correctCount}</div>
                  <div className="text-sm text-gray-500">Richtig</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-error-500">
                    {progressTotal - correctCount}
                  </div>
                  <div className="text-sm text-gray-500">Falsch</div>
                </div>
              </div>
              {maxStreak >= 3 && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <div className="text-2xl font-bold text-warning-500">
                    🔥 {maxStreak}
                  </div>
                  <div className="text-sm text-gray-500">Längste Serie</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* XP Bonuses */}
        {sessionBonuses && sessionBonuses.xpGained > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="w-full mb-6"
          >
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 border-purple-500">
              <CardContent>
                <div className="text-white text-center">
                  <div className="text-3xl font-bold mb-1">
                    +{sessionBonuses.xpGained} XP
                  </div>
                  <div className="text-purple-200 text-sm space-y-1">
                    {sessionBonuses.bonuses.map((bonus, i) => (
                      <p key={i}>{bonus}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Incorrect items */}
        {incorrectItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full mb-6"
          >
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Zum Wiederholen
            </h3>
            <Card>
              <CardContent padding="sm">
                {incorrectItems.map((item, index) => (
                  <div
                    key={item.vocabulary.id}
                    className={`py-3 ${
                      index < incorrectItems.length - 1
                        ? 'border-b border-gray-100'
                        : ''
                    }`}
                  >
                    <p className="font-medium text-gray-900">
                      {item.vocabulary.sourceText}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.vocabulary.targetText}
                    </p>
                    {item.userAnswer && (
                      <p className="text-sm text-error-500 mt-1">
                        Deine Antwort: {item.userAnswer}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full space-y-3"
        >
          <Button variant="primary" fullWidth onClick={handlePracticeAgain}>
            Nochmal üben
          </Button>
          <Button variant="secondary" fullWidth onClick={handleGoHome}>
            Zur Startseite
          </Button>
        </motion.div>
      </div>
    </PageContainer>
  )
}
