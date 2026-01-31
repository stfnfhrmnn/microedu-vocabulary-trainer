/**
 * Unified Text-to-Speech Service
 *
 * Provides a unified interface for TTS that can switch between:
 * - Web Speech API (free, works offline on some devices)
 * - Google Cloud TTS (high quality WaveNet voices)
 */

import type { Language } from '@/lib/db/schema'
import { getTTSService } from './text-to-speech'
import { getGoogleTTSService, type GoogleTTSOptions } from './google-tts'
import type { TTSProvider, GoogleVoiceType } from '@/stores/settings'

interface UnifiedTTSOptions {
  rate?: number    // Speaking rate (0.5-2.0, 1.0 = normal)
  pitch?: number   // Pitch adjustment (0.5-2.0, 1.0 = normal)
  volume?: number  // Volume (0-1)
}

interface SpeakResult {
  success: boolean
  error?: string
  provider: TTSProvider
}

/**
 * Unified TTS Service
 */
export class UnifiedTTSService {
  private provider: TTSProvider = 'web-speech'
  private googleEnabled: boolean = false
  private googleVoiceType: GoogleVoiceType = 'wavenet'
  private webTTS = getTTSService()
  private googleTTS = getGoogleTTSService()

  /**
   * Configure the service
   */
  configure(config: {
    provider: TTSProvider
    googleApiKey?: string | null  // Legacy - now just boolean check
    googleEnabled?: boolean
    googleVoiceType?: GoogleVoiceType
  }) {
    this.provider = config.provider
    // Support both old googleApiKey (truthy check) and new googleEnabled
    if (config.googleEnabled !== undefined) {
      this.googleEnabled = config.googleEnabled
      this.googleTTS.setEnabled(config.googleEnabled)
    } else if (config.googleApiKey !== undefined) {
      this.googleEnabled = !!config.googleApiKey
      this.googleTTS.setEnabled(!!config.googleApiKey)
    }
    if (config.googleVoiceType !== undefined) {
      this.googleVoiceType = config.googleVoiceType
    }
  }

  /**
   * Set the TTS provider
   */
  setProvider(provider: TTSProvider) {
    this.provider = provider
  }

  /**
   * Set Google API enabled status
   */
  setGoogleApiKey(apiKey: string | null) {
    // Legacy method - now just enables/disables
    this.googleEnabled = !!apiKey
    this.googleTTS.setEnabled(!!apiKey)
  }

  /**
   * Set Google enabled status
   */
  setGoogleEnabled(enabled: boolean) {
    this.googleEnabled = enabled
    this.googleTTS.setEnabled(enabled)
  }

  /**
   * Get current provider
   */
  getProvider(): TTSProvider {
    return this.provider
  }

  /**
   * Check if the current provider is available
   */
  isAvailable(): boolean {
    if (this.provider === 'google-cloud') {
      return this.googleTTS.isAvailable()
    }
    return this.webTTS.isAvailable()
  }

  /**
   * Check if Google Cloud TTS is configured
   */
  isGoogleAvailable(): boolean {
    return this.googleEnabled
  }

  /**
   * Speak text using the configured provider
   */
  async speak(
    text: string,
    language: Language | 'german',
    options: UnifiedTTSOptions = {}
  ): Promise<SpeakResult> {
    // Try primary provider first
    if (this.provider === 'google-cloud' && this.googleTTS.isAvailable()) {
      // Map normalized pitch (0.5-2.0) to Google's range (-20 to 20)
      const normalizedPitch = options.pitch ?? 1.0
      const googlePitch = (normalizedPitch - 1.0) * 20

      const googleOptions: GoogleTTSOptions = {
        speakingRate: options.rate ?? 1.0,
        pitch: googlePitch,
        useWaveNet: this.googleVoiceType === 'wavenet',
      }

      const result = await this.googleTTS.speak(text, language, googleOptions)

      if (result.success) {
        return { success: true, provider: 'google-cloud' }
      }

      // Fall back to Web Speech API on error
      console.warn('Google TTS failed, falling back to Web Speech API:', result.error)
    }

    // Use Web Speech API
    const webOptions = {
      rate: options.rate ?? 0.9,
      pitch: options.pitch ?? 1,
      volume: options.volume ?? 1,
    }

    const result = await this.webTTS.speak(text, language, webOptions)

    if (result.success) {
      return { success: true, provider: 'web-speech' }
    }

    return {
      success: false,
      error: result.error,
      provider: 'web-speech',
    }
  }

  /**
   * Stop current speech
   */
  stop() {
    this.webTTS.stop()
    this.googleTTS.stop()
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.webTTS.isSpeaking() || this.googleTTS.isSpeaking()
  }

  /**
   * Pre-cache audio for a list of texts (Google Cloud only)
   * Useful for pre-loading a practice session
   */
  async preCache(
    items: Array<{ text: string; language: Language | 'german' }>,
    options: UnifiedTTSOptions = {}
  ): Promise<void> {
    if (this.provider !== 'google-cloud' || !this.googleTTS.isAvailable()) {
      return // Pre-caching only works with Google Cloud TTS
    }

    // Pre-cache in parallel with rate limiting
    const BATCH_SIZE = 5
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE)
      await Promise.all(
        batch.map(async ({ text, language }) => {
          try {
            // Just synthesize to populate cache (don't play)
            await this.googleTTS.speak(text, language, {
              speakingRate: options.rate ?? 1.0,
            })
            this.googleTTS.stop() // Stop immediately after caching
          } catch {
            // Ignore pre-cache errors
          }
        })
      )
    }
  }
}

// Singleton instance
let unifiedTTSService: UnifiedTTSService | null = null

export function getUnifiedTTSService(): UnifiedTTSService {
  if (!unifiedTTSService) {
    unifiedTTSService = new UnifiedTTSService()
  }
  return unifiedTTSService
}
