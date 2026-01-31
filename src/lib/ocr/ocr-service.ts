import type { OCRProvider, OCRProviderType, VocabularyCandidate, ExtractionHints, OCRResult } from './types'
import { getTesseractProvider } from './providers/tesseract'
import { getGeminiProvider } from './providers/gemini'
import { getGoogleVisionProvider } from './providers/google-vision'

/**
 * OCR Service - manages providers and provides unified API for vocabulary extraction
 */
class OCRService {
  private preferredProvider: OCRProviderType = 'tesseract'
  private googleEnabled: boolean = false

  /**
   * Set the preferred OCR provider
   */
  setPreferredProvider(provider: OCRProviderType): void {
    this.preferredProvider = provider
  }

  /**
   * Set Google API enabled status for cloud-based OCR (Vision API and Gemini)
   */
  setGoogleApiKey(apiKey: string | null): void {
    // Legacy method - now just enables/disables based on truthy value
    this.googleEnabled = !!apiKey
    const provider = getGoogleVisionProvider()
    provider.setEnabled(this.googleEnabled)
    // Gemini provider is a placeholder, just update it if we have an apiKey-like string
    if (apiKey) {
      const geminiProvider = getGeminiProvider()
      geminiProvider.setApiKey(apiKey)
    }
  }

  /**
   * @deprecated Use setGoogleApiKey instead
   */
  setGeminiApiKey(apiKey: string): void {
    this.setGoogleApiKey(apiKey)
  }

  /**
   * Get a provider instance by type
   */
  private getProvider(type: OCRProviderType): OCRProvider {
    switch (type) {
      case 'google-vision':
        return getGoogleVisionProvider()
      case 'gemini':
        return getGeminiProvider()
      case 'tesseract':
      default:
        return getTesseractProvider()
    }
  }

  /**
   * Get the best available provider
   * Falls back to Tesseract if preferred provider is unavailable
   */
  private async getBestProvider(): Promise<OCRProvider> {
    // Try preferred provider first
    const preferred = this.getProvider(this.preferredProvider)
    if (await preferred.isAvailable()) {
      return preferred
    }

    // Fall back to Tesseract (always available)
    console.log(`${this.preferredProvider} not available, falling back to Tesseract`)
    return getTesseractProvider()
  }

  /**
   * Extract text from an image
   */
  async extractText(image: Blob): Promise<OCRResult> {
    const provider = await this.getBestProvider()
    return provider.extractText(image)
  }

  /**
   * Extract vocabulary pairs from an image
   * Main entry point for OCR-based vocabulary import
   */
  async extractVocabulary(
    image: Blob,
    hints?: ExtractionHints
  ): Promise<VocabularyCandidate[]> {
    const provider = await this.getBestProvider()
    return provider.extractVocabulary(image, hints)
  }

  /**
   * Check if a specific provider is available
   */
  async isProviderAvailable(type: OCRProviderType): Promise<boolean> {
    const provider = this.getProvider(type)
    return provider.isAvailable()
  }

  /**
   * Get the currently active provider type
   */
  async getActiveProviderType(): Promise<OCRProviderType> {
    const preferred = this.getProvider(this.preferredProvider)
    if (await preferred.isAvailable()) {
      return this.preferredProvider
    }
    return 'tesseract'
  }

  /**
   * Cleanup resources (terminate workers)
   */
  async cleanup(): Promise<void> {
    const tesseract = getTesseractProvider()
    await tesseract.terminate()
  }
}

// Singleton instance
export const ocrService = new OCRService()
