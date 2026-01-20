'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface GoalSelectionProps {
  selectedGoal: number
  onSelectGoal: (goal: number) => void
  onNext: () => void
  onBack: () => void
}

const goals = [
  { value: 5, label: 'Entspannt', description: '5 Vokabeln pro Tag', icon: '🌿' },
  { value: 15, label: 'Normal', description: '15 Vokabeln pro Tag', icon: '📖', recommended: true },
  { value: 30, label: 'Intensiv', description: '30 Vokabeln pro Tag', icon: '🔥' },
  { value: 50, label: 'Hardcore', description: '50 Vokabeln pro Tag', icon: '🚀' },
]

export function GoalSelection({ selectedGoal, onSelectGoal, onNext, onBack }: GoalSelectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <span className="text-5xl mb-4 block">🎯</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dein Tagesziel
        </h2>
        <p className="text-gray-600">
          Wie viel möchtest du täglich üben?
        </p>
      </motion.div>

      <div className="space-y-3 mb-8">
        {goals.map((goal, index) => (
          <motion.button
            key={goal.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectGoal(goal.value)}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
              selectedGoal === goal.value
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <span className="text-3xl">{goal.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{goal.label}</span>
                {goal.recommended && (
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                    Empfohlen
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-500">{goal.description}</span>
            </div>
            {selectedGoal === goal.value && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-3">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold"
        >
          Zurück
        </motion.button>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNext}
          className="flex-1 bg-primary-500 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-primary-500/30"
        >
          Weiter
        </motion.button>
      </div>
    </motion.div>
  )
}
