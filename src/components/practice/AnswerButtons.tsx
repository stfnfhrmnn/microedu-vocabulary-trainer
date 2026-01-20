'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface AnswerButtonsProps {
  onAnswer: (rating: 'didnt_know' | 'almost' | 'knew_it') => void
  disabled?: boolean
}

export function AnswerButtons({ onAnswer, disabled }: AnswerButtonsProps) {
  const buttons = [
    {
      id: 'didnt_know' as const,
      label: 'Wusste nicht',
      color: 'bg-error-500 hover:bg-error-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    {
      id: 'almost' as const,
      label: 'Fast',
      color: 'bg-warning-500 hover:bg-warning-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: 'knew_it' as const,
      label: 'Wusste es!',
      color: 'bg-success-500 hover:bg-success-600',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
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
          onClick={() => onAnswer(button.id)}
          disabled={disabled}
          className={cn(
            'flex flex-col items-center justify-center gap-2',
            'py-4 px-3 rounded-2xl',
            'text-white font-semibold',
            'transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            button.color
          )}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {button.icon}
          <span className="text-sm">{button.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
