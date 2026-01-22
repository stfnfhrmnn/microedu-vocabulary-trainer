/**
 * Accent Helper Utilities
 *
 * Provides accent character support for language learning.
 * Includes shortcuts and special character palettes.
 */

import type { Language } from '@/lib/db/schema'

// Common accented characters by language
export const ACCENT_CHARACTERS: Record<Language | 'german', string[]> = {
  german: ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'],
  french: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ù', 'û', 'ô', 'î', 'ï', 'ç', 'œ', 'æ'],
  spanish: ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'],
  latin: ['ā', 'ē', 'ī', 'ō', 'ū', 'æ', 'œ'],
}

// Frequently used accents (subset for quick access)
export const QUICK_ACCENTS: Record<Language | 'german', string[]> = {
  german: ['ä', 'ö', 'ü', 'ß'],
  french: ['é', 'è', 'ê', 'à', 'ç', 'ô', 'î'],
  spanish: ['á', 'é', 'í', 'ó', 'ú', 'ñ'],
  latin: ['ā', 'ē', 'ī', 'ō', 'ū'],
}

// Keyboard shortcuts: base character + modifier = accented
// This maps common patterns for quick typing
export const ACCENT_SHORTCUTS: Record<string, Record<string, string>> = {
  // e + accent modifier
  e: { "'": 'é', '`': 'è', '^': 'ê', ':': 'ë' },
  E: { "'": 'É', '`': 'È', '^': 'Ê', ':': 'Ë' },

  // a + accent modifier
  a: { "'": 'á', '`': 'à', '^': 'â', ':': 'ä' },
  A: { "'": 'Á', '`': 'À', '^': 'Â', ':': 'Ä' },

  // i + accent modifier
  i: { "'": 'í', '^': 'î', ':': 'ï' },
  I: { "'": 'Í', '^': 'Î', ':': 'Ï' },

  // o + accent modifier
  o: { "'": 'ó', '^': 'ô', ':': 'ö' },
  O: { "'": 'Ó', '^': 'Ô', ':': 'Ö' },

  // u + accent modifier
  u: { "'": 'ú', '^': 'û', ':': 'ü' },
  U: { "'": 'Ú', '^': 'Û', ':': 'Ü' },

  // Special characters
  n: { '~': 'ñ' },
  N: { '~': 'Ñ' },
  c: { ',': 'ç' },
  C: { ',': 'Ç' },
  s: { s: 'ß' }, // ss -> ß
}

// Long-form accent sequences (typing "'e" produces "é")
export const LONG_FORM_SEQUENCES: Record<string, string> = {
  // Acute accents (')
  "'a": 'á', "'e": 'é', "'i": 'í', "'o": 'ó', "'u": 'ú',
  "'A": 'Á', "'E": 'É', "'I": 'Í', "'O": 'Ó', "'U": 'Ú',

  // Grave accents (`)
  '`a': 'à', '`e': 'è', '`u': 'ù',
  '`A': 'À', '`E': 'È', '`U': 'Ù',

  // Circumflex (^)
  '^a': 'â', '^e': 'ê', '^i': 'î', '^o': 'ô', '^u': 'û',
  '^A': 'Â', '^E': 'Ê', '^I': 'Î', '^O': 'Ô', '^U': 'Û',

  // Umlaut/diaeresis (:)
  ':a': 'ä', ':e': 'ë', ':i': 'ï', ':o': 'ö', ':u': 'ü',
  ':A': 'Ä', ':E': 'Ë', ':I': 'Ï', ':O': 'Ö', ':U': 'Ü',

  // Tilde (~)
  '~n': 'ñ', '~N': 'Ñ',

  // Cedilla (,)
  ',c': 'ç', ',C': 'Ç',

  // German double-s
  'ss': 'ß',

  // Inverted punctuation
  '??': '¿', '!!': '¡',
}

/**
 * Check if a sequence can be converted to an accented character
 */
export function checkAccentSequence(text: string): { result: string; consumed: number } | null {
  // Check from longest sequence (2 chars) to shortest
  if (text.length >= 2) {
    const twoChar = text.slice(-2)
    if (LONG_FORM_SEQUENCES[twoChar]) {
      return {
        result: LONG_FORM_SEQUENCES[twoChar],
        consumed: 2,
      }
    }
  }

  return null
}

/**
 * Process text input and convert accent sequences
 */
export function processAccentInput(currentText: string, newChar: string): {
  text: string
  converted: boolean
} {
  const combined = currentText + newChar

  // Check if the last 2 characters form an accent sequence
  const sequence = checkAccentSequence(combined)

  if (sequence) {
    // Replace the sequence with the accented character
    const newText = combined.slice(0, -sequence.consumed) + sequence.result
    return { text: newText, converted: true }
  }

  return { text: combined, converted: false }
}

/**
 * Get accent characters for a specific language
 */
export function getAccentsForLanguage(language: Language | 'german'): string[] {
  return ACCENT_CHARACTERS[language] || []
}

/**
 * Get quick accent characters (most common) for a language
 */
export function getQuickAccentsForLanguage(language: Language | 'german'): string[] {
  return QUICK_ACCENTS[language] || []
}

/**
 * Normalize accented characters for comparison
 * Useful for lenient answer checking
 */
export function normalizeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Check if two strings are equal with different accent strictness levels
 */
export function compareWithAccentStrictness(
  input: string,
  correct: string,
  strictness: 'strict' | 'normal' | 'lenient'
): boolean {
  const inputLower = input.toLowerCase().trim()
  const correctLower = correct.toLowerCase().trim()

  switch (strictness) {
    case 'strict':
      // Exact match including accents
      return inputLower === correctLower

    case 'normal':
      // Allow minor variations but require accents
      return inputLower === correctLower ||
        inputLower.replace(/['']/g, "'") === correctLower.replace(/['']/g, "'")

    case 'lenient':
      // Ignore accents completely
      return normalizeAccents(inputLower) === normalizeAccents(correctLower)

    default:
      return inputLower === correctLower
  }
}
