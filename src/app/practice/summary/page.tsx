'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { usePracticeSession, useSessionProgress } from '@/stores/practice-session'
import { getCompletionMessage, getScoreEmoji } from '@/lib/utils/messages'

export default function PracticeSummaryPage() {
  const router = useRouter()
  const items = usePracticeSession((state) => state.items)
  const maxStreak = usePracticeSession((state) => state.maxStreak)
  const quizMode = usePracticeSession((state) => state.quizMode)
  const reset = usePracticeSession((state) => state.reset)
  const progress = usePracticeSession(useSessionProgress)

  const correctCount = items.filter((i) => i.correct).length
  const incorrectItems = items.filter((i) => !i.correct)
  const percentage = progress.total > 0 ? (correctCount / progress.total) * 100 : 0

  // Trigger confetti for good performance
  useEffect(() => {
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
    }
  }, [percentage])

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
        {/* Score */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="text-6xl mb-4">{getScoreEmoji(correctCount, progress.total)}</div>
          <div className="text-5xl font-bold text-gray-900 mb-2">
            {correctCount}/{progress.total}
          </div>
          <div className="text-lg text-gray-500">
            {Math.round(percentage)}% richtig
          </div>
        </motion.div>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-700 text-center mb-8 px-4"
        >
          {getCompletionMessage(correctCount, progress.total)}
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
                    {progress.total - correctCount}
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
