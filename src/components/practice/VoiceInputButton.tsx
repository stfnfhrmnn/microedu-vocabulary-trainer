'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { cn } from '@/lib/utils/cn'
import type { Language } from '@/lib/db/schema'

interface Props {
  language: Language | 'german'
  onTranscript: (text: string) => void
  onListeningChange?: (isListening: boolean) => void
  disabled?: boolean
  className?: string
}

export function VoiceInputButton({
  language,
  onTranscript,
  onListeningChange,
  disabled,
  className,
}: Props) {
  const {
    isListening,
    isAvailable,
    transcript,
    interimTranscript,
    error,
    start,
    stop,
    reset,
  } = useSpeechRecognition()

  // Notify parent of listening state changes
  useEffect(() => {
    onListeningChange?.(isListening)
  }, [isListening, onListeningChange])

  // Send transcript to parent when final result is received
  useEffect(() => {
    if (transcript) {
      onTranscript(transcript)
      reset()
    }
  }, [transcript, onTranscript, reset])

  const handleClick = () => {
    if (isListening) {
      stop()
    } else {
      start(language)
    }
  }

  if (!isAvailable) {
    return null
  }

  return (
    <div className={cn('relative', className)}>
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
          isListening
            ? 'bg-error-500 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        title={isListening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
      >
        {isListening ? (
          // Recording animation
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </motion.div>
        ) : (
          // Microphone icon
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        )}
      </motion.button>

      {/* Interim transcript display */}
      <AnimatePresence>
        {isListening && interimTranscript && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap max-w-xs truncate"
          >
            {interimTranscript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-error-500 text-white text-xs rounded-lg whitespace-nowrap"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
