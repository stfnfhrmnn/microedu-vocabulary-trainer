'use client'

import { motion } from 'framer-motion'
import { PronunciationButton } from '@/components/vocabulary/PronunciationButton'
import type { Language } from '@/lib/db/schema'

export interface ParentQuizCardProps {
  question: string
  answer: string
  notes?: string
  questionLanguage?: Language | 'german'
  answerLanguage?: Language | 'german'
}

export function ParentQuizCard({ question, answer, notes, questionLanguage, answerLanguage }: ParentQuizCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-lg p-6 text-center"
    >
      {/* Question Section */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-2">Frage vorlesen:</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-3xl font-bold text-gray-900 leading-tight">
            {question}
          </p>
          {questionLanguage && (
            <PronunciationButton
              text={question}
              language={questionLanguage}
              size="lg"
              variant="circle"
            />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t-2 border-dashed border-gray-200 my-6" />

      {/* Answer Section */}
      <div>
        <p className="text-sm text-gray-500 mb-2">Antwort:</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-2xl font-semibold text-primary-600 leading-tight">
            {answer}
          </p>
          {answerLanguage && (
            <PronunciationButton
              text={answer}
              language={answerLanguage}
              size="lg"
              variant="circle"
            />
          )}
        </div>
        {notes && (
          <p className="text-sm text-gray-500 mt-2 italic">({notes})</p>
        )}
      </div>
    </motion.div>
  )
}
