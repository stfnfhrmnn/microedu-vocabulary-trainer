/**
 * Parse vocabulary from OCR-extracted text
 * Supports multiple common formats for vocabulary lists
 */

import type { TextBlock, ExtractionHints, VocabularyCandidate } from './types'

export interface ParsedVocabulary {
  sourceText: string
  targetText: string
  confidence: number
  notes?: string
}

/**
 * Parse a single line of text into a vocabulary pair
 * Supports:
 * - Two-column: "das Haus | la maison"
 * - Tab-separated: "das Haus\tla maison"
 * - Parenthetical: "das Haus (la maison)"
 * - Dash-separated: "das Haus - la maison"
 * - Colon-separated: "das Haus : la maison"
 * - Arrow-separated: "das Haus = la maison", "das Haus → la maison"
 * - Equals-separated: "das Haus = la maison"
 */
export function parseLine(line: string): ParsedVocabulary | null {
  const trimmed = line.trim()

  if (!trimmed || trimmed.length < 3) {
    return null
  }

  // Skip lines that look like headers or section markers
  if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return null
  }

  // Remove leading numbers/bullets but preserve the rest
  const withoutBullet = trimmed.replace(/^[\d]+[.)]\s*/, '').trim()
  if (!withoutBullet) {
    return null
  }

  let sourceText = ''
  let targetText = ''
  let confidence = 0.8 // Default confidence for parsed text

  // Try pipe separator (|)
  if (withoutBullet.includes('|')) {
    const parts = withoutBullet.split('|').map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      sourceText = parts[0]
      targetText = parts[1]
      confidence = 0.95
    }
  }
  // Try tab separator
  else if (withoutBullet.includes('\t')) {
    const parts = withoutBullet.split('\t').map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      sourceText = parts[0]
      targetText = parts[1]
      confidence = 0.95
    }
  }
  // Try arrow separators (→, ➔, ->, =>)
  else if (withoutBullet.match(/\s*[→➔⟶]\s*/) || withoutBullet.match(/\s*->\s*/) || withoutBullet.match(/\s*=>\s*/)) {
    const parts = withoutBullet.split(/\s*(?:→|➔|⟶|->|=>)\s*/).map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      sourceText = parts[0]
      targetText = parts[1]
      confidence = 0.95
    }
  }
  // Try equals separator (=)
  else if (withoutBullet.match(/\s*=\s*/)) {
    const parts = withoutBullet.split(/\s*=\s*/).map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      sourceText = parts[0]
      targetText = parts[1]
      confidence = 0.9
    }
  }
  // Try parenthetical format: "word (translation)"
  else if (withoutBullet.match(/^(.+?)\s*\((.+?)\)\s*$/)) {
    const match = withoutBullet.match(/^(.+?)\s*\((.+?)\)\s*$/)
    if (match && match[1] && match[2]) {
      sourceText = match[1].trim()
      targetText = match[2].trim()
      confidence = 0.9
    }
  }
  // Try dash separator (but be careful with hyphenated words)
  else if (withoutBullet.match(/\s+-\s+/)) {
    const parts = withoutBullet.split(/\s+-\s+/).map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      sourceText = parts[0]
      targetText = parts[1]
      confidence = 0.85
    }
  }
  // Try colon separator
  else if (withoutBullet.match(/\s*:\s*/)) {
    const parts = withoutBullet.split(/\s*:\s*/).map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      sourceText = parts[0]
      targetText = parts[1]
      confidence = 0.85
    }
  }

  // Validate that we have valid vocabulary
  if (!sourceText || !targetText) {
    return null
  }

  // Clean up common OCR artifacts
  sourceText = cleanOCRText(sourceText)
  targetText = cleanOCRText(targetText)

  // Final validation
  if (sourceText.length < 1 || targetText.length < 1) {
    return null
  }

  return {
    sourceText,
    targetText,
    confidence,
  }
}

/**
 * Clean up common OCR artifacts from text
 */
function cleanOCRText(text: string): string {
  return text
    // Remove leading/trailing punctuation that's not part of the word
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}]+$/u, '')
    // Normalize quotes
    .replace(/[""„"]/g, '"')
    .replace(/[''‚']/g, "'")
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parse multiple lines of text into vocabulary pairs
 * Optionally uses bounding box information for two-column layout detection
 */
export function parseVocabularyFromText(
  text: string,
  blocks?: TextBlock[],
  hints?: ExtractionHints
): VocabularyCandidate[] {
  // First try two-column detection if we have block info
  if (blocks && blocks.length > 0) {
    const twoColumnResults = detectTwoColumnLayout(blocks)
    if (twoColumnResults.length > 0) {
      return twoColumnResults
    }
  }

  // Fall back to line-by-line parsing
  const lines = text.split(/\n|\r\n/)
  const results: VocabularyCandidate[] = []

  for (const line of lines) {
    const parsed = parseLine(line)
    if (parsed) {
      results.push(parsed)
    }
  }

  return results
}

/**
 * Detect two-column layout using bounding box information
 * Groups text blocks by x-position and matches by y-position proximity
 */
function detectTwoColumnLayout(blocks: TextBlock[]): VocabularyCandidate[] {
  // Need at least 2 blocks
  if (blocks.length < 2) {
    return []
  }

  // Filter blocks that have bounding boxes
  const blocksWithBbox = blocks.filter(b => b.bbox)
  if (blocksWithBbox.length < 2) {
    return []
  }

  // Calculate the median x-position to split into left/right columns
  const xPositions = blocksWithBbox.map(b => b.bbox!.x0).sort((a, b) => a - b)
  const pageWidth = Math.max(...blocksWithBbox.map(b => b.bbox!.x1))
  const midpoint = pageWidth / 2

  // Split into left and right columns
  const leftColumn: TextBlock[] = []
  const rightColumn: TextBlock[] = []

  for (const block of blocksWithBbox) {
    const centerX = (block.bbox!.x0 + block.bbox!.x1) / 2
    if (centerX < midpoint) {
      leftColumn.push(block)
    } else {
      rightColumn.push(block)
    }
  }

  // Need blocks in both columns for two-column layout
  if (leftColumn.length === 0 || rightColumn.length === 0) {
    return []
  }

  // Check if columns are roughly balanced (within 50% difference)
  const ratio = Math.min(leftColumn.length, rightColumn.length) / Math.max(leftColumn.length, rightColumn.length)
  if (ratio < 0.5) {
    return []
  }

  // Sort both columns by y-position
  leftColumn.sort((a, b) => a.bbox!.y0 - b.bbox!.y0)
  rightColumn.sort((a, b) => a.bbox!.y0 - b.bbox!.y0)

  // Match left-column words to right-column words by y-position proximity
  const results: VocabularyCandidate[] = []
  const usedRightIndices = new Set<number>()

  for (const leftBlock of leftColumn) {
    const leftY = (leftBlock.bbox!.y0 + leftBlock.bbox!.y1) / 2

    // Find the closest right-column block by y-position
    let bestMatch: { block: TextBlock; distance: number; index: number } | null = null

    for (let i = 0; i < rightColumn.length; i++) {
      if (usedRightIndices.has(i)) continue

      const rightBlock = rightColumn[i]
      const rightY = (rightBlock.bbox!.y0 + rightBlock.bbox!.y1) / 2
      const distance = Math.abs(leftY - rightY)

      // Maximum allowed vertical distance (roughly one line height)
      const maxDistance = (leftBlock.bbox!.y1 - leftBlock.bbox!.y0) * 2

      if (distance <= maxDistance && (!bestMatch || distance < bestMatch.distance)) {
        bestMatch = { block: rightBlock, distance, index: i }
      }
    }

    if (bestMatch) {
      usedRightIndices.add(bestMatch.index)

      const sourceText = cleanOCRText(leftBlock.text)
      const targetText = cleanOCRText(bestMatch.block.text)

      if (sourceText && targetText) {
        // Calculate confidence based on alignment quality
        const alignmentQuality = 1 - (bestMatch.distance / ((leftBlock.bbox!.y1 - leftBlock.bbox!.y0) * 2))
        const avgBlockConfidence = (leftBlock.confidence + bestMatch.block.confidence) / 2
        const confidence = Math.min(0.95, alignmentQuality * avgBlockConfidence)

        results.push({
          sourceText,
          targetText,
          confidence,
        })
      }
    }
  }

  // Only return results if we matched a reasonable number
  if (results.length < Math.min(leftColumn.length, rightColumn.length) * 0.5) {
    return []
  }

  return results
}

/**
 * Detect the most likely format used in the text
 */
export function detectFormat(text: string): 'pipe' | 'tab' | 'parenthetical' | 'dash' | 'colon' | 'unknown' {
  const lines = text.split(/\n|\r\n/).filter(l => l.trim())

  if (lines.length === 0) return 'unknown'

  const formatCounts = {
    pipe: 0,
    tab: 0,
    parenthetical: 0,
    dash: 0,
    colon: 0,
  }

  for (const line of lines) {
    if (line.includes('|')) formatCounts.pipe++
    if (line.includes('\t')) formatCounts.tab++
    if (line.match(/\(.*\)/)) formatCounts.parenthetical++
    if (line.match(/\s+-\s+/)) formatCounts.dash++
    if (line.match(/\s*:\s*/)) formatCounts.colon++
  }

  const maxFormat = Object.entries(formatCounts)
    .sort((a, b) => b[1] - a[1])[0]

  if (maxFormat[1] === 0) return 'unknown'

  return maxFormat[0] as 'pipe' | 'tab' | 'parenthetical' | 'dash' | 'colon'
}

/**
 * Suggest corrections for commonly misread OCR characters
 */
export function suggestCorrections(text: string): string[] {
  const suggestions: string[] = []

  // Common OCR mistakes
  const corrections: Record<string, string[]> = {
    '0': ['O', 'o'],
    'O': ['0'],
    'l': ['1', 'I'],
    '1': ['l', 'I'],
    'I': ['l', '1'],
    'rn': ['m'],
    'nn': ['m'],
  }

  for (const [mistake, fixes] of Object.entries(corrections)) {
    if (text.includes(mistake)) {
      for (const fix of fixes) {
        suggestions.push(text.replace(mistake, fix))
      }
    }
  }

  return suggestions
}
