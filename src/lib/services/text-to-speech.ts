/**
 * Text-to-Speech Service
 *
 * Uses Web Speech API for pronunciation playback.
 * Supports multiple languages with automatic voice selection.
 */

import type { Language } from '@/lib/db/schema'

// Language to BCP-47 locale mapping
const LANGUAGE_LOCALES: Record<Language | 'german', string[]> = {
  german: ['de-DE', 'de'],
  french: ['fr-FR', 'fr'],
  spanish: ['es-ES', 'es-MX', 'es'],
  latin: ['la', 'it-IT', 'it'], // Latin often uses Italian voices as fallback
}

interface TTSOptions {
  rate?: number      // 0.1 to 10, default 1
  pitch?: number     // 0 to 2, default 1
  volume?: number    // 0 to 1, default 1
}

interface SpeakResult {
  success: boolean
  error?: string
}

class TextToSpeechService {
  private synth: SpeechSynthesis | null = null
  private voices: SpeechSynthesisVoice[] = []
  private voicesLoaded = false
  private voicesLoadPromise: Promise<void> | null = null

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis
      this.voicesLoadPromise = this.loadVoices()
    }
  }

  /**
   * Check if TTS is available
   */
  isAvailable(): boolean {
    return this.synth !== null
  }

  /**
   * Load available voices
   */
  private async loadVoices(): Promise<void> {
    if (!this.synth) return

    return new Promise<void>((resolve) => {
      const loadVoiceList = () => {
        this.voices = this.synth!.getVoices()
        if (this.voices.length > 0) {
          this.voicesLoaded = true
          resolve()
        }
      }

      // Try loading immediately
      loadVoiceList()

      // Also listen for voiceschanged event (Chrome loads async)
      if (!this.voicesLoaded && this.synth) {
        this.synth.addEventListener('voiceschanged', loadVoiceList)
        // Timeout fallback
        setTimeout(() => {
          loadVoiceList()
          resolve()
        }, 1000)
      }
    })
  }

  /**
   * Get the best voice for a language
   */
  private getBestVoice(language: Language | 'german'): SpeechSynthesisVoice | null {
    if (!this.voicesLoaded || this.voices.length === 0) return null

    const locales = LANGUAGE_LOCALES[language]

    // Try each locale in order of preference
    for (const locale of locales) {
      // First, try to find a native voice
      const nativeVoice = this.voices.find(
        v => v.lang.toLowerCase().startsWith(locale.toLowerCase()) && !v.name.includes('Google')
      )
      if (nativeVoice) return nativeVoice

      // Then try any voice for that locale
      const anyVoice = this.voices.find(
        v => v.lang.toLowerCase().startsWith(locale.toLowerCase())
      )
      if (anyVoice) return anyVoice
    }

    return null
  }

  /**
   * Get available voices for a language
   */
  async getVoicesForLanguage(language: Language | 'german'): Promise<SpeechSynthesisVoice[]> {
    await this.voicesLoadPromise

    const locales = LANGUAGE_LOCALES[language]
    return this.voices.filter(voice =>
      locales.some(locale => voice.lang.toLowerCase().startsWith(locale.toLowerCase()))
    )
  }

  /**
   * Speak text in a specific language
   */
  async speak(
    text: string,
    language: Language | 'german',
    options: TTSOptions = {}
  ): Promise<SpeakResult> {
    if (!this.synth) {
      return { success: false, error: 'Text-to-speech is not available in this browser' }
    }

    // Wait for voices to load
    await this.voicesLoadPromise

    // Cancel any ongoing speech
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // Set voice
    const voice = this.getBestVoice(language)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    } else {
      // Fallback to locale without specific voice
      const locales = LANGUAGE_LOCALES[language]
      utterance.lang = locales[0]
    }

    // Apply options
    utterance.rate = options.rate ?? 0.9 // Slightly slower for learning
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1

    return new Promise((resolve) => {
      utterance.onend = () => {
        resolve({ success: true })
      }

      utterance.onerror = (event) => {
        resolve({
          success: false,
          error: event.error || 'Speech synthesis failed'
        })
      }

      this.synth!.speak(utterance)
    })
  }

  /**
   * Stop current speech
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth?.speaking ?? false
  }
}

// Singleton instance
let ttsService: TextToSpeechService | null = null

export function getTTSService(): TextToSpeechService {
  if (!ttsService) {
    ttsService = new TextToSpeechService()
  }
  return ttsService
}

// Convenience function
export async function speakText(
  text: string,
  language: Language | 'german',
  options?: TTSOptions
): Promise<SpeakResult> {
  const service = getTTSService()
  return service.speak(text, language, options)
}

export function stopSpeaking(): void {
  const service = getTTSService()
  service.stop()
}

export function isTTSAvailable(): boolean {
  const service = getTTSService()
  return service.isAvailable()
}
