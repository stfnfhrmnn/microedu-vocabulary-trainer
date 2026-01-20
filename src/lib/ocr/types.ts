/**
 * OCR Provider types for vocabulary extraction
 */

export interface TextBlock {
  text: string
  confidence: number
  bbox?: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
}

export interface OCRResult {
  text: string
  confidence: number
  blocks: TextBlock[]
}

export interface VocabularyCandidate {
  sourceText: string
  targetText: string
  confidence: number
  notes?: string
}

export interface ExtractionHints {
  sourceLanguage?: string
  targetLanguage?: string
  expectedFormat?: 'pipe' | 'tab' | 'parenthetical' | 'dash' | 'colon'
}

export interface OCRProvider {
  name: string
  extractText(image: Blob): Promise<OCRResult>
  extractVocabulary(image: Blob, hints?: ExtractionHints): Promise<VocabularyCandidate[]>
  isAvailable(): Promise<boolean>
  terminate?(): Promise<void>
}

export type OCRProviderType = 'tesseract' | 'gemini' | 'google-vision'
