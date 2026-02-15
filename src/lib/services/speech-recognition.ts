/**
 * Speech Recognition Service
 *
 * Uses Web Speech API for voice input and pronunciation practice.
 */

import type { Language } from '@/lib/db/schema'

// Language to BCP-47 locale mapping for speech recognition
const LANGUAGE_LOCALES: Record<Language | 'german', string> = {
  german: 'de-DE',
  french: 'fr-FR',
  spanish: 'es-ES',
  latin: 'la', // Latin may not be well supported
}

interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

interface SpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  onEnd?: () => void
}

type SpeechRecognitionCallback = (result: SpeechRecognitionResult) => void
type SpeechRecognitionErrorCallback = (error: string) => void

// Type declarations for Web Speech API (not in all TypeScript libs)
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: {
    isFinal: boolean
    length: number
    item(index: number): { transcript: string; confidence: number }
    [index: number]: { transcript: string; confidence: number }
  }
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

class SpeechRecognitionService {
  private recognition: SpeechRecognitionInstance | null = null
  private isListening = false
  private currentLanguage: Language | 'german' = 'german'

  constructor() {
    this.initRecognition()
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognitionAPI) {
      this.recognition = new SpeechRecognitionAPI()
    }
  }

  /**
   * Check if speech recognition is available
   */
  isAvailable(): boolean {
    return this.recognition !== null
  }

  /**
   * Start listening for speech
   */
  start(
    language: Language | 'german',
    onResult: SpeechRecognitionCallback,
    onError?: SpeechRecognitionErrorCallback,
    options: SpeechRecognitionOptions = {}
  ): boolean {
    if (!this.recognition) {
      onError?.('Speech recognition is not available in this browser')
      return false
    }

    if (this.isListening) {
      this.stop()
    }

    this.currentLanguage = language
    this.recognition.lang = LANGUAGE_LOCALES[language]
    this.recognition.continuous = options.continuous ?? false
    this.recognition.interimResults = options.interimResults ?? true
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result) {
          const alternative = result[0]
          onResult({
            transcript: alternative.transcript,
            confidence: alternative.confidence,
            isFinal: result.isFinal,
          })
        }
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMessage = this.getErrorMessage(event.error)
      onError?.(errorMessage)
      this.isListening = false
    }

    this.recognition.onend = () => {
      this.isListening = false
      options.onEnd?.()
    }

    try {
      this.recognition.start()
      this.isListening = true
      return true
    } catch {
      onError?.('Failed to start speech recognition')
      return false
    }
  }

  /**
   * Stop listening
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  /**
   * Abort listening immediately
   */
  abort(): void {
    if (this.recognition && this.isListening) {
      this.recognition.abort()
      this.isListening = false
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: string): string {
    switch (error) {
      case 'no-speech':
        return 'Keine Sprache erkannt. Bitte sprich deutlich.'
      case 'audio-capture':
        return 'Mikrofon nicht verfügbar. Bitte überprüfe die Berechtigungen.'
      case 'not-allowed':
        return 'Mikrofonzugriff wurde verweigert. Bitte erlaube den Zugriff in den Einstellungen.'
      case 'network':
        return 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.'
      case 'aborted':
        return 'Spracherkennung abgebrochen.'
      case 'language-not-supported':
        return 'Diese Sprache wird nicht unterstützt.'
      default:
        return 'Spracherkennung fehlgeschlagen. Bitte versuche es erneut.'
    }
  }
}

// Singleton instance
let speechRecognitionService: SpeechRecognitionService | null = null

export function getSpeechRecognitionService(): SpeechRecognitionService {
  if (!speechRecognitionService) {
    speechRecognitionService = new SpeechRecognitionService()
  }
  return speechRecognitionService
}

// Convenience functions
export function isSpeechRecognitionAvailable(): boolean {
  return getSpeechRecognitionService().isAvailable()
}

export function startListening(
  language: Language | 'german',
  onResult: SpeechRecognitionCallback,
  onError?: SpeechRecognitionErrorCallback,
  options?: SpeechRecognitionOptions
): boolean {
  return getSpeechRecognitionService().start(language, onResult, onError, options)
}

export function stopListening(): void {
  getSpeechRecognitionService().stop()
}

export function isCurrentlyListening(): boolean {
  return getSpeechRecognitionService().getIsListening()
}
