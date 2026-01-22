'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { getQuickAccentsForLanguage } from '@/lib/utils/accent-helpers'
import { cn } from '@/lib/utils/cn'
import type { Language } from '@/lib/db/schema'

interface Props {
  language: Language | 'german'
  onInsert: (char: string) => void
  isVisible?: boolean
  className?: string
}

export function AccentKeyboard({
  language,
  onInsert,
  isVisible = true,
  className,
}: Props) {
  const accents = getQuickAccentsForLanguage(language)

  if (accents.length === 0 || !isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn('flex flex-wrap gap-1.5 justify-center', className)}
        >
          {accents.map((char) => (
            <motion.button
              key={char}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => onInsert(char)}
              className="min-w-[36px] h-9 px-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-lg font-medium text-gray-700 transition-colors"
            >
              {char}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Compact version for inline use
 */
export function AccentKeyboardCompact({
  language,
  onInsert,
  className,
}: Omit<Props, 'isVisible'>) {
  const accents = getQuickAccentsForLanguage(language)

  if (accents.length === 0) {
    return null
  }

  return (
    <div className={cn('flex gap-1', className)}>
      {accents.slice(0, 4).map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => onInsert(char)}
          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-gray-600 transition-colors"
        >
          {char}
        </button>
      ))}
      {accents.length > 4 && (
        <span className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
          +{accents.length - 4}
        </span>
      )}
    </div>
  )
}
