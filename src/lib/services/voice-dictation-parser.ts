/**
 * Voice Dictation Parser
 *
 * Client-side heuristic splitting and Gemini-powered refinement
 * for extracting vocabulary pairs from continuous voice dictation.
 */

import type { Language } from '@/lib/db/schema'
import type { VocabularyCandidate } from '@/lib/ocr/types'

export type DictationOrder = 'foreignFirst' | 'germanFirst'

export interface RawVocabularyPair {
  foreignWord: string
  germanWord: string
  confidence: number
}

// Common German filler words to strip in client-side mode
const FILLER_PATTERNS = /\b(ähm|äh|uhm|uh|also|und\s+dann|halt|sozusagen|quasi|irgendwie|na\s+ja|naja|okay|ok|so|ja|nee|ne|hm|hmm)\b/gi

/**
 * Client-side heuristic splitting of transcript segments into vocabulary pairs.
 * Uses commas and segment boundaries as separators.
 */
export function splitTranscriptIntoPairs(
  segments: string[],
  order: DictationOrder = 'foreignFirst'
): RawVocabularyPair[] {
  // Split each segment on commas, then flatten
  const words: string[] = []
  for (const segment of segments) {
    const parts = segment
      .split(/[,;]/)
      .map((p) => p.replace(FILLER_PATTERNS, '').trim())
      .filter((p) => p.length > 0)
    words.push(...parts)
  }

  // Pair up alternating words
  const pairs: RawVocabularyPair[] = []
  for (let i = 0; i + 1 < words.length; i += 2) {
    const first = words[i]
    const second = words[i + 1]
    if (first && second) {
      pairs.push({
        foreignWord: order === 'foreignFirst' ? first : second,
        germanWord: order === 'foreignFirst' ? second : first,
        confidence: 0.5, // Low confidence for heuristic parsing
      })
    }
  }

  return pairs
}

/**
 * Convert raw pairs to VocabularyCandidate format (matches OCR types).
 */
export function pairsToVocabularyCandidates(
  pairs: RawVocabularyPair[]
): VocabularyCandidate[] {
  return pairs.map((pair) => ({
    sourceText: pair.germanWord,
    targetText: pair.foreignWord,
    confidence: pair.confidence,
  }))
}

const LANGUAGE_NAMES: Record<Language, string> = {
  french: 'Französisch',
  spanish: 'Spanisch',
  latin: 'Latein',
}

/**
 * Refine a raw voice transcript using Gemini LLM.
 * Corrects foreign word spellings, removes filler words, and structures pairs.
 */
export async function refineTranscriptWithGemini(
  rawTranscript: string,
  foreignLanguage: Language,
  order: DictationOrder = 'foreignFirst'
): Promise<VocabularyCandidate[]> {
  const langName = LANGUAGE_NAMES[foreignLanguage] || foreignLanguage

  const orderDesc =
    order === 'foreignFirst'
      ? `${langName}-Wort zuerst, dann die deutsche Übersetzung`
      : `deutsches Wort zuerst, dann die ${langName}-Übersetzung`

  const prompt = `Du verarbeitest eine sprachdiktierte Vokabelliste eines deutschen Schülers (ca. 12 Jahre), der ${langName} lernt.

Der Schüler hat Vokabelpaare in diesem Muster gesprochen: ${orderDesc}, getrennt durch Kommas oder kurze Pausen.

Die Spracherkennung lief auf Deutsch (de-DE), daher können die ${langName}-Wörter phonetisch auf Deutsch geschrieben sein.

ROHES TRANSKRIPT:
"${rawTranscript}"

AUFGABE:
1. Teile das Transkript in Vokabelpaare (${langName}-Wort + deutsche Übersetzung)
2. KORRIGIERE die ${langName}-Wörter von ihrer phonetischen deutschen Schreibweise zur korrekten ${langName}-Schreibweise (z.B. "mäsong" → "maison", "schá" → "chat")
3. Entferne Füllwörter (ähm, also, und dann, halt, etc.)
4. Entferne Meta-Sprache ("das nächste Wort ist", "Komma", "Punkt", etc.)
5. Gib für jedes Paar einen Konfidenz-Wert (0-1) an

WICHTIG:
- Der Sprecher ist ca. 12 Jahre alt und kann Wörter falsch aussprechen
- Manche Paare können unvollständig sein (nur ein Wort gesprochen)
- Unvollständige Paare trotzdem aufnehmen mit leerem Feld

Antworte NUR mit diesem JSON (keine Erklärung davor oder danach):
{"pairs":[{"foreignWord":"...","germanWord":"...","confidence":0.9}]}`

  const response = await fetch('/api/google/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-2.0-flash',
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(data.error.message || 'Gemini error')
  }

  // Extract text from Gemini response
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // Parse JSON from response (may be wrapped in markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse Gemini response as JSON')
  }

  const parsed = JSON.parse(jsonMatch[0])
  const pairs: Array<{ foreignWord: string; germanWord: string; confidence: number }> =
    parsed.pairs || []

  return pairs
    .filter((p) => p.foreignWord || p.germanWord)
    .map((p) => ({
      sourceText: (p.germanWord || '').trim(),
      targetText: (p.foreignWord || '').trim(),
      confidence: p.confidence ?? 0.7,
    }))
}
