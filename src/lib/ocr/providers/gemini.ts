import type { OCRProvider, OCRResult, VocabularyCandidate, ExtractionHints } from '../types'

/**
 * Gemini OCR Provider (Placeholder)
 *
 * This provider will use Google's Gemini Vision API for OCR and vocabulary extraction.
 * Currently a placeholder - actual implementation requires API integration.
 */
export class GeminiProvider implements OCRProvider {
  name = 'Gemini'
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    // Gemini requires API key and network connection
    if (!this.apiKey) {
      return false
    }

    // Check network availability
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false
    }

    return true
  }

  async extractText(image: Blob): Promise<OCRResult> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    // TODO: Implement Gemini Vision API call
    // For now, throw not implemented error
    throw new Error(
      'Gemini OCR is not yet implemented. Please use Tesseract for now.'
    )
  }

  async extractVocabulary(
    image: Blob,
    hints?: ExtractionHints
  ): Promise<VocabularyCandidate[]> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured')
    }

    // TODO: Implement Gemini Vision API call with structured prompt
    // The prompt would ask Gemini to:
    // 1. Extract text from the image
    // 2. Identify vocabulary pairs
    // 3. Return structured JSON with source/target pairs
    //
    // Example prompt:
    // "This image contains a vocabulary list with German words and their [language] translations.
    // Extract all vocabulary pairs and return them as JSON array:
    // [{ sourceText: 'German word', targetText: 'Translation', confidence: 0.95 }]"

    throw new Error(
      'Gemini OCR is not yet implemented. Please use Tesseract for now.'
    )
  }

  async terminate(): Promise<void> {
    // No cleanup needed for API-based provider
  }
}

// Singleton instance
let geminiInstance: GeminiProvider | null = null

export function getGeminiProvider(apiKey?: string): GeminiProvider {
  if (!geminiInstance) {
    geminiInstance = new GeminiProvider(apiKey)
  } else if (apiKey) {
    geminiInstance.setApiKey(apiKey)
  }
  return geminiInstance
}
