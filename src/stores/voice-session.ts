import { create } from 'zustand'
import type {
  VocabularyItem,
  LearningProgress,
  PracticeDirection,
  QualityRating,
  Language,
} from '@/lib/db/schema'
import type { VoicePracticeMode } from '@/lib/services/voice-tutor'

export interface VoicePracticeItem {
  vocabulary: VocabularyItem
  progress?: LearningProgress
  answered: boolean
  correct?: boolean
  qualityRating?: QualityRating
  userTranscript?: string
  extractedAnswer?: string
}

export type VoiceSessionStatus =
  | 'idle'
  | 'intro'
  | 'asking'
  | 'listening'
  | 'processing'
  | 'feedback'
  | 'summary'
  | 'paused'
  | 'stopped'

interface VoiceSessionState {
  // Session configuration
  mode: VoicePracticeMode
  direction: PracticeDirection
  sectionIds: string[]
  sectionNames: string[]
  targetLanguage: Language | null

  // Session state
  status: VoiceSessionStatus
  items: VoicePracticeItem[]
  currentIndex: number
  isSessionActive: boolean
  startTime: Date | null

  // Current question state
  currentQuestion: string
  currentAnswer: string
  currentQuestionLanguage: Language | 'german'
  currentAnswerLanguage: Language | 'german'
  lastTranscript: string
  lastFeedbackWasCorrect: boolean | null

  // Streak tracking
  currentStreak: number
  maxStreak: number

  // Timing
  listeningStartTime: number | null
  lastSpeechTime: number | null

  // Actions
  startSession: (config: {
    mode: VoicePracticeMode
    direction: PracticeDirection
    sectionIds: string[]
    sectionNames: string[]
    targetLanguage: Language
    items: { vocabulary: VocabularyItem; progress?: LearningProgress }[]
  }) => void

  setStatus: (status: VoiceSessionStatus) => void
  setCurrentQuestion: (question: string, answer: string, questionLang: Language | 'german', answerLang: Language | 'german') => void
  setLastTranscript: (transcript: string) => void
  setListeningStartTime: (time: number | null) => void
  setLastSpeechTime: (time: number | null) => void

  recordAnswer: (
    correct: boolean,
    qualityRating: QualityRating,
    transcript: string,
    extractedAnswer: string
  ) => void

  nextItem: () => boolean // Returns false if session complete
  pause: () => void
  resume: () => void
  stop: () => void
  reset: () => void
}

// Helper to get question and answer based on direction
function getQuestionAnswer(
  vocabulary: VocabularyItem,
  direction: PracticeDirection,
  itemIndex: number,
  targetLanguage?: Language | null
): {
  question: string
  answer: string
  questionLanguage: Language | 'german'
  answerLanguage: Language | 'german'
} {
  const effectiveDirection =
    direction === 'mixed'
      ? itemIndex % 2 === 0
        ? 'sourceToTarget'
        : 'targetToSource'
      : direction

  if (effectiveDirection === 'targetToSource') {
    return {
      question: vocabulary.targetText,
      answer: vocabulary.sourceText,
      questionLanguage: targetLanguage || 'german',
      answerLanguage: 'german',
    }
  }

  return {
    question: vocabulary.sourceText,
    answer: vocabulary.targetText,
    questionLanguage: 'german',
    answerLanguage: targetLanguage || 'german',
  }
}

export const useVoiceSession = create<VoiceSessionState>((set, get) => ({
  // Initial state
  mode: 'calm',
  direction: 'sourceToTarget',
  sectionIds: [],
  sectionNames: [],
  targetLanguage: null,
  status: 'idle',
  items: [],
  currentIndex: 0,
  isSessionActive: false,
  startTime: null,
  currentQuestion: '',
  currentAnswer: '',
  currentQuestionLanguage: 'german',
  currentAnswerLanguage: 'german',
  lastTranscript: '',
  lastFeedbackWasCorrect: null,
  currentStreak: 0,
  maxStreak: 0,
  listeningStartTime: null,
  lastSpeechTime: null,

  startSession: (config) => {
    // Shuffle items
    const shuffledItems = [...config.items]
      .sort(() => Math.random() - 0.5)
      .map(({ vocabulary, progress }) => ({
        vocabulary,
        progress,
        answered: false,
        correct: undefined,
        qualityRating: undefined,
        userTranscript: undefined,
        extractedAnswer: undefined,
      }))

    // Get first question
    const firstItem = shuffledItems[0]
    const { question, answer, questionLanguage, answerLanguage } = firstItem
      ? getQuestionAnswer(firstItem.vocabulary, config.direction, 0, config.targetLanguage)
      : { question: '', answer: '', questionLanguage: 'german' as const, answerLanguage: 'german' as const }

    set({
      mode: config.mode,
      direction: config.direction,
      sectionIds: config.sectionIds,
      sectionNames: config.sectionNames,
      targetLanguage: config.targetLanguage,
      status: 'intro',
      items: shuffledItems,
      currentIndex: 0,
      isSessionActive: true,
      startTime: new Date(),
      currentQuestion: question,
      currentAnswer: answer,
      currentQuestionLanguage: questionLanguage,
      currentAnswerLanguage: answerLanguage,
      lastTranscript: '',
      lastFeedbackWasCorrect: null,
      currentStreak: 0,
      maxStreak: 0,
      listeningStartTime: null,
      lastSpeechTime: null,
    })
  },

  setStatus: (status) => set({ status }),

  setCurrentQuestion: (question, answer, questionLang, answerLang) =>
    set({
      currentQuestion: question,
      currentAnswer: answer,
      currentQuestionLanguage: questionLang,
      currentAnswerLanguage: answerLang,
    }),

  setLastTranscript: (transcript) => set({ lastTranscript: transcript }),

  setListeningStartTime: (time) => set({ listeningStartTime: time }),

  setLastSpeechTime: (time) => set({ lastSpeechTime: time }),

  recordAnswer: (correct, qualityRating, transcript, extractedAnswer) => {
    const { items, currentIndex, currentStreak, maxStreak } = get()
    const newStreak = correct ? currentStreak + 1 : 0

    set({
      items: items.map((item, index) =>
        index === currentIndex
          ? {
              ...item,
              answered: true,
              correct,
              qualityRating,
              userTranscript: transcript,
              extractedAnswer,
            }
          : item
      ),
      currentStreak: newStreak,
      maxStreak: Math.max(maxStreak, newStreak),
      lastFeedbackWasCorrect: correct,
    })
  },

  nextItem: () => {
    const { items, currentIndex, direction, targetLanguage } = get()
    const nextIndex = currentIndex + 1

    if (nextIndex >= items.length) {
      set({ status: 'summary' })
      return false
    }

    const nextItem = items[nextIndex]
    const { question, answer, questionLanguage, answerLanguage } = getQuestionAnswer(
      nextItem.vocabulary,
      direction,
      nextIndex,
      targetLanguage
    )

    set({
      currentIndex: nextIndex,
      currentQuestion: question,
      currentAnswer: answer,
      currentQuestionLanguage: questionLanguage,
      currentAnswerLanguage: answerLanguage,
      lastTranscript: '',
      lastFeedbackWasCorrect: null,
    })

    return true
  },

  pause: () => {
    const { status } = get()
    if (status !== 'idle' && status !== 'stopped' && status !== 'summary') {
      set({ status: 'paused' })
    }
  },

  resume: () => {
    const { status, currentIndex, items } = get()
    if (status === 'paused') {
      // Resume to asking the current question
      const item = items[currentIndex]
      if (item && !item.answered) {
        set({ status: 'asking' })
      } else {
        // Move to next or summary
        const { nextItem } = get()
        if (!nextItem()) {
          set({ status: 'summary' })
        }
      }
    }
  },

  stop: () => {
    set({
      status: 'stopped',
      isSessionActive: false,
    })
  },

  reset: () => {
    set({
      mode: 'calm',
      direction: 'sourceToTarget',
      sectionIds: [],
      sectionNames: [],
      targetLanguage: null,
      status: 'idle',
      items: [],
      currentIndex: 0,
      isSessionActive: false,
      startTime: null,
      currentQuestion: '',
      currentAnswer: '',
      currentQuestionLanguage: 'german',
      currentAnswerLanguage: 'german',
      lastTranscript: '',
      lastFeedbackWasCorrect: null,
      currentStreak: 0,
      maxStreak: 0,
      listeningStartTime: null,
      lastSpeechTime: null,
    })
  },
}))

// Selectors
export const useVoiceSessionProgress = () =>
  useVoiceSession((state) => ({
    current: state.currentIndex + 1,
    total: state.items.length,
    correct: state.items.filter((i) => i.correct).length,
  }))

export const useVoiceSessionStats = () =>
  useVoiceSession((state) => ({
    correctCount: state.items.filter((i) => i.correct).length,
    incorrectCount: state.items.filter((i) => i.answered && !i.correct).length,
    totalCount: state.items.length,
    maxStreak: state.maxStreak,
    currentStreak: state.currentStreak,
  }))
