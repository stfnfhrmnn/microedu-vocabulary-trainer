/**
 * Phonetic Matching for Voice Practice
 *
 * Handles common speech-to-text errors where words sound similar
 * but are transcribed differently.
 */

import type { Language } from '@/lib/db/schema'

// Common phonetic substitutions made by speech recognition
// Maps what STT might transcribe → what the user likely said
const PHONETIC_SUBSTITUTIONS: Record<string, Array<[string, string]>> = {
  fr: [
    // French phonetic confusions
    ['sh', 'ch'],       // shien → chien
    ['zh', 'j'],        // zhour → jour
    ['uh', 'eu'],       // bluh → bleu
    ['oh', 'eau'],      // boh → beau
    ['ay', 'é'],        // parlé sounds like "parlay"
    ['eh', 'è'],        // père
    ['ahn', 'an'],      // blanc
    ['ohn', 'on'],      // bon
    ['uhn', 'un'],      // brun
    ['een', 'in'],      // vin
    ['wa', 'oi'],       // moi
    ['wee', 'oui'],     // yes
    ['ew', 'u'],        // tu
    ['air', 'ère'],     // mère
    ['or', 'eur'],      // fleur
  ],
  es: [
    // Spanish phonetic confusions
    ['ny', 'ñ'],        // año
    ['ll', 'y'],        // lluvia/yuvia
    ['b', 'v'],         // Often confused in Spanish
    ['rr', 'r'],        // perro
    ['th', 'z'],        // zapato (Castilian)
    ['th', 'c'],        // cena (Castilian)
    ['h', ''],          // Silent h: hola
  ],
  de: [
    // German phonetic confusions
    ['sh', 'sch'],      // schön
    ['ts', 'z'],        // Zeit
    ['oy', 'eu'],       // freund
    ['eye', 'ei'],      // mein
    ['ow', 'au'],       // Haus
    ['uh', 'ü'],        // für
    ['oh', 'ö'],        // schön
    ['ah', 'ä'],        // Mädchen
    ['ss', 'ß'],        // Straße
    ['k', 'ch'],        // ich (after i/e)
  ],
  la: [
    // Latin phonetic confusions
    ['ae', 'e'],        // Caesar
    ['v', 'w'],         // Classical vs ecclesiastical
    ['c', 'k'],         // Always hard in classical
  ],
}

// Common words that are frequently misheard
const COMMON_MISHEARD_WORDS: Record<string, Record<string, string[]>> = {
  fr: {
    'le chien': ['le shien', 'la shien', 'luh shien'],
    'la maison': ['la mayson', 'la meson'],
    'je suis': ['zhuh swee', 'je swee'],
    'bonjour': ['bon zhour', 'bonzhoor'],
    'merci': ['mersee', 'mercy'],
    'oui': ['wee', 'we'],
    'non': ['no', 'noh'],
    "l'eau": ['lo', 'loh'],
    'beau': ['bo', 'boh'],
    'bleu': ['bluh', 'bloo'],
  },
  es: {
    'hola': ['ola', 'oh la'],
    'gracias': ['grathias', 'grasias'],
    'por favor': ['por fabor'],
    'bueno': ['bweno'],
    'niño': ['ninyo', 'neenyo'],
    'año': ['anyo'],
  },
  de: {
    'ich': ['ish', 'ikh'],
    'nicht': ['nisht', 'nikht'],
    'schön': ['shön', 'shern'],
    'Mädchen': ['medchen', 'maedchen'],
    'Straße': ['strasse', 'shtrasse'],
  },
}

/**
 * Normalize text with phonetic substitutions
 */
export function phoneticNormalize(text: string, language: Language | 'german'): string {
  const langKey = language === 'german' ? 'de' : language
  const substitutions = PHONETIC_SUBSTITUTIONS[langKey] || []

  let normalized = text.toLowerCase()

  // Apply phonetic substitutions
  for (const [from, to] of substitutions) {
    normalized = normalized.replace(new RegExp(from, 'g'), to)
  }

  return normalized
}

/**
 * Check if two strings match phonetically
 */
export function phoneticMatch(
  actual: string,
  expected: string,
  language: Language | 'german'
): { isMatch: boolean; confidence: number } {
  const actualNorm = phoneticNormalize(actual.toLowerCase(), language)
  const expectedNorm = phoneticNormalize(expected.toLowerCase(), language)

  // Direct match after normalization
  if (actualNorm === expectedNorm) {
    return { isMatch: true, confidence: 1 }
  }

  // Check common misheard words
  const langKey = language === 'german' ? 'de' : language
  const misheardWords = COMMON_MISHEARD_WORDS[langKey] || {}

  // Check if actual matches any known misheard variant
  for (const [correct, variants] of Object.entries(misheardWords)) {
    if (expected.toLowerCase() === correct) {
      for (const variant of variants) {
        if (actual.toLowerCase() === variant || actualNorm.includes(variant)) {
          return { isMatch: true, confidence: 0.9 }
        }
      }
    }
  }

  // Calculate similarity with phonetic normalization
  const similarity = calculatePhoneticSimilarity(actualNorm, expectedNorm)

  return {
    isMatch: similarity >= 0.8,
    confidence: similarity,
  }
}

/**
 * Calculate phonetic similarity between two normalized strings
 */
function calculatePhoneticSimilarity(a: string, b: string): number {
  if (a === b) return 1

  // Remove spaces for comparison (articles might be joined/split differently)
  const aNoSpace = a.replace(/\s+/g, '')
  const bNoSpace = b.replace(/\s+/g, '')

  if (aNoSpace === bNoSpace) return 0.95

  // Calculate Levenshtein-based similarity
  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 1

  const distance = levenshteinDistance(a, b)
  const similarity = 1 - distance / maxLength

  // Also check without spaces
  const distanceNoSpace = levenshteinDistance(aNoSpace, bNoSpace)
  const similarityNoSpace = 1 - distanceNoSpace / Math.max(aNoSpace.length, bNoSpace.length)

  // Return the better of the two
  return Math.max(similarity, similarityNoSpace)
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }

  return matrix[a.length][b.length]
}

/**
 * Combined matching: fuzzy + phonetic
 * Returns the best match result from multiple strategies
 */
export function combinedMatch(
  actual: string,
  expected: string,
  language: Language | 'german'
): {
  isMatch: boolean
  confidence: number
  matchType: 'exact' | 'fuzzy' | 'phonetic' | 'partial' | 'none'
} {
  const actualLower = actual.toLowerCase().trim()
  const expectedLower = expected.toLowerCase().trim()

  // 1. Exact match
  if (actualLower === expectedLower) {
    return { isMatch: true, confidence: 1, matchType: 'exact' }
  }

  // 2. Fuzzy match (Levenshtein)
  const maxLength = Math.max(actualLower.length, expectedLower.length)
  const distance = levenshteinDistance(actualLower, expectedLower)
  const fuzzySimilarity = maxLength > 0 ? 1 - distance / maxLength : 1

  if (fuzzySimilarity >= 0.85) {
    return { isMatch: true, confidence: fuzzySimilarity, matchType: 'fuzzy' }
  }

  // 3. Phonetic match
  const { isMatch: phoneticIsMatch, confidence: phoneticConfidence } = phoneticMatch(
    actual,
    expected,
    language
  )

  if (phoneticIsMatch) {
    return { isMatch: true, confidence: phoneticConfidence, matchType: 'phonetic' }
  }

  // 4. Partial match (actual contains expected or vice versa)
  if (actualLower.includes(expectedLower) || expectedLower.includes(actualLower)) {
    const ratio =
      Math.min(actualLower.length, expectedLower.length) /
      Math.max(actualLower.length, expectedLower.length)
    if (ratio >= 0.5) {
      return { isMatch: true, confidence: ratio * 0.9, matchType: 'partial' }
    }
  }

  // 5. Check if core word matches (ignoring articles)
  const actualWords = actualLower.split(/\s+/)
  const expectedWords = expectedLower.split(/\s+/)
  const articles = ['le', 'la', 'les', 'un', 'une', 'des', 'el', 'la', 'los', 'las', 'der', 'die', 'das', 'ein', 'eine']

  const actualCore = actualWords.filter(w => !articles.includes(w)).join(' ')
  const expectedCore = expectedWords.filter(w => !articles.includes(w)).join(' ')

  if (actualCore && expectedCore) {
    const coreDistance = levenshteinDistance(actualCore, expectedCore)
    const coreMaxLength = Math.max(actualCore.length, expectedCore.length)
    const coreSimilarity = coreMaxLength > 0 ? 1 - coreDistance / coreMaxLength : 1

    if (coreSimilarity >= 0.8) {
      return { isMatch: true, confidence: coreSimilarity * 0.85, matchType: 'partial' }
    }
  }

  // No match
  return {
    isMatch: false,
    confidence: Math.max(fuzzySimilarity, phoneticConfidence),
    matchType: 'none',
  }
}
