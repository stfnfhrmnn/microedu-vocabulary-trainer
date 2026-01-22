'use client'

import { useState, useCallback, useEffect } from 'react'
import { getTTSService, speakText, stopSpeaking } from '@/lib/services/text-to-speech'
import type { Language } from '@/lib/db/schema'

interface UseTTSResult {
  speak: (text: string, language: Language | 'german') => Promise<void>
  stop: () => void
  isSpeaking: boolean
  isAvailable: boolean
  error: string | null
}

export function useTTS(): UseTTSResult {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const service = getTTSService()
    setIsAvailable(service.isAvailable())
  }, [])

  const speak = useCallback(async (text: string, language: Language | 'german') => {
    setError(null)
    setIsSpeaking(true)

    try {
      const result = await speakText(text, language)
      if (!result.success) {
        setError(result.error || 'Pronunciation failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pronunciation failed')
    } finally {
      setIsSpeaking(false)
    }
  }, [])

  const stop = useCallback(() => {
    stopSpeaking()
    setIsSpeaking(false)
  }, [])

  return {
    speak,
    stop,
    isSpeaking,
    isAvailable,
    error,
  }
}
