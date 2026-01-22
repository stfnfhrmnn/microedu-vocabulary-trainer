import { db } from '@/lib/db/db'
import type { VocabularyItem } from '@/lib/db/schema'

export interface DuplicateResult {
  isDuplicate: boolean
  duplicateOf?: VocabularyItem  // The existing vocab item it matches
  similarity: number            // 0-1, 1 = exact match
}

export interface CandidateWithDuplicate {
  sourceText: string
  targetText: string
  confidence: number
  notes?: string
  duplicate?: DuplicateResult
}

/**
 * Normalize text for comparison:
 * - Lowercase
 * - Trim whitespace
 * - Remove common articles (der, die, das, le, la, les, etc.)
 * - Normalize special characters
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase().trim()

  // Remove German articles
  normalized = normalized.replace(/^(der|die|das|ein|eine|einen|einem|einer)\s+/i, '')

  // Remove French articles
  normalized = normalized.replace(/^(le|la|les|l'|un|une|des)\s*/i, '')

  // Remove Spanish articles
  normalized = normalized.replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '')

  // Remove Latin articles (rarely used but just in case)
  // Latin doesn't have articles, but we can handle common patterns

  // Normalize common OCR artifacts and punctuation
  normalized = normalized.replace(/[.,;:!?'"()[\]{}]/g, '')

  // Collapse multiple spaces
  normalized = normalized.replace(/\s+/g, ' ')

  return normalized.trim()
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 and 1, where 1 is an exact match
 */
function calculateSimilarity(a: string, b: string): number {
  const normalizedA = normalizeText(a)
  const normalizedB = normalizeText(b)

  if (normalizedA === normalizedB) return 1

  const maxLen = Math.max(normalizedA.length, normalizedB.length)
  if (maxLen === 0) return 1

  const distance = levenshteinDistance(normalizedA, normalizedB)
  return 1 - distance / maxLen
}

/**
 * Levenshtein distance algorithm
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Check if a single vocabulary candidate is a duplicate
 * @param sourceText The German text
 * @param targetText The foreign language text
 * @param bookId The book to check against
 * @param similarityThreshold Minimum similarity to flag as duplicate (default 0.9)
 */
export async function checkDuplicate(
  sourceText: string,
  targetText: string,
  bookId: string,
  similarityThreshold = 0.9
): Promise<DuplicateResult> {
  // Get all existing vocabulary for this book
  const existingVocab = await db.vocabularyItems
    .where('bookId')
    .equals(bookId)
    .toArray()

  for (const existing of existingVocab) {
    // Check both source and target text similarity
    const sourceSimilarity = calculateSimilarity(sourceText, existing.sourceText)
    const targetSimilarity = calculateSimilarity(targetText, existing.targetText)

    // Consider it a duplicate if both source and target are similar
    const combinedSimilarity = (sourceSimilarity + targetSimilarity) / 2

    if (combinedSimilarity >= similarityThreshold) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: combinedSimilarity,
      }
    }

    // Also check for exact source match (might be intentional same word with different translation)
    if (sourceSimilarity === 1) {
      return {
        isDuplicate: true,
        duplicateOf: existing,
        similarity: sourceSimilarity,
      }
    }
  }

  return {
    isDuplicate: false,
    similarity: 0,
  }
}

/**
 * Batch check duplicates for multiple candidates (more efficient)
 * @param candidates Array of vocabulary candidates to check
 * @param bookId The book to check against
 * @param similarityThreshold Minimum similarity to flag as duplicate (default 0.9)
 */
export async function checkDuplicates(
  candidates: Array<{ sourceText: string; targetText: string }>,
  bookId: string,
  similarityThreshold = 0.9
): Promise<Map<number, DuplicateResult>> {
  const results = new Map<number, DuplicateResult>()

  // Get all existing vocabulary for this book once
  const existingVocab = await db.vocabularyItems
    .where('bookId')
    .equals(bookId)
    .toArray()

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    let bestMatch: DuplicateResult = { isDuplicate: false, similarity: 0 }

    for (const existing of existingVocab) {
      const sourceSimilarity = calculateSimilarity(candidate.sourceText, existing.sourceText)
      const targetSimilarity = calculateSimilarity(candidate.targetText, existing.targetText)
      const combinedSimilarity = (sourceSimilarity + targetSimilarity) / 2

      if (combinedSimilarity >= similarityThreshold && combinedSimilarity > bestMatch.similarity) {
        bestMatch = {
          isDuplicate: true,
          duplicateOf: existing,
          similarity: combinedSimilarity,
        }
      }

      // Exact source match
      if (sourceSimilarity === 1 && !bestMatch.isDuplicate) {
        bestMatch = {
          isDuplicate: true,
          duplicateOf: existing,
          similarity: sourceSimilarity,
        }
      }
    }

    if (bestMatch.isDuplicate) {
      results.set(i, bestMatch)
    }
  }

  return results
}

/**
 * Annotate candidates with duplicate information
 * @param candidates Array of vocabulary candidates
 * @param bookId The book to check against
 */
export async function annotateCandidatesWithDuplicates(
  candidates: Array<{ sourceText: string; targetText: string; confidence: number; notes?: string }>,
  bookId: string
): Promise<CandidateWithDuplicate[]> {
  const duplicates = await checkDuplicates(candidates, bookId)

  return candidates.map((candidate, index) => ({
    ...candidate,
    duplicate: duplicates.get(index),
  }))
}
