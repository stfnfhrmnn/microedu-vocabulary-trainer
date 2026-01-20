/**
 * Fuzzy matching for typed answers
 * Uses Levenshtein distance to allow for small typos
 */

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[a.length][b.length]
}

/**
 * Normalize text for comparison
 * - Lowercase
 * - Trim whitespace
 * - Remove extra spaces
 * - Optionally remove diacritics
 */
export function normalizeText(text: string, removeDiacritics = false): string {
  let normalized = text.toLowerCase().trim().replace(/\s+/g, ' ')

  if (removeDiacritics) {
    normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  }

  return normalized
}

export type StrictnessLevel = 'strict' | 'normal' | 'lenient'

/**
 * Get similarity threshold based on strictness level
 * Returns the minimum similarity (0-1) required for a match
 */
function getSimilarityThreshold(strictness: StrictnessLevel): number {
  switch (strictness) {
    case 'strict':
      return 1.0 // Must be exact
    case 'normal':
      return 0.85 // Allow ~15% errors
    case 'lenient':
      return 0.7 // Allow ~30% errors
  }
}

export interface MatchResult {
  isCorrect: boolean
  similarity: number
  distance: number
  normalizedExpected: string
  normalizedActual: string
}

/**
 * Check if an answer is correct with fuzzy matching
 */
export function checkAnswer(
  expected: string,
  actual: string,
  strictness: StrictnessLevel = 'normal'
): MatchResult {
  // For strict mode, also consider diacritics
  const removeDiacritics = strictness !== 'strict'

  const normalizedExpected = normalizeText(expected, removeDiacritics)
  const normalizedActual = normalizeText(actual, removeDiacritics)

  // Exact match
  if (normalizedExpected === normalizedActual) {
    return {
      isCorrect: true,
      similarity: 1,
      distance: 0,
      normalizedExpected,
      normalizedActual,
    }
  }

  // Calculate distance and similarity
  const distance = levenshteinDistance(normalizedExpected, normalizedActual)
  const maxLength = Math.max(normalizedExpected.length, normalizedActual.length)
  const similarity = maxLength > 0 ? 1 - distance / maxLength : 1

  const threshold = getSimilarityThreshold(strictness)
  const isCorrect = similarity >= threshold

  return {
    isCorrect,
    similarity,
    distance,
    normalizedExpected,
    normalizedActual,
  }
}

/**
 * Highlight differences between expected and actual answer
 * Returns HTML string with <mark> tags for differences
 */
export function highlightDifferences(expected: string, actual: string): string {
  const normalizedExpected = normalizeText(expected, true)
  const normalizedActual = normalizeText(actual, true)

  if (normalizedExpected === normalizedActual) {
    return expected
  }

  // Simple character-by-character comparison
  let result = ''
  const maxLength = Math.max(expected.length, actual.length)

  for (let i = 0; i < expected.length; i++) {
    if (i < actual.length && expected[i].toLowerCase() === actual[i].toLowerCase()) {
      result += expected[i]
    } else {
      result += `<mark class="bg-error-200 px-0.5 rounded">${expected[i]}</mark>`
    }
  }

  return result
}

/**
 * Check if answer might be correct but just has wrong accents
 */
export function hasAccentMismatchOnly(expected: string, actual: string): boolean {
  const withoutAccentsExpected = normalizeText(expected, true)
  const withoutAccentsActual = normalizeText(actual, true)
  const withAccentsExpected = normalizeText(expected, false)
  const withAccentsActual = normalizeText(actual, false)

  return (
    withoutAccentsExpected === withoutAccentsActual &&
    withAccentsExpected !== withAccentsActual
  )
}
