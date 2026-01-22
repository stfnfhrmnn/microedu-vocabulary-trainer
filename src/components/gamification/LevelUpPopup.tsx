'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useGamification } from '@/stores/gamification'
import { getLevelTitle } from '@/lib/gamification/xp'
import { useSound } from '@/hooks/useSound'
import { useHaptics } from '@/hooks/useHaptics'

// Level milestone emojis and colors
const LEVEL_THEMES: Record<number, { emoji: string; color: string }> = {
  5: { emoji: '🥉', color: '#cd7f32' }, // Bronze
  10: { emoji: '🥈', color: '#c0c0c0' }, // Silver
  15: { emoji: '🥇', color: '#ffd700' }, // Gold
  20: { emoji: '💎', color: '#b9f2ff' }, // Platinum
  25: { emoji: '👑', color: '#e5e4e2' }, // Diamond
}

function getLevelEmoji(level: number): string {
  // Check for milestone levels
  if (LEVEL_THEMES[level]) {
    return LEVEL_THEMES[level].emoji
  }
  // Default emoji based on level range
  if (level >= 20) return '⭐'
  if (level >= 15) return '🌟'
  if (level >= 10) return '✨'
  if (level >= 5) return '🎯'
  return '🎉'
}

function getConfettiColors(level: number): string[] {
  if (level >= 25) return ['#e5e4e2', '#b9f2ff', '#ffd700', '#ffffff'] // Diamond
  if (level >= 20) return ['#b9f2ff', '#00ffff', '#87ceeb', '#ffffff'] // Platinum
  if (level >= 15) return ['#ffd700', '#ffc107', '#ffeb3b', '#fff176'] // Gold
  if (level >= 10) return ['#c0c0c0', '#d3d3d3', '#a8a8a8', '#e8e8e8'] // Silver
  if (level >= 5) return ['#cd7f32', '#d4a76a', '#8b4513', '#deb887'] // Bronze
  return ['#3b82f6', '#22c55e', '#f59e0b', '#ec4899'] // Default
}

export function LevelUpPopup() {
  const pendingLevelUp = useGamification((s) => s.pendingLevelUp)
  const clearPendingLevelUp = useGamification((s) => s.clearPendingLevelUp)
  const [showingLevel, setShowingLevel] = useState<number | null>(null)
  const { play } = useSound()
  const { trigger } = useHaptics()

  useEffect(() => {
    if (pendingLevelUp && !showingLevel) {
      setShowingLevel(pendingLevelUp)

      // Play celebration
      play('success')
      trigger('success')

      // Multiple confetti bursts for level-up celebration
      const colors = getConfettiColors(pendingLevelUp)

      // Center burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      })

      // Left burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })
      }, 200)

      // Right burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })
      }, 400)
    }
  }, [pendingLevelUp, showingLevel, play, trigger])

  const handleDismiss = () => {
    setShowingLevel(null)
    clearPendingLevelUp()
  }

  const levelTitle = showingLevel ? getLevelTitle(showingLevel) : null
  const levelEmoji = showingLevel ? getLevelEmoji(showingLevel) : '🎉'
  const isMilestone = showingLevel && showingLevel in LEVEL_THEMES

  return (
    <AnimatePresence>
      {showingLevel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Level icon with animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-7xl mb-4"
            >
              {levelEmoji}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-primary-600 font-semibold uppercase tracking-wider mb-2"
            >
              Level Up!
            </motion.h2>

            {/* Level number */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="mb-2"
            >
              <span className="text-5xl font-bold text-gray-900">
                Level {showingLevel}
              </span>
            </motion.div>

            {/* Level title (for milestone levels) */}
            {levelTitle && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={`text-xl font-semibold mb-4 ${
                  isMilestone ? 'text-warning-600' : 'text-gray-600'
                }`}
              >
                {levelTitle}
              </motion.p>
            )}

            {/* Motivational message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 mb-6"
            >
              {isMilestone
                ? 'Du hast einen Meilenstein erreicht!'
                : 'Weiter so, du machst tolle Fortschritte!'}
            </motion.p>

            {/* Dismiss button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDismiss}
              className="bg-primary-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-primary-500/30"
            >
              Weiter!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
