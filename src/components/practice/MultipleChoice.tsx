'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { PronunciationButton } from '@/components/vocabulary/PronunciationButton'
import type { Language } from '@/lib/db/schema'

export interface MultipleChoiceProps {
  question: string
  correctAnswer: string
  options: string[]
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void
  disabled?: boolean
  questionLanguage?: Language | 'german'
  answerLanguage?: Language | 'german'
}

export function MultipleChoice({
  question,
  correctAnswer,
  options,
  onAnswer,
  disabled,
  questionLanguage,
  answerLanguage,
}: MultipleChoiceProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null)
    setShowResult(false)
  }, [question])

  const handleSelect = (answer: string) => {
    if (disabled || showResult) return

    setSelectedAnswer(answer)
    setShowResult(true)

    const isCorrect = answer === correctAnswer

    // Delay before calling onAnswer to show feedback
    setTimeout(() => {
      onAnswer(answer, isCorrect)
    }, 1200)
  }

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      return 'bg-white border-gray-200 hover:border-primary-300 hover:bg-primary-50'
    }

    if (option === correctAnswer) {
      return 'bg-success-50 border-success-500 text-success-700'
    }

    if (option === selectedAnswer && option !== correctAnswer) {
      return 'bg-error-50 border-error-500 text-error-700'
    }

    return 'bg-gray-50 border-gray-200 opacity-50'
  }

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          Was bedeutet...
        </p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-vocab-lg text-gray-900 text-center">{question}</p>
          {questionLanguage && (
            <PronunciationButton
              text={question}
              language={questionLanguage}
              size="md"
              variant="circle"
            />
          )}
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <motion.button
            key={`${option}-${index}`}
            onClick={() => handleSelect(option)}
            disabled={disabled || showResult}
            className={cn(
              'w-full p-4 rounded-xl border-2 text-left',
              'font-medium text-lg',
              'transition-all duration-200',
              'disabled:cursor-not-allowed',
              getOptionStyle(option)
            )}
            whileTap={!showResult ? { scale: 0.98 } : undefined}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  'text-sm font-bold',
                  showResult && option === correctAnswer
                    ? 'bg-success-500 text-white'
                    : showResult && option === selectedAnswer
                      ? 'bg-error-500 text-white'
                      : 'bg-gray-100 text-gray-500'
                )}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="flex-1">{option}</span>
              {showResult && option === correctAnswer && answerLanguage && (
                <PronunciationButton
                  text={option}
                  language={answerLanguage}
                  size="sm"
                  variant="ghost"
                />
              )}
              <AnimatePresence>
                {showResult && option === correctAnswer && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-success-500"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </motion.span>
                )}
                {showResult && option === selectedAnswer && option !== correctAnswer && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-error-500"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
                    </svg>
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

/**
 * Generate distractor options for multiple choice
 */
export function generateOptions(
  correctAnswer: string,
  allAnswers: string[],
  count: number = 4
): string[] {
  // Filter out the correct answer from potential distractors
  const distractors = allAnswers.filter((a) => a !== correctAnswer)

  // Shuffle and take count-1 distractors
  const shuffledDistractors = distractors.sort(() => Math.random() - 0.5).slice(0, count - 1)

  // Combine with correct answer and shuffle again
  const options = [...shuffledDistractors, correctAnswer].sort(() => Math.random() - 0.5)

  return options
}
