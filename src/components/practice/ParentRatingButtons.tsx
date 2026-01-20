'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export type ParentRating = 'incorrect' | 'almost' | 'correct'

export interface ParentRatingButtonsProps {
  onRate: (rating: ParentRating) => void
  disabled?: boolean
}

export function ParentRatingButtons({ onRate, disabled }: ParentRatingButtonsProps) {
  const buttons: {
    id: ParentRating
    label: string
    color: string
    icon: React.ReactNode
  }[] = [
    {
      id: 'incorrect',
      label: 'Falsch',
      color: 'bg-error-500 hover:bg-error-600 active:bg-error-700',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    {
      id: 'almost',
      label: 'Fast',
      color: 'bg-warning-500 hover:bg-warning-600 active:bg-warning-700',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 12h14"
          />
        </svg>
      ),
    },
    {
      id: 'correct',
      label: 'Richtig',
      color: 'bg-success-500 hover:bg-success-600 active:bg-success-700',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {buttons.map((button) => (
        <motion.button
          key={button.id}
          onClick={() => onRate(button.id)}
          disabled={disabled}
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            'py-5 px-4 rounded-2xl',
            'text-white font-semibold',
            'transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            button.color
          )}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {button.icon}
          <span className="text-sm font-bold">{button.label}</span>
        </motion.button>
      ))}
    </div>
  )
}

/**
 * Maps parent rating to SM-2 quality rating
 */
export function mapParentRating(rating: ParentRating): 1 | 3 | 5 {
  switch (rating) {
    case 'incorrect':
      return 1
    case 'almost':
      return 3
    case 'correct':
      return 5
  }
}
