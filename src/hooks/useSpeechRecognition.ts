'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getSpeechRecognitionService,
  startListening,
  stopListening,
} from '@/lib/services/speech-recognition'
import type { Language } from '@/lib/db/schema'

interface UseSpeechRecognitionResult {
  isListening: boolean
  isAvailable: boolean
  transcript: string
  interimTranscript: string
  confidence: number
  error: string | null
  start: (language: Language | 'german') => void
  stop: () => void
  reset: () => void
}

export function useSpeechRecognition(): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Track current language for restarts
  const currentLanguageRef = useRef<Language | 'german'>('german')

  useEffect(() => {
    const service = getSpeechRecognitionService()
    setIsAvailable(service.isAvailable())

    return () => {
      stopListening()
    }
  }, [])

  const handleResult = useCallback((result: {
    transcript: string
    confidence: number
    isFinal: boolean
  }) => {
    if (result.isFinal) {
      setTranscript((prev) => prev + result.transcript)
      setInterimTranscript('')
      setConfidence(result.confidence)
    } else {
      setInterimTranscript(result.transcript)
    }
  }, [])

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setIsListening(false)
  }, [])

  const start = useCallback((language: Language | 'german') => {
    setError(null)
    setInterimTranscript('')
    currentLanguageRef.current = language

    const success = startListening(
      language,
      handleResult,
      handleError,
      { interimResults: true }
    )

    if (success) {
      setIsListening(true)
    }
  }, [handleResult, handleError])

  const stop = useCallback(() => {
    stopListening()
    setIsListening(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
    setError(null)
  }, [stop])

  return {
    isListening,
    isAvailable,
    transcript,
    interimTranscript,
    confidence,
    error,
    start,
    stop,
    reset,
  }
}
