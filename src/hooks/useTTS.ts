'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { getUnifiedTTSService } from '@/lib/services/unified-tts'
import { useGoogleApiStatus } from '@/hooks/useGoogleApiStatus'
import { useSettings } from '@/stores/settings'
import { toast } from '@/stores/toast'
import type { Language } from '@/lib/db/schema'

interface UseTTSResult {
  speak: (text: string, language: Language | 'german') => Promise<void>
  stop: () => void
  isSpeaking: boolean
  isAvailable: boolean
  error: string | null
}

export function useTTS(): UseTTSResult {
  const { ttsProvider, ttsRate, ttsPitch, googleVoiceType, ttsLanguageOverride } = useSettings()
  const { available: hasGoogleApi } = useGoogleApiStatus()
  const ttsService = useRef(getUnifiedTTSService())
  const lastWarningRef = useRef<string | null>(null)

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ttsService.current.configure({
      provider: ttsProvider,
      googleEnabled: hasGoogleApi,
      googleVoiceType,
      ttsLanguageOverride,
    })
    setIsAvailable(ttsService.current.isAvailable())
  }, [ttsProvider, hasGoogleApi, googleVoiceType, ttsLanguageOverride])

  const speak = useCallback(async (text: string, language: Language | 'german') => {
    setError(null)
    setIsSpeaking(true)

    try {
      const result = await ttsService.current.speak(text, language, {
        rate: ttsRate,
        pitch: ttsPitch,
      })
      if (!result.success) {
        setError(result.error || 'Pronunciation failed')
      } else if (result.warning && result.warning !== lastWarningRef.current) {
        lastWarningRef.current = result.warning
        toast.info(result.warning, 3500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pronunciation failed')
    } finally {
      setIsSpeaking(false)
    }
  }, [ttsRate, ttsPitch])

  const stop = useCallback(() => {
    ttsService.current.stop()
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
