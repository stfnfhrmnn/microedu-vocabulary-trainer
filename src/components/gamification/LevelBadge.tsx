'use client'

import { motion } from 'framer-motion'
import { getLevelTitle, getLevelProgress } from '@/lib/gamification/xp'
import { cn } from '@/lib/utils/cn'

interface LevelBadgeProps {
  level: number
  totalXP: number
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  Bronze: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  Silver: { bg: 'bg-gray-200', text: 'text-gray-800', border: 'border-gray-400' },
  Gold: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' },
  Platinum: { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' },
  Diamond: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
}

export function LevelBadge({
  level,
  totalXP,
  showProgress = false,
  size = 'md',
  className,
}: LevelBadgeProps) {
  const title = getLevelTitle(level) || 'Beginner'
  const { currentLevelXP, nextLevelXP, progress } = getLevelProgress(totalXP)
  const colors = LEVEL_COLORS[title] || LEVEL_COLORS.Beginner

  const sizes = {
    sm: { text: 'text-xs', padding: 'px-2 py-0.5', gap: 'gap-1' },
    md: { text: 'text-sm', padding: 'px-3 py-1', gap: 'gap-2' },
    lg: { text: 'text-base', padding: 'px-4 py-1.5', gap: 'gap-2' },
  }

  const s = sizes[size]

  return (
    <div className={cn('inline-flex flex-col', className)}>
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className={cn(
          'inline-flex items-center rounded-full border-2 font-semibold',
          colors.bg,
          colors.text,
          colors.border,
          s.text,
          s.padding,
          s.gap
        )}
      >
        <span>Lv. {level}</span>
        <span className="opacity-70">|</span>
        <span>{title}</span>
      </motion.div>

      {showProgress && (
        <div className="mt-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
              className={cn('h-full rounded-full', colors.bg.replace('100', '400'))}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {currentLevelXP.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
          </p>
        </div>
      )}
    </div>
  )
}
