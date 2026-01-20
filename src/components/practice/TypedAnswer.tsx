'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/Button'
import { checkAnswer, highlightDifferences, hasAccentMismatchOnly } from '@/lib/learning/fuzzy-match'
import type { StrictnessLevel } from '@/lib/learning/fuzzy-match'

export interface TypedAnswerProps {
  question: string
  correctAnswer: string
  strictness: StrictnessLevel
  onAnswer: (userAnswer: string, isCorrect: boolean) => void
  disabled?: boolean
}

export function TypedAnswer({
  question,
  correctAnswer,
  strictness,
  onAnswer,
  disabled,
}: TypedAnswerProps) {
  const [userAnswer, setUserAnswer] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<{
    isCorrect: boolean
    similarity: number
    hasAccentIssue: boolean
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset and focus when question changes
  useEffect(() => {
    setUserAnswer('')
    setShowResult(false)
    setResult(null)
    inputRef.current?.focus()
  }, [question])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (disabled || showResult || !userAnswer.trim()) return

    const matchResult = checkAnswer(correctAnswer, userAnswer, strictness)
    const hasAccentIssue = hasAccentMismatchOnly(correctAnswer, userAnswer)

    setResult({
      isCorrect: matchResult.isCorrect,
      similarity: matchResult.similarity,
      hasAccentIssue,
    })
    setShowResult(true)
  }

  const handleContinue = (overrideCorrect?: boolean) => {
    const finalIsCorrect = overrideCorrect ?? result?.isCorrect ?? false
    onAnswer(userAnswer, finalIsCorrect)
  }

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          Übersetze
        </p>
        <p className="text-vocab-lg text-gray-900 text-center">{question}</p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={disabled || showResult}
            placeholder="Deine Antwort..."
            className={cn(
              'w-full px-5 py-4 text-xl rounded-2xl',
              'border-2 transition-colors',
              'focus:outline-none',
              showResult
                ? result?.isCorrect
                  ? 'border-success-500 bg-success-50'
                  : 'border-error-500 bg-error-50'
                : 'border-gray-200 focus:border-primary-500 bg-white'
            )}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {!showResult && (
            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={disabled || !userAnswer.trim()}
            >
              Prüfen
            </Button>
          )}
        </div>
      </form>

      {/* Result */}
      <AnimatePresence>
        {showResult && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Feedback */}
            <div
              className={cn(
                'rounded-2xl p-4 text-center',
                result.isCorrect ? 'bg-success-50' : 'bg-error-50'
              )}
            >
              {result.isCorrect ? (
                <div className="text-success-700">
                  <p className="text-2xl mb-1">Richtig!</p>
                  <p className="font-medium">{correctAnswer}</p>
                </div>
              ) : (
                <div className="text-error-700">
                  <p className="text-lg mb-2">
                    {result.hasAccentIssue ? 'Fast richtig!' : 'Nicht ganz...'}
                  </p>
                  <p className="text-sm text-error-600 mb-2">Richtige Antwort:</p>
                  <p
                    className="font-medium text-xl"
                    dangerouslySetInnerHTML={{
                      __html: highlightDifferences(correctAnswer, userAnswer),
                    }}
                  />
                  {result.hasAccentIssue && (
                    <p className="text-sm text-error-500 mt-2">
                      Achte auf die Akzente!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              {result.isCorrect ? (
                <Button
                  variant="success"
                  fullWidth
                  onClick={() => handleContinue()}
                >
                  Weiter
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleContinue(false)}
                  >
                    Weiter
                  </Button>
                  {result.similarity >= 0.6 && (
                    <Button
                      variant="ghost"
                      fullWidth
                      onClick={() => handleContinue(true)}
                    >
                      War eigentlich richtig
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
