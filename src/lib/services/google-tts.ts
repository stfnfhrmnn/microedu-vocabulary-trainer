/**
 * Google Cloud Text-to-Speech Service
 *
 * Provides high-quality TTS using server-side proxy to Google Cloud API.
 * Falls back to Web Speech API if unavailable.
 */

import type { Language } from '@/lib/db/schema'

interface GoogleVoiceConfig {
  languageCode: string
  premiumVoices: string[]
  standardVoices: string[]
}

// Ordered by quality preference; service tries each and falls back automatically.
const GOOGLE_VOICE_CONFIG: Record<Language | 'german', GoogleVoiceConfig> = {
  german: {
    languageCode: 'de-DE',
    premiumVoices: ['de-DE-Neural2-C', 'de-DE-Wavenet-C', 'de-DE-Wavenet-D'],
    standardVoices: ['de-DE-Standard-C', 'de-DE-Standard-A'],
  },
  french: {
    languageCode: 'fr-FR',
    premiumVoices: ['fr-FR-Neural2-C', 'fr-FR-Wavenet-C', 'fr-FR-Wavenet-D'],
    standardVoices: ['fr-FR-Standard-C', 'fr-FR-Standard-A'],
  },
  spanish: {
    languageCode: 'es-ES',
    premiumVoices: ['es-ES-Neural2-B', 'es-ES-Wavenet-B', 'es-ES-Wavenet-C'],
    standardVoices: ['es-ES-Standard-B', 'es-ES-Standard-A'],
  },
  // Latin has no native Google voice; Italian is a practical pronunciation fallback.
  latin: {
    languageCode: 'it-IT',
    premiumVoices: ['it-IT-Neural2-C', 'it-IT-Wavenet-C', 'it-IT-Wavenet-A'],
    standardVoices: ['it-IT-Standard-C', 'it-IT-Standard-A'],
  },
}

export interface GoogleTTSOptions {
  speakingRate?: number  // 0.25 to 4.0, default 1.0
  pitch?: number         // -20.0 to 20.0, default 0 (mapping from normalized done in unified-tts)
  volumeGainDb?: number  // -96.0 to 16.0, default 0
  useWaveNet?: boolean   // Use WaveNet voices (better quality, slightly more expensive)
}

export interface GoogleTTSResult {
  success: boolean
  audioContent?: string  // Base64 encoded audio
  error?: string
}

/**
 * Synthesize speech using server-side proxy to Google Cloud TTS API
 */
export async function synthesizeSpeechGoogle(
  text: string,
  language: Language | 'german',
  options: GoogleTTSOptions = {}
): Promise<GoogleTTSResult> {
  const voiceConfig = GOOGLE_VOICE_CONFIG[language]
  const voiceCandidates =
    options.useWaveNet === false ? voiceConfig.standardVoices : voiceConfig.premiumVoices

  try {
    const basePayload = {
      text,
      languageCode: voiceConfig.languageCode,
      speakingRate: options.speakingRate ?? 1.0,
      pitch: options.pitch ?? 0,
      volumeGainDb: options.volumeGainDb ?? 0,
    }

    let lastError = 'Google TTS failed'

    // First try explicit high-quality voice candidates.
    for (const voiceName of voiceCandidates) {
      const response = await fetch('/api/google/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...basePayload,
          voiceName,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          audioContent: data.audioContent,
        }
      }

      const errorData = await response.json().catch(() => ({}))
      lastError = errorData.error || `HTTP ${response.status}`
    }

    // Final fallback: let Google choose a default voice for the language.
    const fallbackResponse = await fetch('/api/google/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(basePayload),
    })

    if (fallbackResponse.ok) {
      const data = await fallbackResponse.json()
      return {
        success: true,
        audioContent: data.audioContent,
      }
    }

    const fallbackErrorData = await fallbackResponse.json().catch(() => ({}))
    return {
      success: false,
      error: fallbackErrorData.error || lastError,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Play synthesized audio from base64 content
 */
export function playBase64Audio(base64Audio: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audioData = atob(base64Audio)
      const arrayBuffer = new ArrayBuffer(audioData.length)
      const view = new Uint8Array(arrayBuffer)
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i)
      }

      const blob = new Blob([arrayBuffer], { type: 'audio/mp3' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      audio.onended = () => {
        URL.revokeObjectURL(url)
        resolve()
      }

      audio.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to play audio'))
      }

      audio.play()
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Google TTS Service class with caching and queue management
 */
export class GoogleTTSService {
  private enabled: boolean = false
  private audioCache = new Map<string, string>() // text -> base64 audio
  private currentAudio: HTMLAudioElement | null = null
  private isPlaying = false

  setApiKey(apiKey: string | null) {
    // Legacy method - now just enables/disables service
    this.enabled = !!apiKey
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isAvailable(): boolean {
    return this.enabled
  }

  /**
   * Speak text using Google Cloud TTS via server-side proxy
   */
  async speak(
    text: string,
    language: Language | 'german',
    options: GoogleTTSOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.enabled) {
      return { success: false, error: 'Google TTS not enabled' }
    }

    // Check cache
    const cacheKey = [
      language,
      options.useWaveNet === false ? 'standard' : 'premium',
      options.speakingRate ?? 1,
      options.pitch ?? 0,
      options.volumeGainDb ?? 0,
      text,
    ].join(':')
    let audioContent = this.audioCache.get(cacheKey)

    if (!audioContent) {
      // Synthesize speech via server proxy
      const result = await synthesizeSpeechGoogle(text, language, options)
      if (!result.success || !result.audioContent) {
        return { success: false, error: result.error }
      }
      audioContent = result.audioContent

      // Cache the result (limit cache size)
      if (this.audioCache.size > 100) {
        const firstKey = this.audioCache.keys().next().value
        if (firstKey) this.audioCache.delete(firstKey)
      }
      this.audioCache.set(cacheKey, audioContent)
    }

    // Play the audio
    try {
      await this.playAudio(audioContent)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Playback failed',
      }
    }
  }

  private playAudio(base64Audio: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Stop any current audio
      this.stop()

      try {
        const audioData = atob(base64Audio)
        const arrayBuffer = new ArrayBuffer(audioData.length)
        const view = new Uint8Array(arrayBuffer)
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i)
        }

        const blob = new Blob([arrayBuffer], { type: 'audio/mp3' })
        const url = URL.createObjectURL(blob)
        this.currentAudio = new Audio(url)
        this.isPlaying = true

        this.currentAudio.onended = () => {
          URL.revokeObjectURL(url)
          this.isPlaying = false
          this.currentAudio = null
          resolve()
        }

        this.currentAudio.onerror = () => {
          URL.revokeObjectURL(url)
          this.isPlaying = false
          this.currentAudio = null
          reject(new Error('Failed to play audio'))
        }

        this.currentAudio.play()
      } catch (error) {
        this.isPlaying = false
        reject(error)
      }
    })
  }

  /**
   * Stop current playback
   */
  stop() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.isPlaying = false
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.isPlaying
  }

  /**
   * Clear the audio cache
   */
  clearCache() {
    this.audioCache.clear()
  }
}

// Singleton instance
let googleTTSService: GoogleTTSService | null = null

export function getGoogleTTSService(): GoogleTTSService {
  if (!googleTTSService) {
    googleTTSService = new GoogleTTSService()
  }
  return googleTTSService
}
