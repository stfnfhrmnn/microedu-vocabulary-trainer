'use client'

import { motion } from 'framer-motion'
import { PronunciationButton } from '@/components/vocabulary/PronunciationButton'
import { cn } from '@/lib/utils/cn'
import type { Language } from '@/lib/db/schema'

export interface FlashCardProps {
  question: string
  answer: string
  isFlipped: boolean
  onFlip: () => void
  notes?: string
  questionLanguage?: Language | 'german'
  answerLanguage?: Language | 'german'
}

export function FlashCard({
  question,
  answer,
  isFlipped,
  onFlip,
  notes,
  questionLanguage,
  answerLanguage,
}: FlashCardProps) {
  return (
    <motion.div
      className="perspective-1000 cursor-pointer"
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onFlip()
        }
      }}
      style={{ perspective: '1000px' }}
      whileTap={{ scale: 0.98 }}
      role="button"
      tabIndex={0}
      aria-label={
        isFlipped
          ? `Antwort: ${answer}${notes ? `. Hinweis: ${notes}` : ''}. Drücke Enter um zur Frage zurückzukehren.`
          : `Frage: ${question}. Drücke Enter zum Umdrehen.`
      }
      aria-pressed={isFlipped}
    >
      <motion.div
        className="relative w-full h-64 preserve-3d"
        initial={false}
        animate={{
          rotateY: isFlipped ? 180 : 0,
          boxShadow: isFlipped
            ? '0 20px 40px rgba(59, 130, 246, 0.2), 0 0 60px rgba(59, 130, 246, 0.1)'
            : '0 10px 30px rgba(0, 0, 0, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{
          transformStyle: 'preserve-3d',
          borderRadius: '24px',
        }}
      >
        {/* Front of card */}
        <motion.div
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden',
            'bg-white rounded-3xl border border-gray-100',
            'flex flex-col items-center justify-center p-6'
          )}
          style={{ backfaceVisibility: 'hidden' }}
        >
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-gray-400 uppercase tracking-wider mb-4"
          >
            Frage
          </motion.p>
          <div className="flex items-center gap-3">
            <p className="text-vocab-lg text-gray-900 text-center break-words">
              {question}
            </p>
            {questionLanguage && (
              <PronunciationButton
                text={question}
                language={questionLanguage}
                size="md"
                variant="circle"
              />
            )}
          </div>
          <motion.p
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="text-sm text-gray-400 mt-6"
          >
            Tippe zum Umdrehen
          </motion.p>
        </motion.div>

        {/* Back of card */}
        <motion.div
          className={cn(
            'absolute inset-0 w-full h-full backface-hidden',
            'bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl border border-primary-200',
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
          <div className="flex items-center gap-3">
            <p className="text-vocab-lg text-primary-700 text-center break-words font-medium">
              {answer}
            </p>
            {answerLanguage && (
              <PronunciationButton
                text={answer}
                language={answerLanguage}
                size="md"
                variant="circle"
              />
            )}
          </div>
          {notes && (
            <p className="text-sm text-primary-500 mt-4 text-center">{notes}</p>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
