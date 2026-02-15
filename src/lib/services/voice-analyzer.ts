/**
 * Voice Answer Analyzer using Gemini LLM
 *
 * Uses server-side proxy to Google's Gemini API to intelligently analyze voice transcripts:
 * - Extract intended answers from natural speech
 * - Detect voice commands and intents
 * - Evaluate answer correctness with semantic understanding
 * - Handle noisy transcripts and kid's speech patterns
 */

import type { Language } from '@/lib/db/schema'

export type VoiceIntent =
  | 'answer'           // User is giving an answer
  | 'dont_know'        // User doesn't know the answer
  | 'repeat'           // User wants the question repeated
  | 'skip'             // User wants to skip this question
  | 'stop'             // User wants to end the session
  | 'hint'             // User wants a hint
  | 'unclear'          // Couldn't determine intent

export interface AnalysisResult {
  intent: VoiceIntent
  extractedAnswer: string
  isCorrect: boolean
  confidence: number
  explanation?: string        // Why the LLM thinks it's correct/incorrect
  suggestedFeedback?: string  // Natural feedback to give the user
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
  error?: {
    message: string
  }
}

/**
 * Create the analysis prompt for Gemini
 */
function createAnalysisPrompt(
  transcript: string,
  expectedAnswer: string,
  questionWord: string,
  questionLanguage: Language | 'german',
  answerLanguage: Language | 'german'
): string {
  const questionLangName = questionLanguage === 'german' ? 'German' : questionLanguage
  const answerLangName = answerLanguage === 'german' ? 'German' : answerLanguage

  return `You are analyzing a voice response from a child learning vocabulary.

CONTEXT:
- Question word (${questionLangName}): "${questionWord}"
- Expected answer (${answerLangName}): "${expectedAnswer}"
- Child's spoken transcript: "${transcript}"

TASK:
Analyze the transcript and determine:
1. The child's INTENT (what are they trying to do?)
2. If they're giving an answer, EXTRACT the actual answer from the natural speech
3. If it's an answer, evaluate if it's CORRECT (consider typos, pronunciation variants, articles)

INTENT OPTIONS:
- "answer" - They are attempting to answer the question
- "dont_know" - They indicate they don't know (phrases like "I don't know", "keine Ahnung", "je ne sais pas", "pass")
- "repeat" - They want the question repeated ("again", "nochmal", "répète", "what?")
- "skip" - They want to skip ("skip", "next", "weiter", "passe")
- "stop" - They want to end ("stop", "quit", "aufhören", "arrête")
- "hint" - They want a hint ("hint", "help", "Hilfe", "indice")
- "unclear" - Cannot determine what they meant

ANSWER EVALUATION:
- Be LENIENT - kids make small mistakes
- Accept answers with/without articles ("chien" = "le chien")
- Accept minor pronunciation differences captured by speech recognition
- Accept common spelling variants
- Consider semantic equivalence (synonyms)

Respond in this exact JSON format:
{
  "intent": "answer|dont_know|repeat|skip|stop|hint|unclear",
  "extractedAnswer": "the answer they gave (or empty string if not an answer)",
  "isCorrect": true/false,
  "confidence": 0.0-1.0,
  "explanation": "brief explanation of your reasoning",
  "suggestedFeedback": "natural feedback phrase in German to tell the child"
}

Only respond with the JSON, no other text.`
}

/**
 * Analyze a voice transcript using Gemini via server-side proxy
 */
export async function analyzeVoiceResponse(
  transcript: string,
  expectedAnswer: string,
  questionWord: string,
  questionLanguage: Language | 'german',
  answerLanguage: Language | 'german'
): Promise<AnalysisResult> {
  const prompt = createAnalysisPrompt(
    transcript,
    expectedAnswer,
    questionWord,
    questionLanguage,
    answerLanguage
  )

  try {
    // Use server-side proxy instead of direct API call
    const response = await fetch('/api/google/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-1.5-flash',
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,  // Low temperature for consistent analysis
          maxOutputTokens: 500,
        },
      }),
    })

    if (!response.ok) {
      console.error('Gemini API error:', response.status)
      return fallbackAnalysis(transcript, expectedAnswer)
    }

    const data: GeminiResponse = await response.json()

    if (data.error) {
      console.error('Gemini error:', data.error.message)
      return fallbackAnalysis(transcript, expectedAnswer)
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return fallbackAnalysis(transcript, expectedAnswer)
    }

    // Parse JSON response
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        return fallbackAnalysis(transcript, expectedAnswer)
      }

      const result = JSON.parse(jsonMatch[0])
      return {
        intent: result.intent || 'unclear',
        extractedAnswer: result.extractedAnswer || '',
        isCorrect: result.isCorrect === true,
        confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
        explanation: result.explanation,
        suggestedFeedback: result.suggestedFeedback,
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError)
      return fallbackAnalysis(transcript, expectedAnswer)
    }
  } catch (error) {
    console.error('Voice analysis error:', error)
    return fallbackAnalysis(transcript, expectedAnswer)
  }
}

/**
 * Fallback analysis when Gemini is unavailable
 * Uses the existing rule-based extraction
 */
function fallbackAnalysis(
  transcript: string,
  expectedAnswer: string
): AnalysisResult {
  // Import the existing extractor dynamically to avoid circular dependencies
  const normalized = transcript.toLowerCase().trim()

  // Check for commands
  if (/repeat|again|nochmal|encore|répète/i.test(normalized)) {
    return { intent: 'repeat', extractedAnswer: '', isCorrect: false, confidence: 0.9 }
  }
  if (/skip|next|weiter|passe|suivant/i.test(normalized)) {
    return { intent: 'skip', extractedAnswer: '', isCorrect: false, confidence: 0.9 }
  }
  if (/stop|quit|end|aufhören|arrête|fertig/i.test(normalized)) {
    return { intent: 'stop', extractedAnswer: '', isCorrect: false, confidence: 0.9 }
  }
  if (/hint|help|hilfe|indice|aide/i.test(normalized)) {
    return { intent: 'hint', extractedAnswer: '', isCorrect: false, confidence: 0.9 }
  }
  if (/don't know|weiß nicht|keine ahnung|je ne sais pas|no sé|pass\b/i.test(normalized)) {
    return { intent: 'dont_know', extractedAnswer: '', isCorrect: false, confidence: 0.9 }
  }

  // It's likely an answer - do simple matching
  const expectedNorm = expectedAnswer.toLowerCase().trim()

  // Direct match
  if (normalized === expectedNorm || normalized.includes(expectedNorm)) {
    return {
      intent: 'answer',
      extractedAnswer: transcript,
      isCorrect: true,
      confidence: 0.9,
    }
  }

  // Check if expected is contained in transcript (for natural speech)
  // "I think it's le chien" contains "le chien"
  if (normalized.includes(expectedNorm)) {
    return {
      intent: 'answer',
      extractedAnswer: expectedAnswer,
      isCorrect: true,
      confidence: 0.85,
    }
  }

  // Simple Levenshtein similarity
  const similarity = calculateSimilarity(normalized, expectedNorm)
  const isCorrect = similarity >= 0.75

  return {
    intent: 'answer',
    extractedAnswer: transcript,
    isCorrect,
    confidence: similarity,
  }
}

/**
 * Calculate string similarity (0-1)
 */
function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(a, b)
  return 1 - distance / maxLen
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= a.length; i++) matrix[i] = [i]
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j
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
 * Voice Analyzer Service class
 */
export class VoiceAnalyzerService {
  private enabled: boolean = false
  private useAI: boolean = true

  setApiKey(apiKey: string | null) {
    // Legacy method - now just enables/disables the service
    this.enabled = !!apiKey
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  setUseAI(useAI: boolean) {
    this.useAI = useAI
  }

  isAvailable(): boolean {
    return this.enabled && this.useAI
  }

  async analyze(
    transcript: string,
    expectedAnswer: string,
    questionWord: string,
    questionLanguage: Language | 'german',
    answerLanguage: Language | 'german'
  ): Promise<AnalysisResult> {
    if (!this.enabled || !this.useAI) {
      return fallbackAnalysis(transcript, expectedAnswer)
    }

    return analyzeVoiceResponse(
      transcript,
      expectedAnswer,
      questionWord,
      questionLanguage,
      answerLanguage
    )
  }
}

// Singleton instance
let voiceAnalyzerService: VoiceAnalyzerService | null = null

export function getVoiceAnalyzerService(): VoiceAnalyzerService {
  if (!voiceAnalyzerService) {
    voiceAnalyzerService = new VoiceAnalyzerService()
  }
  return voiceAnalyzerService
}
