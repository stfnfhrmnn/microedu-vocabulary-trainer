import type { OCRProvider, OCRResult, VocabularyCandidate, ExtractionHints, TextBlock } from '../types'
import { parseVocabularyFromText } from '../parser'

/**
 * Google Cloud Vision API Provider
 * Uses server-side proxy to keep API key secure
 */
export class GoogleVisionProvider implements OCRProvider {
  name = 'Google Vision'
  private enabled: boolean = false

  constructor(enabled?: boolean) {
    this.enabled = enabled ?? false
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  // Legacy method for compatibility - now just enables/disables
  setApiKey(apiKey: string): void {
    this.enabled = !!apiKey
  }

  async isAvailable(): Promise<boolean> {
    // Check if enabled and network connection available
    if (!this.enabled) {
      return false
    }

    // Check network availability
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return false
    }

    return true
  }

  async extractText(image: Blob): Promise<OCRResult> {
    if (!this.enabled) {
      throw new Error('Google Vision not enabled')
    }

    const base64Image = await this.blobToBase64(image)

    // Use server-side proxy instead of direct API call
    const response = await fetch('/api/google/vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: {
          content: base64Image,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.error || response.statusText
      throw new Error(`Google Vision API error: ${errorMessage}`)
    }

    const data = await response.json()
    const annotation = data.responses?.[0]?.fullTextAnnotation

    if (!annotation) {
      return {
        text: '',
        confidence: 0,
        blocks: [],
      }
    }

    // Extract blocks with bounding boxes
    const blocks: TextBlock[] = []
    const pages = annotation.pages || []

    for (const page of pages) {
      for (const block of page.blocks || []) {
        for (const paragraph of block.paragraphs || []) {
          const words: string[] = []
          let totalConfidence = 0
          let wordCount = 0

          for (const word of paragraph.words || []) {
            const wordText = word.symbols
              ?.map((s: { text: string }) => s.text)
              .join('') || ''
            words.push(wordText)
            totalConfidence += word.confidence || 0.9
            wordCount++
          }

          if (words.length > 0) {
            const bbox = paragraph.boundingBox?.vertices
            blocks.push({
              text: words.join(' '),
              confidence: wordCount > 0 ? totalConfidence / wordCount : 0.9,
              bbox: bbox
                ? {
                    x0: Math.min(...bbox.map((v: { x?: number }) => v.x || 0)),
                    y0: Math.min(...bbox.map((v: { y?: number }) => v.y || 0)),
                    x1: Math.max(...bbox.map((v: { x?: number }) => v.x || 0)),
                    y1: Math.max(...bbox.map((v: { y?: number }) => v.y || 0)),
                  }
                : undefined,
            })
          }
        }
      }
    }

    // Calculate overall confidence
    const avgConfidence =
      blocks.length > 0
        ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length
        : 0

    return {
      text: annotation.text || '',
      confidence: avgConfidence,
      blocks,
    }
  }

  async extractVocabulary(
    image: Blob,
    hints?: ExtractionHints
  ): Promise<VocabularyCandidate[]> {
    void hints
    const result = await this.extractText(image)

    // Use the parser to extract vocabulary pairs
    return parseVocabularyFromText(result.text, result.blocks)
  }

  async terminate(): Promise<void> {
    // No cleanup needed for API-based provider
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
}

// Singleton instance
let googleVisionInstance: GoogleVisionProvider | null = null

export function getGoogleVisionProvider(enabled?: boolean): GoogleVisionProvider {
  if (!googleVisionInstance) {
    googleVisionInstance = new GoogleVisionProvider(enabled)
  } else if (enabled !== undefined) {
    googleVisionInstance.setEnabled(enabled)
  }
  return googleVisionInstance
}
