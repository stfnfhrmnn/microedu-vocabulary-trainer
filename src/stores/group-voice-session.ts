import { create } from 'zustand'
import type { Language, VocabularyItem } from '@/lib/db/schema'

export type GroupSessionMode = 'lernkreis' | 'duell' | 'quizshow'
export type ImmersionLevel = 'beginner' | 'intermediate' | 'advanced' | 'full'
export type TimingMode = 'calm' | 'challenge'
export type ParticipantRole = 'player' | 'spectator'

export interface GroupParticipant {
  id: string
  name: string
  oderId?: string // Optional link to real account
  role: ParticipantRole
  joinedAt: Date

  // Player stats
  questionsAnswered: number
  correctAnswers: number
  hintsGiven: number
  hintsReceived: number
  currentStreak: number
  maxStreak: number
}

export interface DifficultWord {
  word: string
  translation: string
  missedBy: string[] // Player names
}

export interface ConversationTurn {
  role: 'assistant' | 'user'
  content: string
  speaker?: string // For user turns, who spoke (if known)
  timestamp: Date
  metadata?: {
    questionTarget?: string // Who was asked
    wasCorrect?: boolean
    helpedBy?: string
    currentWord?: string
    expectedAnswer?: string
  }
}

export type ContentSource =
  | { type: 'sections'; sectionIds: string[]; sectionNames: string[] }
  | { type: 'book'; bookId: string; bookName: string }
  | { type: 'topic'; topic: string }
  | { type: 'mixed'; sectionIds?: string[] }

export type GroupSessionStatus =
  | 'idle'
  | 'setup' // Gathering players
  | 'active' // Main conversation loop
  | 'waiting' // Waiting for answer
  | 'processing' // Processing answer
  | 'summary' // End of session
  | 'paused'

interface GroupVoiceSessionState {
  // Session config
  mode: GroupSessionMode
  targetLanguage: Language | null
  immersionLevel: ImmersionLevel
  timingMode: TimingMode
  contentSource: ContentSource | null

  // Participants
  players: GroupParticipant[]
  spectators: GroupParticipant[]

  // Session state
  status: GroupSessionStatus
  conversationHistory: ConversationTurn[]
  currentSpeaker: string | null // Player name currently expected to answer

  // Vocabulary pool
  vocabularyPool: VocabularyItem[]
  usedVocabularyIds: Set<string>
  currentWord: VocabularyItem | null
  currentQuestion: string | null
  currentExpectedAnswer: string | null

  // Session stats
  startedAt: Date | null
  questionsAsked: number
  difficultWords: DifficultWord[]

  // Last transcript for processing
  lastTranscript: string

  // Actions
  initSession: (config: {
    mode: GroupSessionMode
    targetLanguage: Language
    immersionLevel: ImmersionLevel
    timingMode: TimingMode
    contentSource: ContentSource
    vocabularyPool: VocabularyItem[]
  }) => void

  addPlayer: (name: string, oderId?: string) => void
  addSpectator: (name: string) => void
  removeParticipant: (id: string) => void
  convertToPlayer: (id: string) => void

  setStatus: (status: GroupSessionStatus) => void
  setCurrentSpeaker: (name: string | null) => void
  setLastTranscript: (transcript: string) => void

  addConversationTurn: (turn: Omit<ConversationTurn, 'timestamp'>) => void

  setCurrentQuestion: (
    word: VocabularyItem,
    question: string,
    expectedAnswer: string,
    targetPlayer: string
  ) => void

  recordAnswer: (
    playerName: string,
    wasCorrect: boolean,
    helpedBy?: string
  ) => void

  markWordDifficult: (word: string, translation: string, playerName: string) => void

  getNextPlayer: () => string | null
  getParticipationStats: () => Record<string, { asked: number; answered: number }>

  startSession: () => void
  pause: () => void
  resume: () => void
  endSession: () => void
  reset: () => void
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export const useGroupVoiceSession = create<GroupVoiceSessionState>((set, get) => ({
  // Initial state
  mode: 'lernkreis',
  targetLanguage: null,
  immersionLevel: 'intermediate',
  timingMode: 'calm',
  contentSource: null,

  players: [],
  spectators: [],

  status: 'idle',
  conversationHistory: [],
  currentSpeaker: null,

  vocabularyPool: [],
  usedVocabularyIds: new Set(),
  currentWord: null,
  currentQuestion: null,
  currentExpectedAnswer: null,

  startedAt: null,
  questionsAsked: 0,
  difficultWords: [],

  lastTranscript: '',

  // Actions
  initSession: (config) => {
    set({
      mode: config.mode,
      targetLanguage: config.targetLanguage,
      immersionLevel: config.immersionLevel,
      timingMode: config.timingMode,
      contentSource: config.contentSource,
      vocabularyPool: config.vocabularyPool,
      status: 'setup',
      players: [],
      spectators: [],
      conversationHistory: [],
      usedVocabularyIds: new Set(),
      currentWord: null,
      currentQuestion: null,
      currentExpectedAnswer: null,
      questionsAsked: 0,
      difficultWords: [],
      lastTranscript: '',
    })
  },

  addPlayer: (name, oderId) => {
    const player: GroupParticipant = {
      id: generateId(),
      name,
      oderId,
      role: 'player',
      joinedAt: new Date(),
      questionsAnswered: 0,
      correctAnswers: 0,
      hintsGiven: 0,
      hintsReceived: 0,
      currentStreak: 0,
      maxStreak: 0,
    }
    set((state) => ({ players: [...state.players, player] }))
  },

  addSpectator: (name) => {
    const spectator: GroupParticipant = {
      id: generateId(),
      name,
      role: 'spectator',
      joinedAt: new Date(),
      questionsAnswered: 0,
      correctAnswers: 0,
      hintsGiven: 0,
      hintsReceived: 0,
      currentStreak: 0,
      maxStreak: 0,
    }
    set((state) => ({ spectators: [...state.spectators, spectator] }))
  },

  removeParticipant: (id) => {
    set((state) => ({
      players: state.players.filter((p) => p.id !== id),
      spectators: state.spectators.filter((s) => s.id !== id),
    }))
  },

  convertToPlayer: (id) => {
    const { spectators } = get()
    const spectator = spectators.find((s) => s.id === id)
    if (!spectator) return

    const player: GroupParticipant = {
      ...spectator,
      role: 'player',
      joinedAt: new Date(), // Reset join time
      questionsAnswered: 0,
      correctAnswers: 0,
      currentStreak: 0,
      maxStreak: 0,
    }

    set((state) => ({
      spectators: state.spectators.filter((s) => s.id !== id),
      players: [...state.players, player],
    }))
  },

  setStatus: (status) => set({ status }),

  setCurrentSpeaker: (name) => set({ currentSpeaker: name }),

  setLastTranscript: (transcript) => set({ lastTranscript: transcript }),

  addConversationTurn: (turn) => {
    set((state) => ({
      conversationHistory: [
        ...state.conversationHistory,
        { ...turn, timestamp: new Date() },
      ],
    }))
  },

  setCurrentQuestion: (word, question, expectedAnswer, targetPlayer) => {
    set((state) => ({
      currentWord: word,
      currentQuestion: question,
      currentExpectedAnswer: expectedAnswer,
      currentSpeaker: targetPlayer,
      usedVocabularyIds: new Set([...state.usedVocabularyIds, word.id]),
      questionsAsked: state.questionsAsked + 1,
    }))
  },

  recordAnswer: (playerName, wasCorrect, helpedBy) => {
    set((state) => {
      const updatedPlayers = state.players.map((p) => {
        if (p.name === playerName) {
          const newStreak = wasCorrect ? p.currentStreak + 1 : 0
          return {
            ...p,
            questionsAnswered: p.questionsAnswered + 1,
            correctAnswers: wasCorrect ? p.correctAnswers + 1 : p.correctAnswers,
            hintsReceived: helpedBy ? p.hintsReceived + 1 : p.hintsReceived,
            currentStreak: newStreak,
            maxStreak: Math.max(p.maxStreak, newStreak),
          }
        }
        // Track hints given
        if (helpedBy && p.name === helpedBy) {
          return {
            ...p,
            hintsGiven: p.hintsGiven + 1,
          }
        }
        return p
      })

      // Also check spectators for hints given
      const updatedSpectators = state.spectators.map((s) => {
        if (helpedBy && s.name === helpedBy) {
          return {
            ...s,
            hintsGiven: s.hintsGiven + 1,
          }
        }
        return s
      })

      return {
        players: updatedPlayers,
        spectators: updatedSpectators,
      }
    })
  },

  markWordDifficult: (word, translation, playerName) => {
    set((state) => {
      const existing = state.difficultWords.find((w) => w.word === word)
      if (existing) {
        if (!existing.missedBy.includes(playerName)) {
          return {
            difficultWords: state.difficultWords.map((w) =>
              w.word === word
                ? { ...w, missedBy: [...w.missedBy, playerName] }
                : w
            ),
          }
        }
        return state
      }
      return {
        difficultWords: [
          ...state.difficultWords,
          { word, translation, missedBy: [playerName] },
        ],
      }
    })
  },

  getNextPlayer: () => {
    const { players, currentSpeaker } = get()
    if (players.length === 0) return null

    // Get participation counts
    const stats = get().getParticipationStats()

    // Find player with least questions asked
    let minAsked = Infinity
    let candidates: string[] = []

    for (const player of players) {
      const asked = stats[player.name]?.asked || 0
      if (asked < minAsked) {
        minAsked = asked
        candidates = [player.name]
      } else if (asked === minAsked) {
        candidates.push(player.name)
      }
    }

    // If multiple candidates, pick randomly but avoid current speaker
    const filtered = candidates.filter((c) => c !== currentSpeaker)
    const pool = filtered.length > 0 ? filtered : candidates

    return pool[Math.floor(Math.random() * pool.length)]
  },

  getParticipationStats: () => {
    const { conversationHistory, players } = get()
    const stats: Record<string, { asked: number; answered: number }> = {}

    // Initialize all players
    for (const player of players) {
      stats[player.name] = { asked: 0, answered: 0 }
    }

    // Count from conversation history
    for (const turn of conversationHistory) {
      if (turn.metadata?.questionTarget) {
        const target = turn.metadata.questionTarget
        if (stats[target]) {
          stats[target].asked++
        }
      }
      if (turn.role === 'user' && turn.speaker && stats[turn.speaker]) {
        stats[turn.speaker].answered++
      }
    }

    return stats
  },

  startSession: () => {
    set({
      status: 'active',
      startedAt: new Date(),
    })
  },

  pause: () => {
    const { status } = get()
    if (status === 'active' || status === 'waiting') {
      set({ status: 'paused' })
    }
  },

  resume: () => {
    const { status } = get()
    if (status === 'paused') {
      set({ status: 'active' })
    }
  },

  endSession: () => {
    set({ status: 'summary' })
  },

  reset: () => {
    set({
      mode: 'lernkreis',
      targetLanguage: null,
      immersionLevel: 'intermediate',
      timingMode: 'calm',
      contentSource: null,
      players: [],
      spectators: [],
      status: 'idle',
      conversationHistory: [],
      currentSpeaker: null,
      vocabularyPool: [],
      usedVocabularyIds: new Set(),
      currentWord: null,
      currentQuestion: null,
      currentExpectedAnswer: null,
      startedAt: null,
      questionsAsked: 0,
      difficultWords: [],
      lastTranscript: '',
    })
  },
}))

// Selectors
export const useGroupSessionPlayers = () =>
  useGroupVoiceSession((state) => state.players)

export const useGroupSessionSpectators = () =>
  useGroupVoiceSession((state) => state.spectators)

export const useGroupSessionStats = () =>
  useGroupVoiceSession((state) => ({
    questionsAsked: state.questionsAsked,
    players: state.players,
    spectators: state.spectators,
    difficultWords: state.difficultWords,
    startedAt: state.startedAt,
  }))
