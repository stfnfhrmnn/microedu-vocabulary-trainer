'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

export interface FlashCardProps {
  question: string
  answer: string
  isFlipped: boolean
  onFlip: () => void
  notes?: string
}

export function FlashCard({
  question,
  answer,
  isFlipped,
  onFlip,
  notes,
}: FlashCardProps) {
  return (
    <div
      className="perspective-1000 cursor-pointer"
      onClick={onFlip}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="relative w-full h-64 preserve-3d"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Front of card */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden',
            'bg-white rounded-3xl shadow-lg border border-gray-100',
            'flex flex-col items-center justify-center p-6'
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">
            Frage
          </p>
          <p className="text-vocab-lg text-gray-900 text-center break-words">
            {question}
          </p>
          <p className="text-sm text-gray-400 mt-6">Tippe zum Umdrehen</p>
        </div>

        {/* Back of card */}
        <div
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden',
            'bg-primary-50 rounded-3xl shadow-lg border border-primary-100',
            'flex flex-col items-center justify-center p-6'
          )}
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <p className="text-xs text-primary-400 uppercase tracking-wider mb-4">
            Antwort
          </p>
          <p className="text-vocab-lg text-primary-700 text-center break-words">
            {answer}
          </p>
          {notes && (
            <p className="text-sm text-primary-500 mt-4 text-center">{notes}</p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
