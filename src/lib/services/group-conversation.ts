/**
 * Group Conversation Service
 *
 * Manages LLM-powered conversations for group voice learning sessions.
 * Uses server-side proxy to Gemini 2.0 Flash for fast, multilingual conversation.
 */

import type { Language, VocabularyItem } from '@/lib/db/schema'
import type {
  GroupParticipant,
  ConversationTurn,
  ContentSource,
  ImmersionLevel,
  TimingMode,
} from '@/stores/group-voice-session'

const LANGUAGE_NAMES: Record<Language, { german: string; native: string }> = {
  french: { german: 'Französisch', native: 'français' },
  spanish: { german: 'Spanisch', native: 'español' },
  latin: { german: 'Latein', native: 'latīnē' },
}

interface ConversationContext {
  players: GroupParticipant[]
  spectators: GroupParticipant[]
  targetLanguage: Language
  immersionLevel: ImmersionLevel
  timingMode: TimingMode
  contentSource: ContentSource
  conversationHistory: ConversationTurn[]
  currentWord?: VocabularyItem
  currentSpeaker?: string
  questionsAsked: number
  difficultWords: Array<{ word: string; translation: string; missedBy: string[] }>
}

/**
 * Build the system prompt for the group session
 */
function buildSystemPrompt(context: ConversationContext): string {
  const { players, spectators, targetLanguage, immersionLevel, contentSource } =
    context
  const langInfo = LANGUAGE_NAMES[targetLanguage]

  const playerNames = players.map((p) => p.name).join(', ')
  const spectatorNames =
    spectators.length > 0
      ? spectators.map((s) => s.name).join(', ')
      : 'keine'

  const participationStats = players
    .map(
      (p) =>
        `${p.name}: ${p.questionsAnswered} Fragen, ${p.correctAnswers} richtig`
    )
    .join('; ')

  const immersionInstructions = {
    beginner: `Sprich hauptsächlich Deutsch. Nur die Vokabeln selbst sind auf ${langInfo.german}.`,
    intermediate: `Stelle Fragen auf ${langInfo.german}, aber erkläre auf Deutsch wenn nötig. Wechsle zu Deutsch wenn jemand "auf Deutsch" sagt oder verwirrt klingt.`,
    advanced: `Sprich fast nur ${langInfo.german}. Nur bei expliziter Bitte ("auf Deutsch", "ich verstehe nicht") wechselst du kurz zu Deutsch.`,
    full: `Sprich ausschließlich ${langInfo.german}. Keine deutschen Erklärungen.`,
  }

  const contentDescription =
    contentSource.type === 'sections'
      ? `Vokabeln aus: ${contentSource.sectionNames.join(', ')}`
      : contentSource.type === 'book'
        ? `Vokabeln aus dem Buch: ${contentSource.bookName}`
        : contentSource.type === 'topic'
          ? `Freies Thema: ${contentSource.topic}`
          : 'Gemischte Vokabeln'

  return `Du bist ein freundlicher, ermutigender Sprachtutor der eine Gruppen-Vokabelübung leitet.

TEILNEHMER:
- Spieler: ${playerNames}
- Zuschauer: ${spectatorNames}

EINSTELLUNGEN:
- Sprache: ${langInfo.german} (${langInfo.native})
- Inhalt: ${contentDescription}
- Immersionslevel: ${immersionLevel}

SPRACHANWEISUNGEN:
${immersionInstructions[immersionLevel]}

AKTUELLER STAND:
${participationStats || 'Noch keine Fragen gestellt'}

VERHALTENSREGELN:
1. Sei warm, geduldig und ermutigend - besonders bei Kindern
2. Verteile Fragen fair auf alle Spieler (wer am wenigsten hatte, kommt als nächstes)
3. Bei falschen Antworten: sanft korrigieren, die richtige Antwort geben
4. Bei Stille: erst ermutigen ("Nimm dir Zeit"), dann Hilfe anbieten
5. Zuschauer können Tipps geben - lade sie ein wenn Spieler feststecken
6. Feiere Erfolge! Streaks, gute Antworten, Teamwork
7. Wenn jemand anders als der gefragte Spieler antwortet: akzeptiere es freundlich, gib dem übersprungenen Spieler die nächste Frage
8. Halte Antworten kurz und natürlich - das ist ein Gespräch, kein Vortrag

WICHTIG:
- Antworte NUR mit dem, was du sagen würdest - keine Metakommentare
- Keine Emojis in deinen Antworten
- Formatiere NICHT als Liste oder mit Markdown`
}

/**
 * Build messages array for Gemini API
 */
function buildMessages(
  context: ConversationContext,
  userMessage?: string
): Array<{ role: string; parts: Array<{ text: string }> }> {
  const messages: Array<{ role: string; parts: Array<{ text: string }> }> = []

  // Add conversation history (last 20 turns to manage context)
  const recentHistory = context.conversationHistory.slice(-20)

  for (const turn of recentHistory) {
    messages.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [
        {
          text: turn.speaker
            ? `[${turn.speaker}]: ${turn.content}`
            : turn.content,
        },
      ],
    })
  }

  // Add new user message if provided
  if (userMessage) {
    messages.push({
      role: 'user',
      parts: [{ text: userMessage }],
    })
  }

  return messages
}

/**
 * Call Gemini API via server-side proxy
 */
async function callGemini(
  systemPrompt: string,
  messages: Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<string> {
  // Use server-side proxy instead of direct API call
  const response = await fetch('/api/google/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemini-2.0-flash',
      contents: messages,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 300,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `API error: ${response.status}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/**
 * Group Conversation Service
 */
export class GroupConversationService {
  private enabled: boolean = false

  setApiKey(apiKey: string | null) {
    // Legacy method - now just enables/disables service
    this.enabled = !!apiKey
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isAvailable(): boolean {
    return this.enabled
  }

  /**
   * Generate the opening greeting for the session
   */
  async generateGreeting(context: ConversationContext): Promise<string> {
    if (!this.enabled) throw new Error('Gemini not enabled')

    const systemPrompt = buildSystemPrompt(context)
    const langInfo = LANGUAGE_NAMES[context.targetLanguage]

    const setupMessage =
      context.immersionLevel === 'beginner'
        ? `Begrüße die Spieler auf Deutsch und erkläre kurz wie es funktioniert. Frag dann nach dem ersten Wort.`
        : `Begrüße die Spieler auf ${langInfo.german} (mit etwas Deutsch gemischt). Erkläre kurz die Regeln und dass sie "auf Deutsch" sagen können wenn sie Hilfe brauchen. Dann frag, ob sie bereit sind.`

    const messages = buildMessages(context, setupMessage)
    return callGemini(systemPrompt, messages)
  }

  /**
   * Generate a question for a specific player
   */
  async generateQuestion(
    context: ConversationContext,
    word: VocabularyItem,
    targetPlayer: string
  ): Promise<string> {
    if (!this.enabled) throw new Error('Gemini not enabled')

    const systemPrompt = buildSystemPrompt(context)
    const langInfo = LANGUAGE_NAMES[context.targetLanguage]

    // Determine question direction based on immersion level
    const askInTargetLang =
      context.immersionLevel === 'advanced' ||
      context.immersionLevel === 'full'

    const instruction = askInTargetLang
      ? `Frage ${targetPlayer} nach der Übersetzung von "${word.sourceText}" (deutsch) ins ${langInfo.german}. Stelle die Frage auf ${langInfo.german}.`
      : `Frage ${targetPlayer}: Wie heißt "${word.sourceText}" auf ${langInfo.german}?`

    const messages = buildMessages(context, instruction)
    return callGemini(systemPrompt, messages)
  }

  /**
   * Process a user's answer and generate feedback
   */
  async processAnswer(
    context: ConversationContext,
    transcript: string,
    expectedAnswer: string,
    currentPlayer: string
  ): Promise<{
    response: string
    isCorrect: boolean
    detectedIntent: 'answer' | 'help_request' | 'dont_know' | 'repeat' | 'stop' | 'other'
    helpedBy?: string
  }> {
    if (!this.enabled) throw new Error('Gemini not enabled')

    const systemPrompt = buildSystemPrompt(context)

    // Ask LLM to evaluate and respond
    const evaluationPrompt = `Der Spieler ${currentPlayer} sollte antworten. Die erwartete Antwort ist "${expectedAnswer}".

Was gesagt wurde: "${transcript}"

Analysiere:
1. War die Antwort korrekt (auch bei kleinen Aussprachefehlern)?
2. Hat jemand anders geantwortet statt ${currentPlayer}?
3. Hat jemand um Hilfe gebeten ("auf Deutsch", "ich weiß nicht", "Hilfe")?
4. Will jemand dass du wiederholst ("nochmal", "wie bitte")?
5. Will jemand aufhören ("stop", "aufhören", "fertig")?

Antworte dann natürlich und passend. Bei richtiger Antwort: kurzes Lob. Bei falscher: sanfte Korrektur mit der richtigen Antwort.

WICHTIG: Beginne deine Antwort mit einem dieser Tags in eckigen Klammern:
[CORRECT] - wenn die Antwort richtig war
[INCORRECT] - wenn die Antwort falsch war
[HELP] - wenn um Hilfe gebeten wurde
[REPEAT] - wenn Wiederholung gewünscht
[STOP] - wenn aufgehört werden soll
[HELPED_BY:Name] - wenn jemand anders als ${currentPlayer} geantwortet hat (ersetze Name)

Dann dein gesprochener Text.`

    const messages = buildMessages(context, evaluationPrompt)
    const response = await callGemini(systemPrompt, messages)

    // Parse the response
    let isCorrect = false
    let detectedIntent: 'answer' | 'help_request' | 'dont_know' | 'repeat' | 'stop' | 'other' = 'other'
    let helpedBy: string | undefined
    let cleanResponse = response

    if (response.startsWith('[CORRECT]')) {
      isCorrect = true
      detectedIntent = 'answer'
      cleanResponse = response.replace('[CORRECT]', '').trim()
    } else if (response.startsWith('[INCORRECT]')) {
      isCorrect = false
      detectedIntent = 'answer'
      cleanResponse = response.replace('[INCORRECT]', '').trim()
    } else if (response.startsWith('[HELP]')) {
      detectedIntent = 'help_request'
      cleanResponse = response.replace('[HELP]', '').trim()
    } else if (response.startsWith('[REPEAT]')) {
      detectedIntent = 'repeat'
      cleanResponse = response.replace('[REPEAT]', '').trim()
    } else if (response.startsWith('[STOP]')) {
      detectedIntent = 'stop'
      cleanResponse = response.replace('[STOP]', '').trim()
    } else if (response.match(/^\[HELPED_BY:(\w+)\]/)) {
      const match = response.match(/^\[HELPED_BY:(\w+)\]/)
      if (match) {
        helpedBy = match[1]
        isCorrect = true // If someone helped, we count it as eventually correct
        detectedIntent = 'answer'
        cleanResponse = response.replace(/^\[HELPED_BY:\w+\]/, '').trim()
      }
    }

    return {
      response: cleanResponse,
      isCorrect,
      detectedIntent,
      helpedBy,
    }
  }

  /**
   * Generate encouragement when player is taking time
   */
  async generateEncouragement(
    context: ConversationContext,
    currentPlayer: string
  ): Promise<string> {
    if (!this.enabled) throw new Error('Gemini not enabled')

    const systemPrompt = buildSystemPrompt(context)
    const langInfo = LANGUAGE_NAMES[context.targetLanguage]

    const instruction =
      context.immersionLevel === 'beginner'
        ? `${currentPlayer} braucht etwas Zeit. Ermutige sie/ihn kurz auf Deutsch ("Nimm dir Zeit...", "Kein Stress...").`
        : `${currentPlayer} braucht Zeit. Ermutige kurz, hauptsächlich auf ${langInfo.german} ("Prends ton temps...", "No hay prisa...").`

    const messages = buildMessages(context, instruction)
    return callGemini(systemPrompt, messages)
  }

  /**
   * Generate help offer (inviting others to help)
   */
  async generateHelpOffer(
    context: ConversationContext,
    currentPlayer: string
  ): Promise<string> {
    if (!this.enabled) throw new Error('Gemini not enabled')

    const systemPrompt = buildSystemPrompt(context)

    const hasSpectators = context.spectators.length > 0
    const instruction = hasSpectators
      ? `${currentPlayer} kommt nicht weiter. Biete an dass andere Spieler oder Zuschauer einen Tipp geben können.`
      : `${currentPlayer} kommt nicht weiter. Biete an dass andere Spieler helfen können, oder dass du einen Tipp gibst.`

    const messages = buildMessages(context, instruction)
    return callGemini(systemPrompt, messages)
  }

  /**
   * Generate session summary
   */
  async generateSummary(context: ConversationContext): Promise<string> {
    if (!this.enabled) throw new Error('Gemini not enabled')

    const systemPrompt = buildSystemPrompt(context)

    // Build summary data
    const playerSummaries = context.players
      .map((p) => {
        const accuracy =
          p.questionsAnswered > 0
            ? Math.round((p.correctAnswers / p.questionsAnswered) * 100)
            : 0
        return `${p.name}: ${p.questionsAnswered} Fragen, ${p.correctAnswers} richtig (${accuracy}%), beste Serie: ${p.maxStreak}, hat ${p.hintsGiven}x geholfen`
      })
      .join('\n')

    const spectatorSummaries = context.spectators
      .filter((s) => s.hintsGiven > 0)
      .map((s) => `${s.name} (Zuschauer): ${s.hintsGiven} Tipps gegeben`)
      .join('\n')

    const difficultWords =
      context.difficultWords.length > 0
        ? context.difficultWords
            .slice(0, 5)
            .map((w) => `${w.word} = ${w.translation}`)
            .join(', ')
        : 'keine besonderen'

    const totalCorrect = context.players.reduce(
      (sum, p) => sum + p.correctAnswers,
      0
    )
    const totalQuestions = context.players.reduce(
      (sum, p) => sum + p.questionsAnswered,
      0
    )
    const teamAccuracy =
      totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

    const instruction = `Die Session ist vorbei. Erstelle eine freundliche, gesprochene Zusammenfassung.

STATISTIKEN:
${playerSummaries}
${spectatorSummaries ? '\n' + spectatorSummaries : ''}

Team-Ergebnis: ${totalCorrect}/${totalQuestions} richtig (${teamAccuracy}%)
Schwierige Wörter: ${difficultWords}

Fasse zusammen:
1. Lobe jeden Spieler individuell (erwähne ihre Stärken)
2. Erwähne besondere Leistungen (Streaks, Hilfsbereitschaft)
3. Wenn Zuschauer geholfen haben, danke ihnen
4. Nenne die schwierigen Wörter zum Nachüben
5. Verabschiede dich freundlich

Halte es natürlich und warm - wie ein Lehrer der stolz auf seine Schüler ist.`

    const messages = buildMessages(context, instruction)
    return callGemini(systemPrompt, messages)
  }

  /**
   * Handle free-form conversation (for topic-based sessions)
   */
  async handleFreeConversation(
    context: ConversationContext,
    userMessage: string
  ): Promise<string> {
    if (!this.enabled) throw new Error('Gemini not enabled')

    const systemPrompt = buildSystemPrompt(context)
    const messages = buildMessages(context, userMessage)
    return callGemini(systemPrompt, messages)
  }
}

// Singleton instance
let groupConversationService: GroupConversationService | null = null

export function getGroupConversationService(): GroupConversationService {
  if (!groupConversationService) {
    groupConversationService = new GroupConversationService()
  }
  return groupConversationService
}
