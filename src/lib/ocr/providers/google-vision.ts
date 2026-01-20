import type { OCRProvider, OCRResult, VocabularyCandidate, ExtractionHints, TextBlock } from '../types'
import { parseVocabularyFromText } from '../parser'

/**
 * Google Cloud Vision API Provider
 * Uses DOCUMENT_TEXT_DETECTION for best vocabulary list recognition
 */
export class GoogleVisionProvider implements OCRProvider {
  name = 'Google Vision'
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey
  }

  async isAvailable(): Promise<boolean> {
    // Requires API key and network connection
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
      throw new Error('Google API key not configured')
    }

    const base64Image = await this.blobToBase64(image)

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'DOCUMENT_TEXT_DETECTION',
                  maxResults: 1,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = errorData?.error?.message || response.statusText
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
    const result = await this.extractText(image)

    // Use the parser to extract vocabulary pairs
    return parseVocabularyFromText(result.text, result.blocks, hints)
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

export function getGoogleVisionProvider(apiKey?: string): GoogleVisionProvider {
  if (!googleVisionInstance) {
    googleVisionInstance = new GoogleVisionProvider(apiKey)
  } else if (apiKey) {
    googleVisionInstance.setApiKey(apiKey)
  }
  return googleVisionInstance
}
