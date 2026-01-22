'use client'

import { motion } from 'framer-motion'
import { useTTS } from '@/hooks/useTTS'
import { cn } from '@/lib/utils/cn'
import type { Language } from '@/lib/db/schema'

interface Props {
  text: string
  language: Language | 'german'
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'circle'
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}

const iconSizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function PronunciationButton({
  text,
  language,
  size = 'md',
  variant = 'default',
  className,
}: Props) {
  const { speak, stop, isSpeaking, isAvailable } = useTTS()

  if (!isAvailable) {
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSpeaking) {
      stop()
    } else {
      speak(text, language)
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'flex items-center justify-center rounded-full transition-colors',
        sizeClasses[size],
        variant === 'default' && 'bg-primary-100 text-primary-600 hover:bg-primary-200',
        variant === 'ghost' && 'text-gray-500 hover:text-primary-600 hover:bg-gray-100',
        variant === 'circle' && 'bg-white shadow-md text-primary-600 hover:bg-primary-50',
        isSpeaking && 'bg-primary-500 text-white',
        className
      )}
      title={isSpeaking ? 'Stop' : 'Aussprache anhören'}
    >
      {isSpeaking ? (
        // Stop icon
        <svg
          className={iconSizeClasses[size]}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        // Speaker icon
        <svg
          className={iconSizeClasses[size]}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        </svg>
      )}
    </motion.button>
  )
}
