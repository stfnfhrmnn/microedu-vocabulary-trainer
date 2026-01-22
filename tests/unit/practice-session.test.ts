import { describe, it, expect, beforeEach } from 'vitest'
import { usePracticeSession, getQuestionAnswer } from '@/stores/practice-session'
import type { VocabularyItem, LearningProgress } from '@/lib/db/schema'

// Helper to create mock vocabulary items
function createMockVocabulary(id: string, sourceText: string, targetText: string): VocabularyItem {
  return {
    id,
    sourceText,
    targetText,
    sectionId: 'section-1',
    chapterId: 'chapter-1',
    bookId: 'book-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

// Helper to create mock progress
function createMockProgress(vocabularyId: string): LearningProgress {
  return {
    id: `progress-${vocabularyId}`,
    vocabularyId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(),
    totalReviews: 0,
    correctReviews: 0,
    lastReviewDate: null,
    responseTime: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('Practice Session Store', () => {
  // Reset the store before each test
  beforeEach(() => {
    usePracticeSession.getState().reset()
  })

  describe('initial state', () => {
    it('should have default initial values', () => {
      const state = usePracticeSession.getState()

      expect(state.exerciseType).toBe('flashcard')
      expect(state.direction).toBe('sourceToTarget')
      expect(state.sectionIds).toEqual([])
      expect(state.quizMode).toBe('self')
      expect(state.items).toEqual([])
      expect(state.currentIndex).toBe(0)
      expect(state.isSessionActive).toBe(false)
      expect(state.isCardFlipped).toBe(false)
      expect(state.startTime).toBeNull()
      expect(state.currentStreak).toBe(0)
      expect(state.maxStreak).toBe(0)
    })
  })

  describe('setQuizMode', () => {
    it('should set quiz mode to parent', () => {
      usePracticeSession.getState().setQuizMode('parent')

      expect(usePracticeSession.getState().quizMode).toBe('parent')
    })

    it('should set quiz mode to self', () => {
      usePracticeSession.getState().setQuizMode('parent')
      usePracticeSession.getState().setQuizMode('self')

      expect(usePracticeSession.getState().quizMode).toBe('self')
    })
  })

  describe('startSession', () => {
    it('should start a session with provided configuration', () => {
      const vocab1 = createMockVocabulary('v1', 'das Haus', 'la maison')
      const vocab2 = createMockVocabulary('v2', 'der Hund', 'le chien')

      usePracticeSession.getState().startSession({
        exerciseType: 'multipleChoice',
        direction: 'targetToSource',
        sectionIds: ['section-1'],
        items: [
          { vocabulary: vocab1, progress: createMockProgress('v1') },
          { vocabulary: vocab2, progress: createMockProgress('v2') },
        ],
      })

      const state = usePracticeSession.getState()

      expect(state.exerciseType).toBe('multipleChoice')
      expect(state.direction).toBe('targetToSource')
      expect(state.sectionIds).toEqual(['section-1'])
      expect(state.items).toHaveLength(2)
      expect(state.isSessionActive).toBe(true)
      expect(state.currentIndex).toBe(0)
      expect(state.startTime).toBeInstanceOf(Date)
    })

    it('should initialize items with answered: false', () => {
      const vocab = createMockVocabulary('v1', 'das Haus', 'la maison')

      usePracticeSession.getState().startSession({
        exerciseType: 'flashcard',
        direction: 'sourceToTarget',
        sectionIds: ['section-1'],
        items: [{ vocabulary: vocab }],
      })

      const item = usePracticeSession.getState().items[0]

      expect(item.answered).toBe(false)
      expect(item.correct).toBeUndefined()
      expect(item.qualityRating).toBeUndefined()
      expect(item.userAnswer).toBeUndefined()
    })

    it('should support parent quiz mode', () => {
      const vocab = createMockVocabulary('v1', 'das Haus', 'la maison')

      usePracticeSession.getState().startSession({
        exerciseType: 'flashcard',
        direction: 'sourceToTarget',
        sectionIds: ['section-1'],
        items: [{ vocabulary: vocab }],
        quizMode: 'parent',
      })

      expect(usePracticeSession.getState().quizMode).toBe('parent')
    })

    it('should reset streaks on new session', () => {
      // Set some streak values
      usePracticeSession.setState({ currentStreak: 5, maxStreak: 10 })

      const vocab = createMockVocabulary('v1', 'das Haus', 'la maison')

      usePracticeSession.getState().startSession({
        exerciseType: 'flashcard',
        direction: 'sourceToTarget',
        sectionIds: ['section-1'],
        items: [{ vocabulary: vocab }],
      })

      const state = usePracticeSession.getState()

      expect(state.currentStreak).toBe(0)
      expect(state.maxStreak).toBe(0)
    })
  })

  describe('recordAnswer', () => {
    beforeEach(() => {
      const vocab1 = createMockVocabulary('v1', 'das Haus', 'la maison')
      const vocab2 = createMockVocabulary('v2', 'der Hund', 'le chien')

      usePracticeSession.getState().startSession({
        exerciseType: 'typed',
        direction: 'sourceToTarget',
        sectionIds: ['section-1'],
        items: [
          { vocabulary: vocab1 },
          { vocabulary: vocab2 },
        ],
      })
    })

    it('should record a correct answer', () => {
      usePracticeSession.getState().recordAnswer(true, 5, 'la maison')

      const item = usePracticeSession.getState().items[0]

      expect(item.answered).toBe(true)
      expect(item.correct).toBe(true)
      expect(item.qualityRating).toBe(5)
      expect(item.userAnswer).toBe('la maison')
    })

    it('should record an incorrect answer', () => {
      usePracticeSession.getState().recordAnswer(false, 1, 'wrong answer')

      const item = usePracticeSession.getState().items[0]

      expect(item.answered).toBe(true)
      expect(item.correct).toBe(false)
      expect(item.qualityRating).toBe(1)
    })

    it('should increment streak on correct answer', () => {
      usePracticeSession.getState().recordAnswer(true, 5)
      expect(usePracticeSession.getState().currentStreak).toBe(1)

      usePracticeSession.getState().nextItem()
      usePracticeSession.getState().recordAnswer(true, 5)
      expect(usePracticeSession.getState().currentStreak).toBe(2)
    })

    it('should reset streak on incorrect answer', () => {
      usePracticeSession.getState().recordAnswer(true, 5)
      expect(usePracticeSession.getState().currentStreak).toBe(1)

      usePracticeSession.getState().nextItem()
      usePracticeSession.getState().recordAnswer(false, 1)
      expect(usePracticeSession.getState().currentStreak).toBe(0)
    })

    it('should track max streak', () => {
      usePracticeSession.getState().recordAnswer(true, 5)
      usePracticeSession.getState().nextItem()
      usePracticeSession.getState().recordAnswer(true, 5)

      const state = usePracticeSession.getState()

      expect(state.currentStreak).toBe(2)
      expect(state.maxStreak).toBe(2)
    })
  })

  describe('nextItem', () => {
    beforeEach(() => {
      const vocab1 = createMockVocabulary('v1', 'das Haus', 'la maison')
      const vocab2 = createMockVocabulary('v2', 'der Hund', 'le chien')
      const vocab3 = createMockVocabulary('v3', 'die Katze', 'le chat')

      usePracticeSession.getState().startSession({
        exerciseType: 'flashcard',
        direction: 'sourceToTarget',
        sectionIds: ['section-1'],
        items: [
          { vocabulary: vocab1 },
          { vocabulary: vocab2 },
          { vocabulary: vocab3 },
        ],
      })
    })

    it('should advance to next item', () => {
      expect(usePracticeSession.getState().currentIndex).toBe(0)

      usePracticeSession.getState().nextItem()

      expect(usePracticeSession.getState().currentIndex).toBe(1)
    })

    it('should reset isCardFlipped when advancing', () => {
      usePracticeSession.getState().flipCard()
      expect(usePracticeSession.getState().isCardFlipped).toBe(true)

      usePracticeSession.getState().nextItem()

      expect(usePracticeSession.getState().isCardFlipped).toBe(false)
    })

    it('should not advance past last item', () => {
      usePracticeSession.getState().nextItem() // index 1
      usePracticeSession.getState().nextItem() // index 2
      usePracticeSession.getState().nextItem() // should stay at 2

      expect(usePracticeSession.getState().currentIndex).toBe(2)
    })
  })

  describe('flipCard', () => {
    it('should toggle card flipped state', () => {
      const vocab = createMockVocabulary('v1', 'das Haus', 'la maison')

      usePracticeSession.getState().startSession({
        exerciseType: 'flashcard',
        direction: 'sourceToTarget',
        sectionIds: ['section-1'],
        items: [{ vocabulary: vocab }],
      })

      expect(usePracticeSession.getState().isCardFlipped).toBe(false)

      usePracticeSession.getState().flipCard()
      expect(usePracticeSession.getState().isCardFlipped).toBe(true)

      usePracticeSession.getState().flipCard()
      expect(usePracticeSession.getState().isCardFlipped).toBe(false)
    })
  })

  describe('endSession', () => {
    it('should set session as inactive', () => {
      const vocab = createMockVocabulary('v1', 'das Haus', 'la maison')

      usePracticeSession.getState().startSession({
        exerciseType: 'flashcard',
        direction: 'sourceToTarget',
        sectionIds: ['section-1'],
        items: [{ vocabulary: vocab }],
      })

      expect(usePracticeSession.getState().isSessionActive).toBe(true)

      usePracticeSession.getState().endSession()

      expect(usePracticeSession.getState().isSessionActive).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const vocab = createMockVocabulary('v1', 'das Haus', 'la maison')

      usePracticeSession.getState().startSession({
        exerciseType: 'typed',
        direction: 'targetToSource',
        sectionIds: ['section-1'],
        items: [{ vocabulary: vocab }],
        quizMode: 'parent',
      })

      usePracticeSession.getState().recordAnswer(true, 5)
      usePracticeSession.getState().flipCard()

      usePracticeSession.getState().reset()

      const state = usePracticeSession.getState()

      expect(state.exerciseType).toBe('flashcard')
      expect(state.direction).toBe('sourceToTarget')
      expect(state.sectionIds).toEqual([])
      expect(state.quizMode).toBe('self')
      expect(state.items).toEqual([])
      expect(state.currentIndex).toBe(0)
      expect(state.isSessionActive).toBe(false)
      expect(state.isCardFlipped).toBe(false)
      expect(state.startTime).toBeNull()
      expect(state.currentStreak).toBe(0)
      expect(state.maxStreak).toBe(0)
    })
  })
})

describe('getQuestionAnswer', () => {
  const vocabulary: VocabularyItem = {
    id: 'v1',
    sourceText: 'das Haus',
    targetText: 'la maison',
    sectionId: 'section-1',
    chapterId: 'chapter-1',
    bookId: 'book-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('sourceToTarget direction', () => {
    it('should return source as question and target as answer', () => {
      const result = getQuestionAnswer(vocabulary, 'sourceToTarget', 0)

      expect(result.question).toBe('das Haus')
      expect(result.answer).toBe('la maison')
      expect(result.isReversed).toBe(false)
      expect(result.questionLanguage).toBe('german')
    })
  })

  describe('targetToSource direction', () => {
    it('should return target as question and source as answer', () => {
      const result = getQuestionAnswer(vocabulary, 'targetToSource', 0)

      expect(result.question).toBe('la maison')
      expect(result.answer).toBe('das Haus')
      expect(result.isReversed).toBe(true)
      expect(result.answerLanguage).toBe('german')
    })
  })

  describe('mixed direction', () => {
    it('should alternate based on item index', () => {
      const result0 = getQuestionAnswer(vocabulary, 'mixed', 0)
      const result1 = getQuestionAnswer(vocabulary, 'mixed', 1)
      const result2 = getQuestionAnswer(vocabulary, 'mixed', 2)
      const result3 = getQuestionAnswer(vocabulary, 'mixed', 3)

      // Even indexes: sourceToTarget
      expect(result0.question).toBe('das Haus')
      expect(result0.isReversed).toBe(false)

      // Odd indexes: targetToSource
      expect(result1.question).toBe('la maison')
      expect(result1.isReversed).toBe(true)

      // Pattern continues
      expect(result2.isReversed).toBe(false)
      expect(result3.isReversed).toBe(true)
    })
  })

  describe('with target language', () => {
    it('should include target language in result', () => {
      const result = getQuestionAnswer(vocabulary, 'sourceToTarget', 0, 'french')

      expect(result.questionLanguage).toBe('german')
      expect(result.answerLanguage).toBe('french')
    })

    it('should use target language for question language when reversed', () => {
      const result = getQuestionAnswer(vocabulary, 'targetToSource', 0, 'french')

      expect(result.questionLanguage).toBe('french')
      expect(result.answerLanguage).toBe('german')
    })
  })
})
