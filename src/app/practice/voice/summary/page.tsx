'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { Moon, Zap, Mic } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useVoiceSession, useVoiceSessionStats } from '@/stores/voice-session'
import { getCompletionMessage, getScoreEmoji } from '@/lib/utils/messages'
import { useSound } from '@/hooks/useSound'
import { useHaptics } from '@/hooks/useHaptics'
import { cn } from '@/lib/utils/cn'

export default function VoicePracticeSummaryPage() {
  const router = useRouter()
  const { mode, items, reset } = useVoiceSession()
  const stats = useVoiceSessionStats()

  const { play } = useSound()
  const { trigger } = useHaptics()

  const percentage = stats.totalCount > 0 ? (stats.correctCount / stats.totalCount) * 100 : 0
  const isPerfect = percentage === 100

  const hasPlayedEffects = useRef(false)

  // Celebration effects
  useEffect(() => {
    if (hasPlayedEffects.current || items.length === 0) return
    hasPlayedEffects.current = true

    // Play success sound and haptic
    if (percentage >= 70) {
      play('success')
      trigger('success')
    }

    // Perfect score (100%) - Gold explosion
    if (isPerfect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff'],
      })

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

    // Excellent score (90-99%)
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

    // Good score (80-89%)
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

    // Okay score (70-79%)
    if (percentage >= 70) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#60a5fa', '#34d399'],
      })
    }
  }, [items.length, percentage, isPerfect, play, trigger])

  // Redirect if no session data
  useEffect(() => {
    if (items.length === 0) {
      router.replace('/practice/voice')
    }
  }, [items.length, router])

  const incorrectItems = items.filter((i) => i.answered && !i.correct)

  const handlePracticeAgain = () => {
    reset()
    router.push('/practice/voice')
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
        {/* Mode indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center gap-2 text-gray-500"
        >
          <Mic className="w-4 h-4" />
          <span className="text-sm">Sprachübung</span>
          {mode === 'calm' ? (
            <Moon className="w-4 h-4 text-blue-400" />
          ) : (
            <Zap className="w-4 h-4 text-yellow-400" />
          )}
        </motion.div>

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
          <div className="text-6xl mb-4">
            {getScoreEmoji(stats.correctCount, stats.totalCount)}
          </div>
          <motion.div
            className="text-5xl font-bold text-gray-900 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {stats.correctCount}/{stats.totalCount}
          </motion.div>
          <motion.div
            className={cn(
              'text-lg',
              isPerfect ? 'text-yellow-600 font-semibold' : 'text-gray-500'
            )}
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
          {getCompletionMessage(stats.correctCount, stats.totalCount)}
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
                  <div className="text-2xl font-bold text-success-500">
                    {stats.correctCount}
                  </div>
                  <div className="text-sm text-gray-500">Richtig</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-error-500">
                    {stats.incorrectCount}
                  </div>
                  <div className="text-sm text-gray-500">Falsch</div>
                </div>
              </div>
              {stats.maxStreak >= 3 && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                  <div className="text-2xl font-bold text-warning-500">
                    🔥 {stats.maxStreak}
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
                    className={cn(
                      'py-3',
                      index < incorrectItems.length - 1 && 'border-b border-gray-100'
                    )}
                  >
                    <p className="font-medium text-gray-900">
                      {item.vocabulary.sourceText}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.vocabulary.targetText}
                    </p>
                    {item.extractedAnswer && (
                      <p className="text-sm text-error-500 mt-1">
                        Deine Antwort: &ldquo;{item.extractedAnswer}&rdquo;
                      </p>
                    )}
                    {item.userTranscript && item.userTranscript !== item.extractedAnswer && (
                      <p className="text-xs text-gray-400 mt-1">
                        Gehört: &ldquo;{item.userTranscript}&rdquo;
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
