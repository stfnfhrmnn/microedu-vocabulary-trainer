'use client'

import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

interface SetupCompleteProps {
  userName: string
  dailyGoal: number
  onComplete: () => void
}

export function SetupComplete({ userName, dailyGoal, onComplete }: SetupCompleteProps) {
  useEffect(() => {
    // Celebration confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#22c55e', '#fbbf24'],
    })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center px-6"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-8xl mb-6"
      >
        🎉
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-2xl font-bold text-gray-900 mb-2"
      >
        Perfekt, {userName || 'du bist'}!
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-gray-600 mb-8 max-w-xs"
      >
        Du bist bereit zum Lernen!
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-primary-50 rounded-2xl p-6 mb-8 w-full max-w-xs"
      >
        <p className="text-sm text-primary-600 font-medium mb-2">Dein Tagesziel</p>
        <p className="text-4xl font-bold text-primary-700">{dailyGoal}</p>
        <p className="text-primary-600">Vokabeln pro Tag</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-left bg-gray-50 rounded-2xl p-4 mb-8 w-full max-w-xs"
      >
        <p className="text-sm font-medium text-gray-700 mb-3">Deine nächsten Schritte:</p>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xl">1️⃣</span>
            <span className="text-sm text-gray-600">Erstelle dein erstes Buch</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl">2️⃣</span>
            <span className="text-sm text-gray-600">Füge Vokabeln hinzu</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl">3️⃣</span>
            <span className="text-sm text-gray-600">Starte deine erste Übung</span>
          </div>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        whileTap={{ scale: 0.95 }}
        onClick={onComplete}
        className="bg-primary-500 text-white font-semibold px-8 py-4 rounded-2xl text-lg shadow-lg shadow-primary-500/30 w-full max-w-xs"
      >
        Jetzt loslegen!
      </motion.button>
    </motion.div>
  )
}
