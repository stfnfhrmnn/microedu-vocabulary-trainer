/**
 * Parse vocabulary from OCR-extracted text
 * Supports multiple common formats for vocabulary lists
 */

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
 */
export function parseLine(line: string): ParsedVocabulary | null {
  const trimmed = line.trim()

  if (!trimmed || trimmed.length < 3) {
    return null
  }

  // Skip lines that look like headers or section markers
  if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.match(/^[\d]+[.)]/)) {
    return null
  }

  let sourceText = ''
  let targetText = ''
  let confidence = 0.8 // Default confidence for parsed text

  // Try pipe separator (|)
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      sourceText = parts[0]
      targetText = parts[1]
      confidence = 0.95
    }
  }
  // Try tab separator
  else if (trimmed.includes('\t')) {
    const parts = trimmed.split('\t').map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      sourceText = parts[0]
      targetText = parts[1]
      confidence = 0.95
    }
  }
  // Try parenthetical format: "word (translation)"
  else if (trimmed.match(/^(.+?)\s*\((.+?)\)\s*$/)) {
    const match = trimmed.match(/^(.+?)\s*\((.+?)\)\s*$/)
    if (match && match[1] && match[2]) {
      sourceText = match[1].trim()
      targetText = match[2].trim()
      confidence = 0.9
    }
  }
  // Try dash separator (but be careful with hyphenated words)
  else if (trimmed.match(/\s+-\s+/)) {
    const parts = trimmed.split(/\s+-\s+/).map(p => p.trim())
    if (parts.length >= 2 && parts[0] && parts[1]) {
      sourceText = parts[0]
      targetText = parts[1]
      confidence = 0.85
    }
  }
  // Try colon separator
  else if (trimmed.match(/\s*:\s*/)) {
    const parts = trimmed.split(/\s*:\s*/).map(p => p.trim())
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
 */
export function parseVocabularyFromText(text: string): ParsedVocabulary[] {
  const lines = text.split(/\n|\r\n/)
  const results: ParsedVocabulary[] = []

  for (const line of lines) {
    const parsed = parseLine(line)
    if (parsed) {
      results.push(parsed)
    }
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
