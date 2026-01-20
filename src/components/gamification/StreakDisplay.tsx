'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface StreakDisplayProps {
  streak: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StreakDisplay({
  streak,
  showLabel = true,
  size = 'md',
  className,
}: StreakDisplayProps) {
  const isActive = streak > 0

  const sizes = {
    sm: { icon: 'text-xl', number: 'text-lg', label: 'text-xs' },
    md: { icon: 'text-3xl', number: 'text-2xl', label: 'text-sm' },
    lg: { icon: 'text-5xl', number: 'text-4xl', label: 'text-base' },
  }

  const s = sizes[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.span
        className={cn(s.icon, isActive ? 'grayscale-0' : 'grayscale opacity-50')}
        animate={
          isActive
            ? {
                scale: [1, 1.1, 1],
                rotate: [-2, 2, -2],
              }
            : {}
        }
        transition={{
          duration: 0.5,
          repeat: isActive ? Infinity : 0,
          repeatDelay: 2,
        }}
      >
        🔥
      </motion.span>
      <div>
        <motion.span
          key={streak}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'font-bold',
            s.number,
            isActive ? 'text-orange-500' : 'text-gray-400'
          )}
        >
          {streak}
        </motion.span>
        {showLabel && (
          <p className={cn('text-gray-500', s.label)}>
            {streak === 1 ? 'Tag' : 'Tage'}
          </p>
        )}
      </div>
    </div>
  )
}
