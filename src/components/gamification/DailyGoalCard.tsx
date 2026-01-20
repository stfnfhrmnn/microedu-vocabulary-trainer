'use client'

import { motion } from 'framer-motion'
import { ProgressRing } from '@/components/progress/ProgressRing'
import { cn } from '@/lib/utils/cn'

interface DailyGoalCardProps {
  current: number
  goal: number
  className?: string
}

export function DailyGoalCard({ current, goal, className }: DailyGoalCardProps) {
  const progress = Math.min(current / goal, 1)
  const percentage = Math.round(progress * 100)
  const isComplete = current >= goal

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <ProgressRing
        percentage={percentage}
        size={80}
        strokeWidth={8}
        color={isComplete ? '#22c55e' : '#3b82f6'}
      >
        <div className="text-center">
          <motion.div
            key={current}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={cn(
              'text-xl font-bold',
              isComplete ? 'text-success-600' : 'text-gray-900'
            )}
          >
            {current}
          </motion.div>
          <div className="text-xs text-gray-500">/{goal}</div>
        </div>
      </ProgressRing>
      <div>
        <p className="font-semibold text-gray-900">
          {isComplete ? 'Tagesziel erreicht!' : 'Tagesziel'}
        </p>
        <p className="text-sm text-gray-500">
          {isComplete
            ? 'Super gemacht!'
            : `Noch ${goal - current} Vokabeln`}
        </p>
        {isComplete && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl"
          >
            ⭐
          </motion.span>
        )}
      </div>
    </div>
  )
}
