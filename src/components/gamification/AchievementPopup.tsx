'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { getAchievementById } from '@/lib/gamification/achievements'
import { useAchievements } from '@/stores/achievements'
import { useSound } from '@/hooks/useSound'
import { useHaptics } from '@/hooks/useHaptics'

export function AchievementPopup() {
  const pendingUnlocks = useAchievements((s) => s.pendingUnlocks)
  const clearPendingUnlocks = useAchievements((s) => s.clearPendingUnlocks)
  const [currentAchievement, setCurrentAchievement] = useState<string | null>(null)
  const { play } = useSound()
  const { trigger } = useHaptics()

  useEffect(() => {
    if (pendingUnlocks.length > 0 && !currentAchievement) {
      const nextId = pendingUnlocks[0]
      setCurrentAchievement(nextId)

      // Play celebration
      play('achievement')
      trigger('success')

      // Confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#22c55e'],
      })
    }
  }, [pendingUnlocks, currentAchievement, play, trigger])

  const handleDismiss = () => {
    setCurrentAchievement(null)
    clearPendingUnlocks()
  }

  const achievement = currentAchievement
    ? getAchievementById(currentAchievement)
    : null

  return (
    <AnimatePresence>
      {achievement && (
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
            {/* Achievement icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-7xl mb-4"
            >
              {achievement.icon}
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-primary-600 font-semibold uppercase tracking-wider mb-2"
            >
              Errungenschaft freigeschaltet!
            </motion.h2>

            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              {achievement.name}
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-gray-600 mb-6"
            >
              {achievement.description}
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
              Super!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
