import type { OCRProvider, OCRProviderType, VocabularyCandidate, ExtractionHints, OCRResult } from './types'
import { getTesseractProvider } from './providers/tesseract'
import { getGeminiProvider } from './providers/gemini'

/**
 * OCR Service - manages providers and provides unified API for vocabulary extraction
 */
class OCRService {
  private preferredProvider: OCRProviderType = 'tesseract'
  private geminiApiKey: string | null = null

  /**
   * Set the preferred OCR provider
   */
  setPreferredProvider(provider: OCRProviderType): void {
    this.preferredProvider = provider
  }

  /**
   * Set Gemini API key for cloud-based OCR
   */
  setGeminiApiKey(apiKey: string): void {
    this.geminiApiKey = apiKey
    getGeminiProvider(apiKey)
  }

  /**
   * Get a provider instance by type
   */
  private getProvider(type: OCRProviderType): OCRProvider {
    switch (type) {
      case 'gemini':
        return getGeminiProvider(this.geminiApiKey || undefined)
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
