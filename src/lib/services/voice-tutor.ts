/**
 * Voice Tutor Service
 *
 * Generates conversational scripts for voice practice sessions.
 * Handles both Calm mode (bedtime) and Challenge mode (energetic).
 */

import type { Language, PracticeDirection } from '@/lib/db/schema'

export type VoicePracticeMode = 'calm' | 'challenge'

interface ScriptOptions {
  mode: VoicePracticeMode
  totalItems: number
  direction: PracticeDirection
  targetLanguage: Language
  sectionNames?: string[]
}

interface QuestionOptions {
  mode: VoicePracticeMode
  questionNumber: number
  totalQuestions: number
  currentStreak: number
  direction: PracticeDirection
  targetLanguage: Language
}

interface FeedbackOptions {
  mode: VoicePracticeMode
  wasCorrect: boolean
  expectedAnswer: string
  userAnswer?: string
  currentStreak: number
  questionNumber: number
  totalQuestions: number
  isLastQuestion: boolean
}

interface SummaryOptions {
  mode: VoicePracticeMode
  correctCount: number
  totalCount: number
  maxStreak: number
}

// Language display names
const LANGUAGE_NAMES: Record<Language, string> = {
  french: 'Französisch',
  spanish: 'Spanisch',
  latin: 'Latein',
}

// Pause markers for natural speech (SSML-like, but for Web Speech API timing)
const SHORT_PAUSE = '... '
const MEDIUM_PAUSE = '...... '

/**
 * Generate the intro script for a voice practice session
 */
export function generateIntroScript(options: ScriptOptions): string {
  const { mode, totalItems, direction, targetLanguage, sectionNames } = options
  const langName = LANGUAGE_NAMES[targetLanguage]

  const directionText =
    direction === 'sourceToTarget'
      ? `Ich sage ein deutsches Wort, du sagst es auf ${langName}`
      : direction === 'targetToSource'
        ? `Ich sage ein Wort auf ${langName}, du sagst es auf Deutsch`
        : `Die Richtung wechselt ab`

  if (mode === 'calm') {
    const sectionsText = sectionNames?.length
      ? `aus ${sectionNames.join(' und ')}`
      : ''

    return [
      `Hallo!${SHORT_PAUSE}`,
      `Bereit für ein bisschen Vokabelübung?${MEDIUM_PAUSE}`,
      `Wir üben ${totalItems} Wörter ${sectionsText}.${SHORT_PAUSE}`,
      `${directionText}.${MEDIUM_PAUSE}`,
      `Nimm dir Zeit.${SHORT_PAUSE}`,
      `Du kannst jederzeit "nochmal" sagen, wenn ich wiederholen soll.${MEDIUM_PAUSE}`,
      `Los geht's!`,
    ].join('')
  } else {
    return [
      `Challenge Mode!${SHORT_PAUSE}`,
      `${totalItems} Wörter.${SHORT_PAUSE}`,
      `${directionText}.${SHORT_PAUSE}`,
      `Bereit?${MEDIUM_PAUSE}`,
      `Los!`,
    ].join('')
  }
}

/**
 * Generate the question prompt
 */
export function generateQuestionScript(
  questionWord: string,
  options: QuestionOptions
): string {
  const { mode, questionNumber, currentStreak, direction, targetLanguage } = options
  const langName = LANGUAGE_NAMES[targetLanguage]

  if (mode === 'calm') {
    // Vary the question phrasing for engagement
    const variations =
      direction === 'sourceToTarget'
        ? [
            `Wie heißt "${questionWord}" auf ${langName}?`,
            `Was ist "${questionWord}" auf ${langName}?`,
            `"${questionWord}"${SHORT_PAUSE}auf ${langName}?`,
          ]
        : direction === 'targetToSource'
          ? [
              `Was bedeutet "${questionWord}" auf Deutsch?`,
              `"${questionWord}"${SHORT_PAUSE}auf Deutsch?`,
              `Wie heißt "${questionWord}" auf Deutsch?`,
            ]
          : [
              // Mixed - determined elsewhere
              `"${questionWord}"?`,
            ]

    const variation = variations[questionNumber % variations.length]

    // Add streak encouragement occasionally
    if (currentStreak === 3) {
      return `Gut!${SHORT_PAUSE}${variation}`
    } else if (currentStreak === 5) {
      return `Super!${SHORT_PAUSE}${variation}`
    } else if (currentStreak >= 7) {
      return `Fantastisch!${SHORT_PAUSE}${variation}`
    }

    return variation
  } else {
    // Challenge mode: quick and direct
    if (currentStreak >= 5) {
      return `${currentStreak} in Folge!${SHORT_PAUSE}"${questionWord}"!`
    } else if (currentStreak === 3) {
      return `Super!${SHORT_PAUSE}"${questionWord}"!`
    }
    return `"${questionWord}"!`
  }
}

/**
 * Generate feedback for an answer
 */
export function generateFeedbackScript(options: FeedbackOptions): string {
  const {
    mode,
    wasCorrect,
    expectedAnswer,
    currentStreak,
    questionNumber,
    totalQuestions,
    isLastQuestion,
  } = options

  if (mode === 'calm') {
    if (wasCorrect) {
      // Correct answer feedback
      const correctPhrases = [
        'Richtig!',
        'Genau!',
        'Stimmt!',
        'Sehr gut!',
        'Prima!',
        'Gut gemacht!',
      ]
      const phrase = correctPhrases[questionNumber % correctPhrases.length]

      // Add streak celebration
      if (currentStreak === 5) {
        return `${phrase}${SHORT_PAUSE}Fünf richtig hintereinander!`
      } else if (currentStreak === 10) {
        return `${phrase}${SHORT_PAUSE}Zehn in Folge! Unglaublich!`
      }

      return phrase
    } else {
      // Incorrect answer feedback
      return `Nicht ganz.${SHORT_PAUSE}Die Antwort ist "${expectedAnswer}".${SHORT_PAUSE}Kein Problem, weiter geht's!`
    }
  } else {
    // Challenge mode: quick feedback
    if (wasCorrect) {
      if (currentStreak >= 10) {
        return 'Boom!'
      } else if (currentStreak >= 5) {
        return 'Yeah!'
      }
      return 'Ja!'
    } else {
      return `Nein!${SHORT_PAUSE}"${expectedAnswer}"!`
    }
  }
}

/**
 * Generate the "don't know" response
 */
export function generateDontKnowScript(
  expectedAnswer: string,
  mode: VoicePracticeMode
): string {
  if (mode === 'calm') {
    return `Kein Problem!${SHORT_PAUSE}Die Antwort ist "${expectedAnswer}".${SHORT_PAUSE}Merken wir uns für später.`
  } else {
    return `"${expectedAnswer}"!${SHORT_PAUSE}Weiter!`
  }
}

/**
 * Generate timeout response (user didn't answer)
 */
export function generateTimeoutScript(
  expectedAnswer: string,
  mode: VoicePracticeMode
): string {
  if (mode === 'calm') {
    return `Brauchst du mehr Zeit?${SHORT_PAUSE}Die Antwort ist "${expectedAnswer}".${SHORT_PAUSE}Versuchen wir das nächste.`
  } else {
    return `Zeit vorbei!${SHORT_PAUSE}"${expectedAnswer}"!`
  }
}

/**
 * Generate repeat confirmation
 */
export function generateRepeatScript(
  questionWord: string,
  mode: VoicePracticeMode
): string {
  if (mode === 'calm') {
    return `Klar!${SHORT_PAUSE}"${questionWord}"`
  } else {
    return `"${questionWord}"!`
  }
}

/**
 * Generate skip confirmation
 */
export function generateSkipScript(
  expectedAnswer: string,
  mode: VoicePracticeMode
): string {
  if (mode === 'calm') {
    return `Okay, überspringen wir.${SHORT_PAUSE}Die Antwort war "${expectedAnswer}".`
  } else {
    return `"${expectedAnswer}"!${SHORT_PAUSE}Weiter!`
  }
}

/**
 * Generate hint response
 */
export function generateHintScript(
  hint: string | undefined,
  expectedAnswer: string,
  mode: VoicePracticeMode
): string {
  if (hint) {
    if (mode === 'calm') {
      return `Hier ein Hinweis:${SHORT_PAUSE}${hint}`
    } else {
      return hint
    }
  }

  // No hint available - give first letter
  const firstLetter = expectedAnswer.charAt(0).toUpperCase()
  if (mode === 'calm') {
    return `Es fängt mit "${firstLetter}" an.`
  } else {
    return `"${firstLetter}"...`
  }
}

/**
 * Generate session summary
 */
export function generateSummaryScript(options: SummaryOptions): string {
  const { mode, correctCount, totalCount, maxStreak } = options
  const percentage = Math.round((correctCount / totalCount) * 100)

  if (mode === 'calm') {
    let summary = `Fertig!${MEDIUM_PAUSE}`

    if (percentage === 100) {
      summary += `Alle ${totalCount} richtig!${SHORT_PAUSE}Perfekt!${MEDIUM_PAUSE}`
    } else if (percentage >= 90) {
      summary += `${correctCount} von ${totalCount} richtig.${SHORT_PAUSE}Ausgezeichnet!${MEDIUM_PAUSE}`
    } else if (percentage >= 70) {
      summary += `${correctCount} von ${totalCount} richtig.${SHORT_PAUSE}Gut gemacht!${MEDIUM_PAUSE}`
    } else if (percentage >= 50) {
      summary += `${correctCount} von ${totalCount} richtig.${SHORT_PAUSE}Weiter üben!${MEDIUM_PAUSE}`
    } else {
      summary += `${correctCount} von ${totalCount} richtig.${SHORT_PAUSE}Das wird besser mit mehr Übung.${MEDIUM_PAUSE}`
    }

    if (maxStreak >= 5) {
      summary += `Deine längste Serie war ${maxStreak} Wörter.${SHORT_PAUSE}`
    }

    summary += 'Bis zum nächsten Mal!'
    return summary
  } else {
    // Challenge mode
    let summary = 'Fertig!'

    if (percentage === 100) {
      summary += `${SHORT_PAUSE}Perfekt!${SHORT_PAUSE}${totalCount} von ${totalCount}!`
    } else if (percentage >= 80) {
      summary += `${SHORT_PAUSE}Stark!${SHORT_PAUSE}${correctCount} von ${totalCount}!`
    } else {
      summary += `${SHORT_PAUSE}${correctCount} von ${totalCount}.`
    }

    if (maxStreak >= 5) {
      summary += `${SHORT_PAUSE}Beste Serie: ${maxStreak}!`
    }

    return summary
  }
}

/**
 * Generate stop/pause confirmation
 */
export function generateStopScript(
  mode: VoicePracticeMode,
  questionsCompleted: number,
  correctCount: number
): string {
  if (mode === 'calm') {
    if (questionsCompleted === 0) {
      return 'Okay, wir hören auf. Bis zum nächsten Mal!'
    }
    return `Alles klar, wir stoppen hier.${SHORT_PAUSE}Du hast ${correctCount} von ${questionsCompleted} richtig. Gut gemacht!`
  } else {
    return `Stop!${SHORT_PAUSE}${correctCount} von ${questionsCompleted} richtig.`
  }
}

/**
 * Get the listening timeout based on mode
 */
export function getListeningTimeout(mode: VoicePracticeMode): number {
  return mode === 'calm' ? 6000 : 4000 // ms
}

/**
 * Get the pause between questions based on mode
 */
export function getQuestionPause(mode: VoicePracticeMode): number {
  return mode === 'calm' ? 1500 : 800 // ms
}

/**
 * Get the pause after feedback based on mode
 */
export function getFeedbackPause(mode: VoicePracticeMode): number {
  return mode === 'calm' ? 1200 : 500 // ms
}

/**
 * Get TTS rate based on mode
 */
export function getTTSRate(mode: VoicePracticeMode): number {
  return mode === 'calm' ? 0.85 : 1.0
}
