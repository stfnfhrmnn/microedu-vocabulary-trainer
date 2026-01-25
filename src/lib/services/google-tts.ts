/**
 * Google Cloud Text-to-Speech Service
 *
 * Provides high-quality TTS using Google Cloud API.
 * Falls back to Web Speech API if unavailable.
 */

import type { Language } from '@/lib/db/schema'

// Google Cloud TTS API endpoint
const TTS_API_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'

// Language to Google TTS voice mapping
// Using WaveNet voices for best quality
const VOICE_MAP: Record<Language | 'german', { languageCode: string; name: string }> = {
  german: { languageCode: 'de-DE', name: 'de-DE-Wavenet-C' },
  french: { languageCode: 'fr-FR', name: 'fr-FR-Wavenet-C' },
  spanish: { languageCode: 'es-ES', name: 'es-ES-Wavenet-B' },
  latin: { languageCode: 'it-IT', name: 'it-IT-Wavenet-C' }, // Use Italian as Latin proxy
}

// Fallback to Standard voices if WaveNet unavailable
const STANDARD_VOICE_MAP: Record<Language | 'german', { languageCode: string; name: string }> = {
  german: { languageCode: 'de-DE', name: 'de-DE-Standard-A' },
  french: { languageCode: 'fr-FR', name: 'fr-FR-Standard-A' },
  spanish: { languageCode: 'es-ES', name: 'es-ES-Standard-A' },
  latin: { languageCode: 'it-IT', name: 'it-IT-Standard-A' },
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
 * Synthesize speech using Google Cloud TTS API
 */
export async function synthesizeSpeechGoogle(
  text: string,
  language: Language | 'german',
  apiKey: string,
  options: GoogleTTSOptions = {}
): Promise<GoogleTTSResult> {
  const voiceMap = options.useWaveNet !== false ? VOICE_MAP : STANDARD_VOICE_MAP
  const voice = voiceMap[language]

  const requestBody = {
    input: { text },
    voice: {
      languageCode: voice.languageCode,
      name: voice.name,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: options.speakingRate ?? 1.0,
      pitch: options.pitch ?? 0,
      volumeGainDb: options.volumeGainDb ?? 0,
    },
  }

  try {
    const response = await fetch(`${TTS_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData.error?.message || `HTTP ${response.status}`
      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    return {
      success: true,
      audioContent: data.audioContent,
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

      audio.onerror = (e) => {
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
  private apiKey: string | null = null
  private audioCache = new Map<string, string>() // text -> base64 audio
  private currentAudio: HTMLAudioElement | null = null
  private isPlaying = false

  setApiKey(apiKey: string | null) {
    this.apiKey = apiKey
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  /**
   * Speak text using Google Cloud TTS
   */
  async speak(
    text: string,
    language: Language | 'german',
    options: GoogleTTSOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'Google API key not configured' }
    }

    // Check cache
    const cacheKey = `${language}:${text}:${options.speakingRate || 1}`
    let audioContent = this.audioCache.get(cacheKey)

    if (!audioContent) {
      // Synthesize speech
      const result = await synthesizeSpeechGoogle(text, language, this.apiKey, options)
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
