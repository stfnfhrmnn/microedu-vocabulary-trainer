'use client'

import { motion } from 'framer-motion'

interface WelcomeSlideProps {
  onNext: () => void
}

export function WelcomeSlide({ onNext }: WelcomeSlideProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center px-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-8xl mb-8"
      >
        📚
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-3xl font-bold text-gray-900 mb-4"
      >
        Willkommen!
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-gray-600 mb-8 max-w-xs"
      >
        Lerne Vokabeln spielend leicht mit deinem persönlichen Trainer.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex gap-2 mb-8"
      >
        {['🇫🇷', '🇪🇸', '🇮🇹', '🇬🇧'].map((flag, i) => (
          <motion.span
            key={flag}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7 + i * 0.1 }}
            className="text-3xl"
          >
            {flag}
          </motion.span>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNext}
        className="bg-primary-500 text-white font-semibold px-8 py-4 rounded-2xl text-lg shadow-lg shadow-primary-500/30"
      >
        Los geht's!
      </motion.button>
    </motion.div>
  )
}
