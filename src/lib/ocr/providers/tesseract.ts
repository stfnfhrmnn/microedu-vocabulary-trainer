import { createWorker, type Worker as TesseractWorker } from 'tesseract.js'
import type { OCRProvider, OCRResult, VocabularyCandidate, ExtractionHints, TextBlock } from '../types'
import { parseVocabularyFromText } from '../parser'

/**
 * Map language codes to Tesseract language codes
 */
function getLanguageCode(language?: string): string {
  switch (language) {
    case 'french':
      return 'fra'
    case 'spanish':
      return 'spa'
    case 'latin':
      return 'lat'
    case 'german':
    default:
      return 'deu'
  }
}

/**
 * Tesseract.js OCR Provider
 * Works offline after language data is cached
 */
export class TesseractProvider implements OCRProvider {
  name = 'Tesseract'
  private worker: TesseractWorker | null = null
  private initialized = false
  private initPromise: Promise<void> | null = null
  private currentLanguages: string[] = []

  /**
   * Initialize worker with specified languages
   */
  private async initWorker(languages: string[]): Promise<void> {
    // Check if we need to reinitialize with different languages
    const needsReinit =
      !this.initialized ||
      languages.sort().join('+') !== this.currentLanguages.sort().join('+')

    if (!needsReinit && this.worker) {
      return
    }

    // Terminate existing worker if any
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }

    const langString = languages.join('+')
    this.worker = await createWorker(langString, 1, {
      // Use CDN for language data (will be cached by service worker)
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    })

    this.currentLanguages = languages
    this.initialized = true
  }

  /**
   * Ensure worker is initialized with required languages
   */
  private async ensureWorker(sourceLanguage?: string, targetLanguage?: string): Promise<void> {
    const languages = ['deu'] // Always include German

    if (targetLanguage) {
      const targetCode = getLanguageCode(targetLanguage)
      if (!languages.includes(targetCode)) {
        languages.push(targetCode)
      }
    }

    if (sourceLanguage) {
      const sourceCode = getLanguageCode(sourceLanguage)
      if (!languages.includes(sourceCode)) {
        languages.push(sourceCode)
      }
    }

    // Use a promise to prevent multiple concurrent initializations
    if (this.initPromise) {
      await this.initPromise
      // Check if languages match after waiting
      if (languages.sort().join('+') === this.currentLanguages.sort().join('+')) {
        return
      }
    }

    this.initPromise = this.initWorker(languages)
    await this.initPromise
    this.initPromise = null
  }

  async isAvailable(): Promise<boolean> {
    // Tesseract.js is always available (runs in browser)
    return true
  }

  async extractText(image: Blob): Promise<OCRResult> {
    await this.ensureWorker()

    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    const result = await this.worker.recognize(image)

    // Tesseract.js v6 uses 'lines' instead of 'paragraphs'
    const lines = (result.data as { lines?: Array<{ text: string; confidence: number; bbox?: { x0: number; y0: number; x1: number; y1: number } }> }).lines || []
    const blocks: TextBlock[] = lines.map((line) => ({
      text: line.text,
      confidence: line.confidence / 100,
      bbox: line.bbox ? {
        x0: line.bbox.x0,
        y0: line.bbox.y0,
        x1: line.bbox.x1,
        y1: line.bbox.y1,
      } : undefined,
    }))

    return {
      text: result.data.text,
      confidence: result.data.confidence / 100,
      blocks,
    }
  }

  async extractVocabulary(
    image: Blob,
    hints?: ExtractionHints
  ): Promise<VocabularyCandidate[]> {
    await this.ensureWorker(hints?.sourceLanguage, hints?.targetLanguage)

    const ocrResult = await this.extractText(image)

    // Parse vocabulary from extracted text, including bounding boxes for two-column detection
    const parsed = parseVocabularyFromText(ocrResult.text, ocrResult.blocks, hints)

    // Combine parser confidence with OCR confidence
    return parsed.map((item) => ({
      ...item,
      confidence: item.confidence * ocrResult.confidence,
    }))
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.initialized = false
      this.currentLanguages = []
    }
  }
}

// Singleton instance
let tesseractInstance: TesseractProvider | null = null

export function getTesseractProvider(): TesseractProvider {
  if (!tesseractInstance) {
    tesseractInstance = new TesseractProvider()
  }
  return tesseractInstance
}
