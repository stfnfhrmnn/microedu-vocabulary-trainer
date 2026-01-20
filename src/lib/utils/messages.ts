/**
 * Encouraging messages for the vocabulary trainer
 * All messages are in German for the target audience
 */

// Correct answer messages
const correctMessages = [
  'Super!',
  'Toll gemacht!',
  'Richtig!',
  'Perfekt!',
  'Genau!',
  'Sehr gut!',
  'Klasse!',
  'Weiter so!',
  'Prima!',
  'Ausgezeichnet!',
]

// Messages for "almost correct" answers
const almostMessages = [
  'Fast! Beim nächsten Mal klappt es!',
  'Knapp daneben!',
  'Du bist auf dem richtigen Weg!',
  'So nah dran!',
  'Das war fast perfekt!',
  'Gleich hast du es!',
]

// Encouraging messages for incorrect answers (never discouraging)
const incorrectMessages = [
  'Macht nichts, probier es nochmal!',
  'Übung macht den Meister!',
  'Beim nächsten Mal klappt es!',
  'Bleib dran!',
  'Jeder fängt mal klein an!',
  'Du schaffst das!',
]

// Streak milestone messages
const streakMessages: Record<number, string> = {
  3: '3 in Folge! Toller Start!',
  5: '5 in Folge! Du bist im Flow!',
  10: '10 in Folge! Unglaublich!',
  15: '15 in Folge! Du bist ein Star!',
  20: '20 in Folge! Nicht zu stoppen!',
}

// Session completion messages based on score percentage
const completionMessages: Record<string, string[]> = {
  excellent: [
    // 90-100%
    'Fantastisch! Du bist ein Vokabel-Profi!',
    'Hervorragend! Das war spitze!',
    'Perfekte Leistung! Weiter so!',
  ],
  good: [
    // 70-89%
    'Gut gemacht! Du machst Fortschritte!',
    'Sehr gut! Das war eine tolle Übung!',
    'Super Leistung! Weiter üben lohnt sich!',
  ],
  okay: [
    // 50-69%
    'Guter Anfang! Mit etwas Übung wird es noch besser!',
    'Du bist auf dem richtigen Weg!',
    'Nicht schlecht! Die Vokabeln sitzen bald!',
  ],
  needsPractice: [
    // <50%
    'Übung macht den Meister! Versuche es nochmal!',
    'Jeder fängt mal an! Bleib dran!',
    'Das wird schon! Übung hilft!',
  ],
}

/**
 * Get a random message from an array
 */
function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * Get a message for a correct answer
 */
export function getCorrectMessage(): string {
  return getRandomMessage(correctMessages)
}

/**
 * Get a message for an "almost correct" answer
 */
export function getAlmostMessage(): string {
  return getRandomMessage(almostMessages)
}

/**
 * Get an encouraging message for an incorrect answer
 */
export function getIncorrectMessage(): string {
  return getRandomMessage(incorrectMessages)
}

/**
 * Get a streak milestone message, or null if not a milestone
 */
export function getStreakMessage(streak: number): string | null {
  return streakMessages[streak] || null
}

/**
 * Get a session completion message based on score percentage
 */
export function getCompletionMessage(correctCount: number, totalCount: number): string {
  if (totalCount === 0) return 'Keine Vokabeln geübt.'

  const percentage = (correctCount / totalCount) * 100

  if (percentage >= 90) {
    return getRandomMessage(completionMessages.excellent)
  } else if (percentage >= 70) {
    return getRandomMessage(completionMessages.good)
  } else if (percentage >= 50) {
    return getRandomMessage(completionMessages.okay)
  } else {
    return getRandomMessage(completionMessages.needsPractice)
  }
}

/**
 * Get emoji based on score percentage
 */
export function getScoreEmoji(correctCount: number, totalCount: number): string {
  if (totalCount === 0) return '📚'

  const percentage = (correctCount / totalCount) * 100

  if (percentage >= 90) return '🌟'
  if (percentage >= 70) return '👏'
  if (percentage >= 50) return '💪'
  return '📖'
}
