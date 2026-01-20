import { create } from 'zustand'
import type {
  VocabularyItem,
  LearningProgress,
  PracticeItem,
  ExerciseType,
  PracticeDirection,
  QualityRating,
} from '@/lib/db/schema'

interface PracticeSessionState {
  // Session configuration
  exerciseType: ExerciseType
  direction: PracticeDirection
  sectionIds: string[]

  // Session state
  items: PracticeItem[]
  currentIndex: number
  isSessionActive: boolean
  isCardFlipped: boolean
  startTime: Date | null

  // Streak tracking
  currentStreak: number
  maxStreak: number

  // Actions
  startSession: (config: {
    exerciseType: ExerciseType
    direction: PracticeDirection
    sectionIds: string[]
    items: { vocabulary: VocabularyItem; progress?: LearningProgress }[]
  }) => void

  recordAnswer: (
    correct: boolean,
    qualityRating: QualityRating,
    userAnswer?: string
  ) => void

  nextItem: () => void
  flipCard: () => void
  endSession: () => void
  reset: () => void
}

// Selectors
export const useCurrentItem = (state: PracticeSessionState) =>
  state.items[state.currentIndex]

export const useSessionProgress = (state: PracticeSessionState) => ({
  current: state.currentIndex + 1,
  total: state.items.length,
  answered: state.items.filter((item) => item.answered).length,
  correct: state.items.filter((item) => item.correct).length,
})

export const useIsSessionComplete = (state: PracticeSessionState) =>
  state.items.length > 0 && state.items.every((item) => item.answered)

export const usePracticeSession = create<PracticeSessionState>((set, get) => ({
  // Initial state
  exerciseType: 'flashcard',
  direction: 'sourceToTarget',
  sectionIds: [],
  items: [],
  currentIndex: 0,
  isSessionActive: false,
  isCardFlipped: false,
  startTime: null,
  currentStreak: 0,
  maxStreak: 0,

  startSession: (config) => {
    // Shuffle items for variety
    const shuffledItems = [...config.items]
      .sort(() => Math.random() - 0.5)
      .map(({ vocabulary, progress }) => ({
        vocabulary,
        progress,
        answered: false,
        correct: undefined,
        qualityRating: undefined,
        userAnswer: undefined,
      }))

    set({
      exerciseType: config.exerciseType,
      direction: config.direction,
      sectionIds: config.sectionIds,
      items: shuffledItems,
      currentIndex: 0,
      isSessionActive: true,
      isCardFlipped: false,
      startTime: new Date(),
      currentStreak: 0,
      maxStreak: 0,
    })
  },

  recordAnswer: (correct, qualityRating, userAnswer) => {
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
              userAnswer,
            }
          : item
      ),
      currentStreak: newStreak,
      maxStreak: Math.max(maxStreak, newStreak),
    })
  },

  nextItem: () => {
    const { items, currentIndex } = get()
    if (currentIndex < items.length - 1) {
      set({
        currentIndex: currentIndex + 1,
        isCardFlipped: false,
      })
    }
  },

  flipCard: () => {
    set((state) => ({ isCardFlipped: !state.isCardFlipped }))
  },

  endSession: () => {
    set({ isSessionActive: false })
  },

  reset: () => {
    set({
      exerciseType: 'flashcard',
      direction: 'sourceToTarget',
      sectionIds: [],
      items: [],
      currentIndex: 0,
      isSessionActive: false,
      isCardFlipped: false,
      startTime: null,
      currentStreak: 0,
      maxStreak: 0,
    })
  },
}))

/**
 * Helper to get question and answer based on direction
 */
export function getQuestionAnswer(
  vocabulary: VocabularyItem,
  direction: PracticeDirection,
  itemIndex: number
): { question: string; answer: string; isReversed: boolean } {
  // For mixed direction, alternate based on index
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
      isReversed: true,
    }
  }

  return {
    question: vocabulary.sourceText,
    answer: vocabulary.targetText,
    isReversed: false,
  }
}
