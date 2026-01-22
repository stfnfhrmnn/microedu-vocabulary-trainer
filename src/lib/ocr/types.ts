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

// ============================================================================
// Multi-Chapter Detection Types
// ============================================================================

export interface ChapterMarker {
  detectedName: string
  startIndex: number           // Index in the text/blocks where chapter starts
  endIndex?: number            // Index where chapter ends (next chapter or end)
  confidence: number
}

export interface ParsedChapter {
  detectedName: string
  candidates: VocabularyCandidate[]
  matchedChapterId?: string    // If matches an existing chapter
  isNewChapter: boolean
}

export interface MultiChapterOCRResult {
  chapters: ParsedChapter[]
  unassignedVocabulary: VocabularyCandidate[]  // Vocab not assigned to any chapter
}

// Extended candidate with duplicate info
export interface VocabularyCandidateWithMeta extends VocabularyCandidate {
  isDuplicate?: boolean
  duplicateOf?: string         // existing vocab ID
  duplicateSimilarity?: number // 0-1
  chapterAssignment?: string   // chapter ID or 'new:ChapterName' or 'book-level'
}
