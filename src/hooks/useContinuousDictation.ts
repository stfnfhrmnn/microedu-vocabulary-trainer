'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { getSpeechRecognitionService } from '@/lib/services/speech-recognition'
import {
  splitTranscriptIntoPairs,
  pairsToVocabularyCandidates,
  type DictationOrder,
  type RawVocabularyPair,
} from '@/lib/services/voice-dictation-parser'
import type { Language } from '@/lib/db/schema'
import type { VocabularyCandidate } from '@/lib/ocr/types'

interface DictationSegment {
  text: string
  timestamp: number
}

interface UseContinuousDictationResult {
  isListening: boolean
  isAvailable: boolean
  error: string | null
  segments: DictationSegment[]
  currentInterim: string
  rawPairs: VocabularyCandidate[]
  rawTranscript: string
  startDictation: (language: Language | 'german') => void
  stopDictation: () => void
  reset: () => void
}

export function useContinuousDictation(
  order: DictationOrder = 'foreignFirst'
): UseContinuousDictationResult {
  const [isListening, setIsListening] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [segments, setSegments] = useState<DictationSegment[]>([])
  const [currentInterim, setCurrentInterim] = useState('')
  const [rawPairs, setRawPairs] = useState<VocabularyCandidate[]>([])

  const languageRef = useRef<Language | 'german'>('german')
  const stoppingRef = useRef(false)
  const segmentsRef = useRef<DictationSegment[]>([])

  useEffect(() => {
    const service = getSpeechRecognitionService()
    setIsAvailable(service.isAvailable())
  }, [])

  // Recompute pairs when segments change
  const updatePairs = useCallback(
    (segs: DictationSegment[]) => {
      const texts = segs.map((s) => s.text)
      const pairs: RawVocabularyPair[] = splitTranscriptIntoPairs(texts, order)
      setRawPairs(pairsToVocabularyCandidates(pairs))
    },
    [order]
  )

  const handleResult = useCallback(
    (result: { transcript: string; confidence: number; isFinal: boolean }) => {
      if (result.isFinal) {
        const trimmed = result.transcript.trim()
        if (trimmed) {
          const newSegment: DictationSegment = {
            text: trimmed,
            timestamp: Date.now(),
          }
          segmentsRef.current = [...segmentsRef.current, newSegment]
          setSegments(segmentsRef.current)
          updatePairs(segmentsRef.current)
        }
        setCurrentInterim('')
      } else {
        setCurrentInterim(result.transcript)
      }
    },
    [updatePairs]
  )

  const handleError = useCallback((errorMessage: string) => {
    // Ignore 'no-speech' errors in continuous mode — these are normal
    if (errorMessage.includes('Keine Sprache erkannt')) return
    setError(errorMessage)
  }, [])

  const startRecognition = useCallback(() => {
    if (stoppingRef.current) return

    const service = getSpeechRecognitionService()
    const success = service.start(languageRef.current, handleResult, handleError, {
      continuous: true,
      interimResults: true,
      onEnd: () => {
        // Auto-restart if we haven't intentionally stopped
        if (!stoppingRef.current) {
          // Small delay to avoid rapid restart loops
          setTimeout(() => {
            if (!stoppingRef.current) {
              startRecognition()
            }
          }, 200)
        }
      },
    })

    if (success) {
      setIsListening(true)
      setError(null)
    }
  }, [handleResult, handleError])

  const startDictation = useCallback(
    (language: Language | 'german') => {
      languageRef.current = language
      stoppingRef.current = false
      setError(null)
      setCurrentInterim('')
      startRecognition()
    },
    [startRecognition]
  )

  const stopDictation = useCallback(() => {
    stoppingRef.current = true
    const service = getSpeechRecognitionService()
    service.stop()
    setIsListening(false)
    setCurrentInterim('')
  }, [])

  const reset = useCallback(() => {
    stopDictation()
    segmentsRef.current = []
    setSegments([])
    setRawPairs([])
    setCurrentInterim('')
    setError(null)
  }, [stopDictation])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stoppingRef.current = true
      getSpeechRecognitionService().stop()
    }
  }, [])

  const rawTranscript = segments.map((s) => s.text).join(', ')

  return {
    isListening,
    isAvailable,
    error,
    segments,
    currentInterim,
    rawPairs,
    rawTranscript,
    startDictation,
    stopDictation,
    reset,
  }
}
