/**
 * Answer Extractor for Voice Practice
 *
 * Extracts the actual answer from natural speech transcripts,
 * handling filler words, "I don't know" phrases, and voice commands.
 */

import type { Language } from '@/lib/db/schema'

// Common filler words by language that kids might say while thinking
const FILLER_WORDS: Record<string, string[]> = {
  de: [
    'ähm',
    'äh',
    'um',
    'hmm',
    'also',
    'ich glaube',
    'ich denke',
    'vielleicht',
    'das ist',
    'es ist',
    'moment',
    'warte',
    'lass mich überlegen',
    'ich weiß',
    'das wäre',
  ],
  fr: [
    'euh',
    'um',
    'hmm',
    'je pense',
    'je crois',
    'peut-être',
    "c'est",
    'alors',
    'attends',
    'voyons',
  ],
  es: [
    'eh',
    'um',
    'hmm',
    'creo que',
    'pienso que',
    'tal vez',
    'quizás',
    'es',
    'a ver',
    'espera',
  ],
  en: [
    'um',
    'uh',
    'hmm',
    'I think',
    'I believe',
    'maybe',
    "it's",
    "that's",
    'let me think',
    'wait',
    'like',
  ],
  la: ['um', 'hmm'], // Latin has minimal filler words in modern speech
}

// Phrases indicating the user doesn't know the answer
const DONT_KNOW_PHRASES: Record<string, string[]> = {
  de: [
    'weiß nicht',
    'weiß ich nicht',
    'keine ahnung',
    'pass',
    'ich weiß es nicht',
    'ich kann mich nicht erinnern',
    'hab ich vergessen',
    'fällt mir nicht ein',
  ],
  fr: [
    'je ne sais pas',
    'sais pas',
    'aucune idée',
    'passe',
    'je sais pas',
    "j'ai oublié",
  ],
  es: [
    'no sé',
    'no lo sé',
    'ni idea',
    'paso',
    'no me acuerdo',
    'lo olvidé',
  ],
  en: [
    "don't know",
    "i don't know",
    'no idea',
    'pass',
    'skip',
    "can't remember",
    'forgot',
    'no clue',
  ],
  la: ['nescio', 'ignoro'],
}

// Voice commands for controlling the session
const VOICE_COMMANDS: Record<string, { command: VoiceCommand; patterns: string[] }[]> = {
  de: [
    { command: 'repeat', patterns: ['nochmal', 'wiederholen', 'noch einmal', 'bitte nochmal'] },
    { command: 'skip', patterns: ['weiter', 'überspringen', 'nächstes', 'skip'] },
    { command: 'stop', patterns: ['stop', 'aufhören', 'beenden', 'schluss', 'fertig'] },
    { command: 'hint', patterns: ['hinweis', 'hilfe', 'tipp'] },
  ],
  fr: [
    { command: 'repeat', patterns: ['répète', 'encore', 'répéter', 'encore une fois'] },
    { command: 'skip', patterns: ['passe', 'suivant', 'sauter', 'prochain'] },
    { command: 'stop', patterns: ['stop', 'arrête', 'fini', 'terminer'] },
    { command: 'hint', patterns: ['indice', 'aide', 'hint'] },
  ],
  es: [
    { command: 'repeat', patterns: ['repite', 'otra vez', 'repetir', 'de nuevo'] },
    { command: 'skip', patterns: ['salta', 'siguiente', 'pasar', 'próximo'] },
    { command: 'stop', patterns: ['para', 'stop', 'terminar', 'acabar'] },
    { command: 'hint', patterns: ['pista', 'ayuda', 'hint'] },
  ],
  en: [
    { command: 'repeat', patterns: ['repeat', 'again', 'say again', 'one more time'] },
    { command: 'skip', patterns: ['skip', 'next', 'pass', 'move on'] },
    { command: 'stop', patterns: ['stop', 'quit', 'end', 'finish', "that's enough"] },
    { command: 'hint', patterns: ['hint', 'help', 'clue'] },
  ],
  la: [
    { command: 'repeat', patterns: ['repete', 'iterum'] },
    { command: 'skip', patterns: ['transeo', 'proximus'] },
    { command: 'stop', patterns: ['siste', 'finis'] },
    { command: 'hint', patterns: ['auxilium'] },
  ],
}

export type VoiceCommand = 'repeat' | 'skip' | 'stop' | 'hint'

export type ExtractionResultType = 'answer' | 'command' | 'dont_know' | 'unclear' | 'empty'

export interface ExtractionResult {
  type: ExtractionResultType
  value: string
  command?: VoiceCommand
  confidence: number
  originalTranscript: string
}

/**
 * Get the language code for filler/command lookups
 */
function getLanguageKey(language: Language | 'german'): string {
  if (language === 'german') return 'de'
  if (language === 'french') return 'fr'
  if (language === 'spanish') return 'es'
  if (language === 'latin') return 'la'
  return 'en'
}

/**
 * Remove filler words from a transcript
 */
function removeFillerWords(text: string, language: Language | 'german'): string {
  const langKey = getLanguageKey(language)
  const fillers = [...(FILLER_WORDS[langKey] || []), ...(FILLER_WORDS['en'] || [])]

  let cleaned = text.toLowerCase()

  // Sort fillers by length (longest first) to avoid partial matches
  const sortedFillers = fillers.sort((a, b) => b.length - a.length)

  for (const filler of sortedFillers) {
    // Use word boundaries where possible
    const escapedFiller = filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escapedFiller}\\b`, 'gi')
    cleaned = cleaned.replace(regex, ' ')
  }

  // Clean up extra whitespace
  return cleaned.replace(/\s+/g, ' ').trim()
}

/**
 * Check if the transcript contains a "don't know" phrase
 */
function checkDontKnow(text: string, language: Language | 'german'): boolean {
  const langKey = getLanguageKey(language)
  const phrases = [...(DONT_KNOW_PHRASES[langKey] || []), ...(DONT_KNOW_PHRASES['en'] || [])]

  const normalized = text.toLowerCase()

  for (const phrase of phrases) {
    if (normalized.includes(phrase)) {
      return true
    }
  }

  return false
}

/**
 * Check if the transcript contains a voice command
 */
function checkVoiceCommand(
  text: string,
  language: Language | 'german'
): VoiceCommand | null {
  const langKey = getLanguageKey(language)
  const commands = [...(VOICE_COMMANDS[langKey] || []), ...(VOICE_COMMANDS['en'] || [])]

  const normalized = text.toLowerCase()

  for (const { command, patterns } of commands) {
    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return command
      }
    }
  }

  return null
}

/**
 * Find the best matching substring in the transcript that matches the expected answer
 * Uses a sliding window approach to find the most likely answer portion
 */
function findBestMatchingSubstring(
  transcript: string,
  expectedAnswer: string
): { match: string; confidence: number } {
  const transcriptWords = transcript.split(/\s+/)
  const expectedWords = expectedAnswer.toLowerCase().split(/\s+/)
  const windowSize = expectedWords.length

  if (transcriptWords.length === 0) {
    return { match: '', confidence: 0 }
  }

  // If transcript is shorter or equal to expected, use the whole thing
  if (transcriptWords.length <= windowSize) {
    return { match: transcript, confidence: 0.8 }
  }

  let bestMatch = ''
  let bestScore = 0

  // Slide window through transcript
  for (let i = 0; i <= transcriptWords.length - windowSize; i++) {
    const candidate = transcriptWords.slice(i, i + windowSize).join(' ')
    const score = calculateSimilarity(candidate.toLowerCase(), expectedAnswer.toLowerCase())

    if (score > bestScore) {
      bestScore = score
      bestMatch = candidate
    }
  }

  // Also try with window size +/- 1 to handle article differences
  for (const offset of [-1, 1]) {
    const adjustedSize = windowSize + offset
    if (adjustedSize <= 0 || adjustedSize > transcriptWords.length) continue

    for (let i = 0; i <= transcriptWords.length - adjustedSize; i++) {
      const candidate = transcriptWords.slice(i, i + adjustedSize).join(' ')
      const score = calculateSimilarity(candidate.toLowerCase(), expectedAnswer.toLowerCase())

      if (score > bestScore) {
        bestScore = score
        bestMatch = candidate
      }
    }
  }

  return { match: bestMatch || transcript, confidence: bestScore }
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1

  const maxLength = Math.max(a.length, b.length)
  if (maxLength === 0) return 1

  const distance = levenshteinDistance(a, b)
  return 1 - distance / maxLength
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
 * Main function to extract an answer from a voice transcript
 *
 * @param transcript - Raw transcript from speech recognition
 * @param expectedAnswer - The correct answer we're looking for
 * @param targetLanguage - The language of the expected answer
 * @param sourceLanguage - The language of the question (for command detection)
 */
export function extractAnswer(
  transcript: string,
  expectedAnswer: string,
  targetLanguage: Language | 'german',
  sourceLanguage: Language | 'german' = 'german'
): ExtractionResult {
  const originalTranscript = transcript
  const normalized = transcript.toLowerCase().trim()

  // Check for empty transcript
  if (!normalized) {
    return {
      type: 'empty',
      value: '',
      confidence: 0,
      originalTranscript,
    }
  }

  // Check for voice commands first (in both languages)
  const command = checkVoiceCommand(normalized, sourceLanguage) ||
                  checkVoiceCommand(normalized, targetLanguage)
  if (command) {
    return {
      type: 'command',
      value: '',
      command,
      confidence: 1,
      originalTranscript,
    }
  }

  // Check for "don't know" phrases (in both languages)
  if (checkDontKnow(normalized, sourceLanguage) || checkDontKnow(normalized, targetLanguage)) {
    return {
      type: 'dont_know',
      value: '',
      confidence: 1,
      originalTranscript,
    }
  }

  // Remove filler words
  const cleaned = removeFillerWords(normalized, targetLanguage)

  if (!cleaned) {
    return {
      type: 'unclear',
      value: '',
      confidence: 0,
      originalTranscript,
    }
  }

  // If the cleaned transcript is short (1-3 words), use it directly
  const wordCount = cleaned.split(/\s+/).length
  if (wordCount <= 3) {
    return {
      type: 'answer',
      value: cleaned,
      confidence: 0.9,
      originalTranscript,
    }
  }

  // For longer transcripts, find the best matching substring
  const { match, confidence } = findBestMatchingSubstring(cleaned, expectedAnswer)

  if (confidence > 0.6) {
    return {
      type: 'answer',
      value: match,
      confidence,
      originalTranscript,
    }
  }

  // Fallback: return the cleaned transcript
  return {
    type: 'answer',
    value: cleaned,
    confidence: 0.5,
    originalTranscript,
  }
}

/**
 * Check if a transcript likely contains the answer (for quick validation)
 */
export function likelyContainsAnswer(
  transcript: string,
  expectedAnswer: string
): boolean {
  const normalized = transcript.toLowerCase()
  const expected = expectedAnswer.toLowerCase()

  // Direct inclusion check
  if (normalized.includes(expected)) {
    return true
  }

  // Check if most words from the expected answer are present
  const expectedWords = expected.split(/\s+/)
  const matchingWords = expectedWords.filter((word) => normalized.includes(word))

  return matchingWords.length >= expectedWords.length * 0.7
}
