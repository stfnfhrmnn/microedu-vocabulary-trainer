/**
 * Extract title/name from image using OCR
 * Designed for book covers and chapter pages
 */

import { ocrService } from './ocr-service'
import type { TextBlock } from './types'

interface ExtractedTitle {
  title: string
  confidence: number
  source: 'largest' | 'top' | 'pattern' | 'fallback'
}

/**
 * Extract title from image
 * Strategy:
 * 1. Look for largest text block (likely title)
 * 2. Look for text at top of image
 * 3. Look for title patterns (Kapitel X, Unit X, etc.)
 * 4. Fall back to first significant text block
 */
export async function extractTitleFromImage(
  image: Blob,
  type: 'book' | 'chapter'
): Promise<ExtractedTitle | null> {
  try {
    const result = await ocrService.extractText(image)

    if (!result.text || result.blocks.length === 0) {
      return null
    }

    // Try different extraction strategies
    const strategies = [
      () => extractByLargestBlock(result.blocks),
      () => extractByTopPosition(result.blocks),
      () => extractByPattern(result.blocks, type),
      () => extractFallback(result.blocks),
    ]

    for (const strategy of strategies) {
      const extracted = strategy()
      if (extracted && extracted.title.length >= 2) {
        return extracted
      }
    }

    return null
  } catch (error) {
    console.error('Failed to extract title from image:', error)
    return null
  }
}

/**
 * Extract by finding the largest text block
 * Large text is typically the title
 */
function extractByLargestBlock(blocks: TextBlock[]): ExtractedTitle | null {
  const blocksWithBbox = blocks.filter(b => b.bbox && b.text.trim().length >= 2)

  if (blocksWithBbox.length === 0) return null

  // Calculate block sizes (width * height)
  const blockSizes = blocksWithBbox.map(b => ({
    block: b,
    size: (b.bbox!.x1 - b.bbox!.x0) * (b.bbox!.y1 - b.bbox!.y0),
  }))

  // Sort by size descending
  blockSizes.sort((a, b) => b.size - a.size)

  // Get the largest block
  const largest = blockSizes[0]

  // Validate it looks like a title
  const title = cleanTitle(largest.block.text)
  if (isValidTitle(title)) {
    return {
      title,
      confidence: Math.min(0.9, largest.block.confidence),
      source: 'largest',
    }
  }

  return null
}

/**
 * Extract by finding text at the top of the image
 * Titles are often at the top
 */
function extractByTopPosition(blocks: TextBlock[]): ExtractedTitle | null {
  const blocksWithBbox = blocks.filter(b => b.bbox && b.text.trim().length >= 2)

  if (blocksWithBbox.length === 0) return null

  // Sort by y position (top to bottom)
  const sorted = [...blocksWithBbox].sort((a, b) => a.bbox!.y0 - b.bbox!.y0)

  // Take top 3 blocks and find the best title candidate
  const topBlocks = sorted.slice(0, 3)

  for (const block of topBlocks) {
    const title = cleanTitle(block.text)
    if (isValidTitle(title)) {
      return {
        title,
        confidence: Math.min(0.85, block.confidence),
        source: 'top',
      }
    }
  }

  return null
}

/**
 * Extract by looking for title patterns
 * (Kapitel X, Unit X, Découvertes, etc.)
 */
function extractByPattern(
  blocks: TextBlock[],
  type: 'book' | 'chapter'
): ExtractedTitle | null {
  const patterns = type === 'book'
    ? [
        /^(Découvertes|À\s*plus|Tous\s*ensemble|Vamos|Adelante|Prima)/i,
        /^[A-ZÄÖÜ][a-zäöü]+\s+\d+$/,  // "Buch 2", "Band 3"
        /^[A-ZÄÖÜ][a-zäöü]+$/,         // Single capitalized word
      ]
    : [
        /^(Kapitel|Chapitre|Chapter|Unit[ée]?|Lektion|Le[çc]on)\s*\d+/i,
        /^\d+\.\s+[A-ZÄÖÜ]/,           // "3. Vokabeln"
        /^[IVXLC]+\.\s+/i,             // "III. ..."
      ]

  for (const block of blocks) {
    for (const pattern of patterns) {
      if (pattern.test(block.text.trim())) {
        const title = cleanTitle(block.text)
        if (title.length >= 2) {
          return {
            title,
            confidence: 0.8,
            source: 'pattern',
          }
        }
      }
    }
  }

  return null
}

/**
 * Fallback: return first significant text block
 */
function extractFallback(blocks: TextBlock[]): ExtractedTitle | null {
  const significantBlocks = blocks.filter(b =>
    b.text.trim().length >= 3 &&
    b.text.trim().length <= 100 &&
    b.confidence > 0.5
  )

  if (significantBlocks.length === 0) return null

  const title = cleanTitle(significantBlocks[0].text)
  return {
    title,
    confidence: 0.6,
    source: 'fallback',
  }
}

/**
 * Clean up extracted title
 */
function cleanTitle(text: string): string {
  return text
    .trim()
    // Remove common OCR artifacts
    .replace(/[^\p{L}\p{N}\s\-.:!?()]/gu, '')
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    // Remove leading/trailing special chars
    .replace(/^[\-.:]+|[\-.:]+$/g, '')
    .trim()
}

/**
 * Validate if text looks like a valid title
 */
function isValidTitle(text: string): boolean {
  // Too short
  if (text.length < 2) return false

  // Too long
  if (text.length > 100) return false

  // Mostly numbers (probably not a title)
  const letterRatio = (text.match(/\p{L}/gu) || []).length / text.length
  if (letterRatio < 0.3) return false

  // Contains typical non-title patterns
  const nonTitlePatterns = [
    /^page\s+\d+$/i,
    /^\d+\s*$/,
    /^copyright/i,
    /^isbn/i,
    /^www\./i,
    /^http/i,
  ]

  for (const pattern of nonTitlePatterns) {
    if (pattern.test(text)) return false
  }

  return true
}

/**
 * Generate suggested book names from common textbook patterns
 */
export function suggestBookNames(language: 'french' | 'spanish' | 'latin'): string[] {
  const suggestions: Record<string, string[]> = {
    french: [
      'Découvertes 1',
      'Découvertes 2',
      'Découvertes 3',
      'À plus 1',
      'À plus 2',
      'Tous ensemble 1',
      'Tous ensemble 2',
    ],
    spanish: [
      'Vamos Adelante 1',
      'Vamos Adelante 2',
      'Encuentros 1',
      'Encuentros 2',
    ],
    latin: [
      'Prima Nova 1',
      'Prima Nova 2',
      'Cursus 1',
      'Cursus 2',
    ],
  }

  return suggestions[language] || []
}
